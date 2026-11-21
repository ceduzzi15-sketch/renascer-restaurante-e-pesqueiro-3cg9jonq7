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
          light ? 'border-amber-300/30 bg-white/10' : 'border-primary/10 bg-primary',
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke={light ? '#e5c158' : '#e5c158'}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-7 w-7"
          aria-hidden="true"
        >
          <path d="M2 12c2.5-4.5 6-7 10-7 3.2 0 6 1.8 8.5 5.2a2.2 2.2 0 0 1 0 3.6C18 17.2 15.2 19 12 19c-4 0-7.5-2.5-10-7Z" />
          <circle cx="16.4" cy="10.2" r="1" fill={light ? '#e5c158' : '#e5c158'} stroke="none" />
          <path d="M2 12c2 0 4-.4 5.5-1.2M2 12c2 0 4 .4 5.5 1.2" />
          <path d="M12 5c-1 1.8-1 4.2 0 7M12 19c-1-1.8-1-4.2 0-7" opacity={0.55} />
          <path d="M6.5 20.5c1.5-1.2 3.5-1.2 5 0 1.5 1.2 3.5 1.2 5 0" opacity={0.7} />
        </svg>
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
