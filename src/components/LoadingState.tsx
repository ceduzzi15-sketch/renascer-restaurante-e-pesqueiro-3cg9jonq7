import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LoadingState({
  label = 'Carregando...',
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex min-h-48 items-center justify-center gap-3 text-sm text-muted-foreground',
        className,
      )}
    >
      <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
      {label}
    </div>
  )
}
