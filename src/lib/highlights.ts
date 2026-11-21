import type { MenuItem } from '@/types'

export function isHighlightItem(item: Pick<MenuItem, 'destaque' | 'destaque_posicao'>): boolean {
  return Boolean(item.destaque) && (item.destaque_posicao ?? 0) > 0
}

/**
 * Ordena destaques pela posição dentro da categoria; não-destaques vão para o fim.
 */
export function sortHighlightsFirst(items: MenuItem[]): MenuItem[] {
  return [...items].sort((a, b) => {
    const aHl = isHighlightItem(a)
    const bHl = isHighlightItem(b)
    if (aHl !== bHl) return aHl ? -1 : 1
    if (aHl && bHl) {
      const catDiff = (a.categoria_id || '').localeCompare(b.categoria_id || '')
      if (catDiff !== 0) return catDiff
      return (a.destaque_posicao ?? 0) - (b.destaque_posicao ?? 0)
    }
    return 0
  })
}
