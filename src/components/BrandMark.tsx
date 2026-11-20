import { Fish, Waves } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BrandMarkProps {
  name: string
  light?: boolean
  compact?: boolean
  className?: string
}

export default function BrandMark({
  name,
  light = false,
  compact = false,
  className,
}: BrandMarkProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span
        className={cn(
          'relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl border shadow-sm',
          light
            ? 'border-white/15 bg-white/10 text-amber-300'
            : 'border-primary/10 bg-primary text-secondary',
        )}
      >
        <Fish className="h-6 w-6" />
        <Waves className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-accent p-0.5 text-accent-foreground" />
      </span>
      {!compact && (
        <span className="min-w-0">
          <strong
            className={cn(
              'font-display block truncate text-lg leading-tight',
              light ? 'text-white' : 'text-foreground',
            )}
          >
            {name}
          </strong>
          <span
            className={cn(
              'block text-[10px] font-bold uppercase tracking-[0.2em]',
              light ? 'text-white/50' : 'text-muted-foreground',
            )}
          >
            Pesqueiro & Restaurante
          </span>
        </span>
      )}
    </div>
  )
}
