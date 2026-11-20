import { ArrowLeft, Fish } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-primary px-6 text-primary-foreground">
      <div className="max-w-md text-center">
        <span className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-white/10">
          <Fish className="h-8 w-8" />
        </span>
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-white/60">Erro 404</p>
        <h1 className="mb-3 text-4xl">Esta margem não existe</h1>
        <p className="mb-7 text-white/70">A página que você procurou não foi encontrada.</p>
        <Button asChild variant="secondary">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao início
          </Link>
        </Button>
      </div>
    </main>
  )
}
