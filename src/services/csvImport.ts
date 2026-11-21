import { createRecord, listRecords, updateRecord } from '@/services/api'
import type { MenuCategory, MenuCategoryRecord, MenuItem } from '@/types'

export interface ParsedCsvResult {
  type: 'categories' | 'items' | 'highlights'
  delimiter: ';' | ','
  rowCount: number
  headers: string[]
  previewRows: Array<Record<string, string>>
  categoriesToUpsert?: Array<{
    category_id: string
    name: string
    subtitle: string
    order: number
    item_count: number
    art_svg: string
    art_png: string
  }>
  itemsToUpsert?: Array<{
    ordem: number
    categoria_id: string
    category_name: string
    subcategoria: string
    name: string
    observacao: string
    price: number
    preco_formatado: string
    categoria_ordem: number
    category: MenuCategory
  }>
  highlightsToApply?: Array<{
    categoria_id: string
    name: string
    destaque_posicao: number
    price: number
    preco_formatado: string
  }>
}

/**
 * Detecta o delimitador (; ou ,) examinando a linha de cabeçalho
 */
export function detectDelimiter(headerLine: string): ';' | ',' {
  const semicolonCount = (headerLine.match(/;/g) || []).length
  const commaCount = (headerLine.match(/,/g) || []).length
  return semicolonCount >= commaCount ? ';' : ','
}

/**
 * Divide uma linha CSV respeitando aspas duplas
 */
export function parseCsvLine(line: string, delimiter: ';' | ','): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

/**
 * Converte valor numérico de preço com vírgula ou ponto para float padrão
 */
