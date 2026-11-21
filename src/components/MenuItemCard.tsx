import { ImagePlus, Pencil, ShoppingBag, Sparkles, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, getFileUrl } from '@/services/api'
import { LOCAL_PHOTOS } from '@/lib/assets'
import { isHighlightItem } from '@/lib/highlights'
import { cn } from '@/lib/utils'
import type { MenuCategory, MenuCategoryRecord, MenuItem } from '@/types'

const labels: Record<MenuCategory, string> = {
  comida: 'Comidas',
  porcao: 'Porções',
  bebida: 'Bebidas',
}

interface MenuItemCardProps {
  item: MenuItem
  index: number
  category?: MenuCategoryRecord
  onEdit: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
  onCategoryArt: (category: MenuCategoryRecord) => void
}

export default function MenuItemCard({
  item,
  index,
  category,
  onEdit,
  onDelete,
  onCategoryArt,
}: MenuItemCardProps) {
  const { user } = useAuth()

  const image = item.image
    ? getFileUrl(item, item.image, '600x400')
    : item.image_url ||
      (item.category === 'bebida'
        ? LOCAL_PHOTOS.lake
        : index % 2
          ? LOCAL_PHOTOS.fish
          : LOCAL_PHOTOS.dish)

  const categoryBadgeLabel = item.category_name || labels[item.category] || 'Prato'
  const artUrl = category?.art_image ? getFileUrl(category, category.art_image, '200x200') : ''

  return (
    <article
      className={cn(
        'group flex flex-col justify-between overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:shadow-md',
        isHighlightItem(item) && 'border-[#d4af37] shadow-[0_0_0_1px_rgba(212,175,55,0.45)]',
      )}
    >
      <div>
        <div className="relative h-40 overflow-hidden bg-muted">
          <img
            src={image}
            alt={item.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          <Badge className="absolute left-3 top-3 border border-[#d4af37]/40 bg-[#0d271e] font-condensed text-xs uppercase tracking-wider text-[#e5c158]">
            {categoryBadgeLabel}
          </Badge>
          {item.subcategoria && (
            <span className="absolute bottom-2.5 left-3 text-xs font-medium text-white/90 drop-shadow">
              {item.subcategoria}
            </span>
          )}
          {!item.active && (
            <Badge variant="destructive" className="absolute right-3 top-3">
              Indisponível
            </Badge>
          )}
          {isHighlightItem(item) && (
            <Badge className="absolute right-3 top-3 border border-[#d4af37] bg-[#d4af37] font-condensed text-[11px] font-bold uppercase tracking-wider text-[#0d271e]">
              <Sparkles className="mr-1 h-3 w-3" /> Destaque
            </Badge>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              {item.ordem ? (
                <span className="mr-1.5 font-mono text-[11px] font-bold text-muted-foreground">
                  #{item.ordem}
                </span>
              ) : null}
              <h2 className="font-condensed text-xl font-bold uppercase tracking-wide text-foreground transition group-hover:text-primary">
                {item.name}
              </h2>
            </div>
            {category && (
              <button
                type="button"
                onClick={() => onCategoryArt(category)}
                title={`Arte da categoria ${category.name}`}
                className="shrink-0 rounded-full border border-[#d4af37]/30 p-0.5 transition hover:border-[#d4af37]"
              >
                {artUrl ? (
                  <img
                    src={artUrl}
                    alt={`Arte da categoria ${category.name}`}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-[#e5c158]">
                    <ImagePlus className="h-3.5 w-3.5" />
                  </span>
                )}
              </button>
            )}
          </div>

          {(item.observacao || item.description) && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {item.observacao || item.description}
            </p>
          )}
        </div>
      </div>

      <div className="border-t bg-muted/20 p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="block text-xs text-muted-foreground">Preço</span>
            <span className="font-condensed text-xl font-extrabold text-primary">
              {item.preco_formatado || formatCurrency(item.price)}
            </span>
          </div>

          {user?.role === 'cliente' ? (
            <Button size="sm" asChild className="bg-primary">
              <a href="/app/comandas">
                <ShoppingBag className="mr-1.5 h-4 w-4" /> Pedir
              </a>
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => onEdit(item)} aria-label="Editar">
                <Pencil className="h-4 w-4" />
              </Button>
              {user?.role === 'gestor' && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onDelete(item)}
                  className="text-destructive hover:text-destructive"
                  aria-label="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
