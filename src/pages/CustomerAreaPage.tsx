import { useEffect, useState, type FormEvent } from 'react'
import {
  BookOpen,
  ClipboardList,
  Images,
  Star,
  ChevronRight,
  MessageSquareHeart,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useBusinessSettings } from '@/hooks/use-business-settings'
import { listRecords, formatCurrency } from '@/services/api'
import type { CustomerTab, MenuItem } from '@/types'

export default function CustomerAreaPage() {
  const { user } = useAuth()
  const { settings } = useBusinessSettings()
  const [tab, setTab] = useState<CustomerTab | null>(null)
  const [menuCount, setMenuCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user) return
      try {
        const [tabs, menuItems] = await Promise.all([
          listRecords<CustomerTab>('tabs', { sort: '-opened_at' }),
          listRecords<MenuItem>('menu_items', { filter: 'active = true' }),
        ])
        setTab(
          tabs.find((row) => row.customer_user === user.id && row.status !== 'fechada') ??
            tabs.find((row) => row.customer_user === user.id) ??
            null,
        )
        setMenuCount(menuItems.length)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [user])

  const cards = [
    {
      to: '/app/cardapio',
      icon: BookOpen,
      title: 'Cardápio',
      description: `${menuCount} itens disponíveis no menu`,
      cta: 'Ver cardápio',
    },
    {
      to: '/app/comandas',
      icon: ClipboardList,
      title: 'Minha comanda',
      description: tab
        ? `${tab.status === 'aberta' ? 'Aberta' : 'Encerrada'} · ${formatCurrency(tab.total)}`
        : 'Nenhuma comanda aberta no momento',
      cta: tab ? 'Acompanhar comanda' : 'Abrir comanda',
    },
    {
      to: '/app/experiencia',
      icon: Images,
      title: 'Fotos & avaliação',
      description: 'Envie fotos tiradas no local e sua sugestão',
      cta: 'Enviar agora',
    },
  ]

  return (
    <div className="page-shell space-y-7">
      <header>
        <p className="eyebrow mb-2">{settings.business_name}</p>
        <h1 className="page-heading">Olá, {user?.name?.split(' ')[0] ?? 'cliente'}!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Seu espaço: cardápio, comanda, fotos e avaliações em um só lugar.
        </p>
      </header>

      {loading ? (
        <div className="soft-card p-8 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : (
        <section className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="soft-card group flex flex-col p-6 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
            >
              <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary/8 text-primary">
                <card.icon className="h-5 w-5" />
              </span>
              <h2 className="font-sans text-lg font-bold tracking-normal">{card.title}</h2>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{card.description}</p>
              <span className="mt-4 flex items-center gap-1 text-sm font-bold text-primary">
                {card.cta}
                <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </section>
      )}

      {tab && tab.status === 'aberta' && (
        <section className="soft-card flex flex-col items-start justify-between gap-4 bg-primary/[0.04] p-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Comanda em andamento
            </p>
            <p className="mt-1 text-2xl font-bold text-primary">{formatCurrency(tab.total)}</p>
            <p className="text-xs text-muted-foreground">
              {tab.table_label ? `${tab.table_label} · ` : ''}Peça pelo menu da comanda.
            </p>
          </div>
          <Link
            to="/app/comandas"
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary/90"
          >
            <MessageSquareHeart className="h-4 w-4" /> Fazer pedido
          </Link>
        </section>
      )}

      <section className="soft-card flex items-center gap-4 p-5 text-sm text-muted-foreground">
        <Star className="h-5 w-5 shrink-0 text-amber-500" />
        Sua avaliação ajuda o Renascer a melhorar — deixe a sua em “Fotos & avaliação”.
      </section>
    </div>
  )
}