export function parseDecimalPrice(raw: string | undefined): number {
  if (!raw) return 0
  const cleaned = raw.replace(/[^\d.,]/g, '').trim()
  if (!cleaned) return 0

  // Se contiver vírgula, assume formato brasileiro (ex: 25,00 ou 1.250,50)
  if (cleaned.includes(',')) {
    const normalized = cleaned.replace(/\./g, '').replace(',', '.')
    const parsed = parseFloat(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }

  // Se tiver só ponto ou nada
  const parsed = parseFloat(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Mapeia categoria_id para um dos valores válidos de select ('comida' | 'porcao' | 'bebida')
 * para preservar total compatibilidade com a collection existente do PocketBase
 */
export function mapToSelectCategory(categoriaId: string, categoryName?: string): MenuCategory {
  const id = (categoriaId || '').toLowerCase()
  const name = (categoryName || '').toLowerCase()

  if (
    id.includes('porcao') ||
    id.includes('porcoes') ||
    name.includes('porção') ||
    name.includes('porções') ||
    name.includes('petisco')
  ) {
    return 'porcao'
  }

  if (
    id.includes('cerveja') ||
    id.includes('long-neck') ||
    id.includes('lata') ||
    id.includes('bebida') ||
    id.includes('drink') ||
    id.includes('destilado') ||
    id.includes('sem-alcool') ||
    id.includes('suco') ||
    id.includes('refrigerante') ||
    id.includes('bar') ||
    name.includes('bebida') ||
    name.includes('cerveja') ||
    name.includes('drink') ||
    name.includes('destilado')
  ) {
    return 'bebida'
  }

  return 'comida'
}

/**
 * Faz o parse completo de um texto CSV de categorias ou itens
 */
export function parseMenuCsv(content: string): ParsedCsvResult {
  const lines = content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (lines.length === 0) {
    throw new Error('O arquivo CSV está vazio.')
  }

  const headerLine = lines[0]
  const delimiter = detectDelimiter(headerLine)
  const headers = parseCsvLine(headerLine, delimiter).map((h) =>
    h.toLowerCase().replace(/['"]/g, '').trim(),
  )

  // Arquivo de DESTAQUES: categoria_id + posicao + item (marca itens existentes como destaque)
  const isHighlightFile =
    headers.includes('posicao') &&
    headers.includes('item') &&
    headers.includes('categoria_id') &&
    !headers.includes('subtitulo')

  const isCategoryFile =
    !isHighlightFile &&
    headers.includes('categoria_id') &&
    (headers.includes('arquivo_arte_svg') ||
      headers.includes('arquivo_arte_png') ||
      headers.includes('qtd_itens') ||
      (headers.includes('subtitulo') && !headers.includes('item')) ||
      // Formato alternativo: uma linha por arte, com colunas de arquivo/formato
      (headers.includes('arquivo') && headers.includes('formato') && !headers.includes('item')))

  const isItemFile =
    !isHighlightFile &&
    (headers.includes('item') ||
      headers.includes('preco') ||
      headers.includes('preco_centavos') ||
      headers.includes('subcategoria'))

  if (!isCategoryFile && !isItemFile && !isHighlightFile) {
    throw new Error(
      'Formato de colunas não reconhecido. O CSV deve ser de Categorias (ordem, categoria_id, nome...), de Itens (ordem, categoria_id, item, preco...) ou de Destaques (categoria_id, posicao, item, preco...).',
    )
  }

  const rawRows: Array<Record<string, string>> = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i], delimiter)
    if (values.length === 0 || values.every((v) => !v)) continue
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? ''
    })
    rawRows.push(row)
  }

  // Destaques: marca o item correspondente (categoria_id + nome) como destaque
  if (isHighlightFile) {
    const highlightsToApply = rawRows
      .map((r) => {
        const rawPrice = r.preco || ''
        return {
          categoria_id: (r.categoria_id || '').trim().toLowerCase(),
          name: (r.item || '').trim(),
          destaque_posicao: parseInt(r.posicao || '0', 10) || 0,
          price: parseDecimalPrice(rawPrice),
          preco_formatado: (r.preco_formatado || '').trim(),
        }
      })
      .filter((h) => h.categoria_id && h.name && h.destaque_posicao > 0)

    return {
      type: 'highlights',
      delimiter,
      rowCount: highlightsToApply.length,
      headers,
      previewRows: rawRows.slice(0, 5),
      highlightsToApply,
    }
  }

  if (isCategoryFile) {
    const categoriesToUpsert = rawRows
      .map((r) => ({
        category_id: (r.categoria_id || '').trim().toLowerCase(),
        name: (r.nome || r.categoria || r.name || '').trim(),
        subtitle: (r.subtitulo || r.subtitle || '').trim(),
        order: parseInt(r.ordem || '0', 10) || 0,
        item_count: parseInt(r.qtd_itens || '0', 10) || 0,
        art_svg: (r.arquivo_arte_svg || '').trim(),
        art_png: (r.arquivo_arte_png || '').trim(),
      }))
      .filter((c) => c.category_id && c.name)

    return {
      type: 'categories',
      delimiter,
      rowCount: categoriesToUpsert.length,
      headers,
      previewRows: rawRows.slice(0, 5),
      categoriesToUpsert,
    }
  }

  // Itens
  const itemsToUpsert = rawRows
    .map((r) => {
      const rawPrice = r.preco || ''
      const rawCents = r.preco_centavos || ''
      let price = 0

      if (rawCents && !rawPrice) {
        const cents = parseInt(rawCents, 10)
        price = Number.isFinite(cents) ? cents / 100 : 0
      } else {
        price = parseDecimalPrice(rawPrice)
      }

      const categoriaId = (r.categoria_id || '').trim().toLowerCase()
      const categoriaName = (r.categoria || r.category || '').trim()
      const selectCat = mapToSelectCategory(categoriaId, categoriaName)

      const precoFormatado =
        r.preco_formatado ||
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)

      return {
        ordem: parseInt(r.ordem || '0', 10) || 0,
        categoria_id: categoriaId,
        category_name: categoriaName,
        subcategoria: (r.subcategoria || '').trim(),
        name: (r.item || r.nome || '').trim(),
        observacao: (r.observacao || '').trim(),
        price,
        preco_formatado: precoFormatado,
        categoria_ordem: parseInt(r.categoria_ordem || '0', 10) || 0,
        category: selectCat,
      }
    })
    .filter((i) => i.name)

  return {
    type: 'items',
    delimiter,
    rowCount: itemsToUpsert.length,
    headers,
    previewRows: rawRows.slice(0, 5),
    itemsToUpsert,
  }
}

/**
 * Executa o upsert idempotente no PocketBase
 */
