import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function EmptyState({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: LucideIcon
  title: string
  description: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/25 px-6 text-center',
        className,
      )}
    >
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/8 text-primary">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
