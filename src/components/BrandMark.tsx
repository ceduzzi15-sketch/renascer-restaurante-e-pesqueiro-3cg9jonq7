import { cn } from '@/lib/utils'
import LogoEmblem from '@/components/LogoEmblem'

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
          light ? 'border-amber-300/30 bg-white/10' : 'border-primary/10 bg-primary',
        )}
      >
        <LogoEmblem className="h-11 w-11 rounded-2xl" />
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
            Restaurante e Pesqueiro
          </span>
        </span>
      )}
    </div>
  )
}