export async function importMenuData(
  parsed: ParsedCsvResult,
  onProgress?: (current: number, total: number) => void,
): Promise<{ added: number; updated: number; skipped: number }> {
  let added = 0
  let updated = 0
  let skipped = 0

  if (parsed.type === 'categories') {
    const list = parsed.categoriesToUpsert || []
    const existingCategories = await listRecords<MenuCategoryRecord>('menu_categories')
    const byCatId = new Map<string, MenuCategoryRecord>()
    existingCategories.forEach((c) => byCatId.set(c.category_id.toLowerCase(), c))

    for (let i = 0; i < list.length; i++) {
      const cat = list[i]
      const existing = byCatId.get(cat.category_id.toLowerCase())
      const payload = {
        category_id: cat.category_id,
        name: cat.name,
        subtitle: cat.subtitle,
        order: cat.order,
        item_count: cat.item_count,
        art_svg: cat.art_svg,
        art_png: cat.art_png,
      }

      if (existing) {
        await updateRecord('menu_categories', existing.id, payload)
        updated++
      } else {
        const created = await createRecord<MenuCategoryRecord>('menu_categories', payload)
        byCatId.set(cat.category_id.toLowerCase(), created)
        added++
      }

      onProgress?.(i + 1, list.length)
    }

    return { added, updated, skipped }
  }

  // Destaques: marca itens existentes como destaque (upsert idempotente por
  // categoria_id + nome normalizado; atualiza em vez de duplicar)
  if (parsed.type === 'highlights') {
    const list = parsed.highlightsToApply || []
    const existingItems = await listRecords<MenuItem>('menu_items')

    const byCategoryAndName = new Map<string, MenuItem>()
    const byNameOnly = new Map<string, MenuItem>()
    existingItems.forEach((item) => {
      const normName = item.name.trim().toLowerCase()
      const catId = (item.categoria_id || '').trim().toLowerCase()
      if (catId) byCategoryAndName.set(`${catId}:::${normName}`, item)
      byNameOnly.set(normName, item)
    })

    for (let i = 0; i < list.length; i++) {
      const highlight = list[i]
      const normName = highlight.name.trim().toLowerCase()
      const existing =
        byCategoryAndName.get(`${highlight.categoria_id}:::${normName}`) || byNameOnly.get(normName)

      if (!existing) {
        skipped++
      } else {
        await updateRecord('menu_items', existing.id, {
          destaque: true,
          destaque_posicao: highlight.destaque_posicao,
        })
        updated++
      }

      onProgress?.(i + 1, list.length)
    }

    return { added, updated, skipped }
  }

  // Itens
  const list = parsed.itemsToUpsert || []
  const existingItems = await listRecords<MenuItem>('menu_items')

  // Mapeamos existentes por chave composta:
  // 1) categoria_id + item_name (normalizado)
  // 2) ou apenas item_name (normalizado)
  // 3) ou ordem quando fornecido
  const byCategoryAndName = new Map<string, MenuItem>()
  const byNameOnly = new Map<string, MenuItem>()
  const byOrder = new Map<number, MenuItem>()

  existingItems.forEach((item) => {
    const normName = item.name.trim().toLowerCase()
    const catId = (item.categoria_id || '').trim().toLowerCase()
    if (catId) {
      byCategoryAndName.set(`${catId}:::${normName}`, item)
    }
    byNameOnly.set(normName, item)
    if (item.ordem !== undefined && item.ordem !== null && item.ordem > 0) {
      byOrder.set(item.ordem, item)
    }
  })

  // Também podemos auto-registrar as categorias encontradas nos itens se menu_categories estiver vazio
  const autoCategories = new Map<string, { name: string; order: number }>()
  list.forEach((item) => {
    if (item.categoria_id && !autoCategories.has(item.categoria_id)) {
      autoCategories.set(item.categoria_id, {
        name: item.category_name || item.categoria_id,
        order: item.categoria_ordem || 0,
      })
    }
  })

  if (autoCategories.size > 0) {
    try {
      const existingCats = await listRecords<MenuCategoryRecord>('menu_categories')
      const existingCatIds = new Set(existingCats.map((c) => c.category_id.toLowerCase()))
      for (const [catId, meta] of autoCategories.entries()) {
        if (!existingCatIds.has(catId)) {
          await createRecord<MenuCategoryRecord>('menu_categories', {
            category_id: catId,
            name: meta.name,
            order: meta.order,
          })
          existingCatIds.add(catId)
        }
      }
    } catch {
      // Ignora erro se já existir ou regras
    }
  }

  for (let i = 0; i < list.length; i++) {
    const item = list[i]
    const normName = item.name.trim().toLowerCase()
    const keyCatName = `${item.categoria_id}:::${normName}`

    // Upsert por categoria_id + nome, ou por ordem se existir, ou por nome
    const existing =
      byCategoryAndName.get(keyCatName) ||
      (item.ordem > 0 ? byOrder.get(item.ordem) : undefined) ||
      byNameOnly.get(normName)

    const payload: Record<string, unknown> = {
      name: item.name,
      description: item.observacao || item.subcategoria || '',
      category: item.category,
      price: item.price,
      active: true,
      categoria_id: item.categoria_id,
      category_name: item.category_name,
      subcategoria: item.subcategoria,
      observacao: item.observacao,
      ordem: item.ordem,
      categoria_ordem: item.categoria_ordem,
      preco_formatado: item.preco_formatado,
    }

    if (existing) {
      await updateRecord('menu_items', existing.id, payload)
      updated++
    } else {
      const created = await createRecord<MenuItem>('menu_items', payload)
      byCategoryAndName.set(keyCatName, created)
      byNameOnly.set(normName, created)
      if (item.ordem > 0) byOrder.set(item.ordem, created)
      added++
    }

    onProgress?.(i + 1, list.length)
  }

  return { added, updated, skipped }
}
