import { useEffect, useState } from 'react'
import { Search, UtensilsCrossed } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { fetchMenuFolders, groupCategoriesByFolder, itemsOfCategory } from '@/services/menu'
import { getFileUrl, getPublicMenu, getMenuCategories, formatCurrency } from '@/services/api'
import { isHighlightItem, sortHighlightsFirst } from '@/lib/highlights'
import LoadingState from '@/components/LoadingState'
import EmptyState from '@/components/EmptyState'
import type { MenuCategoryRecord, MenuFolder, MenuItem } from '@/types'

/**
 * Visualização SOMENTE LEITURA do cardápio para o papel cliente.
 * Mostra nome, descrição, foto e valor — sem nenhum controle de edição.
 * A manutenção (fotos, valores, nomes) fica exclusivamente em /app/cardapio,
 * acessível a gestor e atendimento.
 */
export default function CustomerMenuView() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<MenuCategoryRecord[]>([])
  const [folders, setFolders] = useState<MenuFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    void Promise.all([getPublicMenu(), getMenuCategories(), fetchMenuFolders()])
      .then(([menuData, catData, folderData]) => {
        setItems(menuData)
        setCategories(catData)
        setFolders(folderData)
      })
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [])

  const sections = groupCategoriesByFolder(categories, folders)
  const term = search.trim().toLowerCase()
  const total = items.filter((item) => !term || item.name.toLowerCase().includes(term)).length

  if (loading) return <LoadingState />

  return (
    <div className="page-shell space-y-6">
      <header>
        <p className="eyebrow mb-2">Restaurante</p>
        <h1 className="page-heading">Cardápio</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Consulte os itens disponíveis — para pedir, chame a equipe ou use sua comanda.
        </p>
      </header>

      <div className="soft-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar item do cardápio"
            className="pl-9"
          />
        </div>
      </div>

      {total === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title={term ? 'Nenhum item encontrado' : 'Cardápio em atualização'}
          description={
            term
              ? 'Tente buscar por outro nome.'
              : 'Os itens aparecem aqui assim que a equipe cadastrar o cardápio.'
          }
        />
      ) : (
        <div className="space-y-8">
          {sections.map((section) => {
            const visibleCategories = section.categories
              .map((category) => ({
                category,
                catItems: sortHighlightsFirst(
                  itemsOfCategory(items, category.id).filter(
                    (item) => !term || item.name.toLowerCase().includes(term),
                  ),
                ),
              }))
              .filter(({ catItems }) => catItems.length > 0)
            if (visibleCategories.length === 0) return null
            return (
              <section key={section.folder?.id ?? 'geral'}>
                <h2 className="mb-4 font-cinzel text-xl font-bold uppercase tracking-wide text-primary">
                  {section.folder?.name ?? 'Cardápio'}
                </h2>
                {visibleCategories.map(({ category, catItems }) => (
                  <div key={category.id} className="mb-6">
                    <h3 className="mb-3 flex items-center gap-2 font-condensed text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      {category.art_image && (
                        <img
                          src={getFileUrl(category, category.art_image, '100x100')}
                          alt=""
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      )}
                      {category.name}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {catItems.map((item) => {
                        const highlight = isHighlightItem(item)
                        const imageUrl = item.image
                          ? getFileUrl(item, item.image, '600x400')
                          : item.image_url
                        return (
                          <article
                            key={item.id}
                            className="soft-card overflow-hidden p-0 transition hover:shadow-md"
                          >
                            {imageUrl && (
                              <img
                                src={imageUrl}
                                alt={item.name}
                                className="aspect-video w-full object-cover"
                              />
                            )}
                            <div className="space-y-1.5 p-4">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-condensed text-base font-bold uppercase tracking-wide">
                                  {item.name}
                                </h4>
                                <span className="font-condensed text-base font-bold text-primary">
                                  {formatCurrency(item.price)}
                                </span>
                              </div>
                              {(item.observacao || item.description) && (
                                <p className="text-xs leading-relaxed text-muted-foreground">
                                  {item.observacao || item.description}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {item.subcategoria && (
                                  <Badge variant="outline">{item.subcategoria}</Badge>
                                )}
                                {highlight && (
                                  <Badge className="border-[#d4af37] bg-[#d4af37] text-[#0d271e]">
                                    Destaque
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
