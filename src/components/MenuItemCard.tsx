import { ImagePlus, Pencil, Star, Trash2 } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { isHighlightItem } from '@/lib/highlights'
import { getFileUrl, formatCurrency } from '@/services/api'
import type { MenuItem } from '@/types'
import { cn } from '@/lib/utils'

const canManageMenu = (role?: string) => role === 'gestor' || role === 'atendimento'

interface MenuItemCardProps {
  item: MenuItem
  onEdit?: (item: MenuItem) => void
  onDelete?: (item: MenuItem) => void
  onToggleHighlight?: (item: MenuItem) => void
  onAddPhoto?: (item: MenuItem) => void
}

export default function MenuItemCard({
  item,
  onEdit,
  onDelete,
  onToggleHighlight,
  onAddPhoto,
}: MenuItemCardProps) {
  const { user } = useAuth()
  const canManage = canManageMenu(user?.role)
  const highlight = isHighlightItem(item)
  const imageUrl = item.image
    ? getFileUrl(item, item.image)
    : item.image_url || 'https://img.usecurling.com/p/640/480?q=restaurant'

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          onError={(event) => {
            event.currentTarget.src = 'https://img.usecurling.com/p/640/480?q=restaurant'
          }}
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {item.category_name && <Badge variant="secondary">{item.category_name}</Badge>}
          {item.subcategoria && <Badge variant="outline">{item.subcategoria}</Badge>}
        </div>
        {highlight && (
          <Badge className="absolute top-2 right-2 gap-1 border-[#d4af37] bg-[#d4af37] font-condensed text-[10px] font-bold uppercase tracking-widest text-[#0d271e]">
            <Star className="h-3 w-3" /> Destaque
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-condensed text-lg font-bold uppercase tracking-wide">
              {item.name}
            </h3>
            {(item.observacao || item.description) && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {item.observacao || item.description}
              </p>
            )}
          </div>
          <span className="font-condensed text-lg font-bold text-primary">
            {formatCurrency(item.price)}
          </span>
        </div>
      </CardContent>
      {canManage && (
        <CardFooter className="gap-2 border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => onAddPhoto?.(item)}
            aria-label="Inserir foto do item"
          >
            <ImagePlus className="h-4 w-4" /> Foto
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => onToggleHighlight?.(item)}
            aria-label="Alternar destaque"
          >
            <Star className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => onEdit?.(item)}
            aria-label="Editar item"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-destructive hover:text-destructive"
            onClick={() => onDelete?.(item)}
            aria-label="Excluir item"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
