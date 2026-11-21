import { listRecords } from '@/services/api'
import type { MenuCategoryRecord, MenuFolder, MenuItem } from '@/types'

export interface MenuSection {
  folder: MenuFolder | null
  categories: MenuCategoryRecord[]
}

/**
 * Agrupa as categorias do cardápio pelas pastas (setores) definidas no painel.
 * Categorias sem pasta ficam na seção "Cardápio" (folder = null), no fim da lista.
 */
export function groupCategoriesByFolder(
  categories: MenuCategoryRecord[],
  folders: MenuFolder[],
): MenuSection[] {
  const orderedFolders = [...folders].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const sections: MenuSection[] = orderedFolders.map((folder) => ({
    folder,
    categories: [],
  }))
  const loose: MenuCategoryRecord[] = []
  for (const category of categories) {
    const section = sections.find((item) => item.folder?.id === category.folder)
    if (section) section.categories.push(category)
    else loose.push(category)
  }
  for (const section of sections) {
    section.categories.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }
  if (loose.length > 0) {
    sections.push({
      folder: null,
      categories: loose.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    })
  }
  return sections.filter((section) => section.categories.length > 0)
}

export async function fetchMenuFolders() {
  try {
    return await listRecords<MenuFolder>('menu_folders', { sort: 'order,name' })
  } catch {
    // Coleção pode não existir ainda em bases antigas — degrada sem pastas.
    return [] as MenuFolder[]
  }
}

export async function fetchMenuCategories() {
  return listRecords<MenuCategoryRecord>('menu_categories', { sort: 'order,name' })
}

export async function fetchMenuItems() {
  return listRecords<MenuItem>('menu_items', {
    filter: 'active = true',
    sort: 'categoria_ordem,ordem,category,name',
  })
}

export function itemsOfCategory(items: MenuItem[], categoryId: string) {
  return items.filter(
    (item) => item.categoria_id === categoryId || (item.category_name ?? '') === categoryId,
  )
}
