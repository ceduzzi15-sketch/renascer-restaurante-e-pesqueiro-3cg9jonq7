import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Banknote,
  CalendarDays,
  Car,
  ClipboardList,
  Fish,
  Plus,
  ReceiptText,
  ShipWheel,
  UsersRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { listRecords, formatCurrency, formatDate, startOfTodayIso } from '@/services/api'
import type { Activity, CustomerTab, FinancialEntry, ParkingReservation, Visit } from '@/types'

interface DashboardData {
  tabs: CustomerTab[]
  activities: Activity[]
  visits: Visit[]
  parking: ParkingReservation[]
  financial: FinancialEntry[]
}

const initialData: DashboardData = {
  tabs: [],
  activities: [],
  visits: [],
  parking: [],
  financial: [],
}

export default function DashboardPage() {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = startOfTodayIso()
    void Promise.all([
      listRecords<CustomerTab>('tabs', { sort: '-opened_at' }),
      listRecords<Activity>('activities', { filter: `start_at >= "${today}"`, sort: '-start_at' }),
      listRecords<Visit>('visits', {
        filter: `checked_in_at >= "${today}"`,
        sort: '-checked_in_at',
      }),
      listRecords<ParkingReservation>('parking_reservations', { sort: '-start_at' }),
      listRecords<FinancialEntry>('financial_entries', {
        filter: `entry_date >= "${today}"`,
        sort: '-entry_date',
      }),
    ])
      .then(([tabs, activities, visits, parking, financial]) =>
        setData({ tabs, activities, visits, parking, financial }),
      )
      .finally(() => setLoading(false))
  }, [])

  const openTabs = data.tabs.filter((tab) =>
    ['aberta', 'aguardando_pagamento'].includes(tab.status),
  )
  const fishing = data.activities.filter(
    (activity) => activity.type === 'pesca' && activity.status !== 'cancelada',
  )
  const rentals = data.activities.filter(
    (activity) => activity.type === 'locacao' && activity.status !== 'cancelada',
  )
  const occupiedParking = data.parking.filter((parking) =>
    ['reservada', 'ocupada'].includes(parking.status),
  )
  const todayIncome = data.financial.reduce(
    (sum, entry) => sum + (entry.type === 'entrada' ? entry.amount : -entry.amount),
    0,
  )

  const timeline = useMemo(
    () =>
      [
        ...data.visits.slice(0, 3).map((item) => ({
          id: `v${item.id}`,
          title: `Entrada de ${item.customer_name}`,
          detail: item.purpose,
          date: item.checked_in_at,
          icon: UsersRound,
        })),
        ...data.activities.slice(0, 3).map((item) => ({
          id: `a${item.id}`,
          title: item.item_name,
          detail: item.customer_name,
          date: item.start_at,
          icon: item.type === 'pesca' ? Fish : ShipWheel,
        })),
        ...data.tabs.slice(0, 3).map((item) => ({
          id: `t${item.id}`,
          title: `Comanda de ${item.customer_name}`,
          detail: formatCurrency(item.total),
          date: item.opened_at,
          icon: ReceiptText,
        })),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6),
    [data],
  )

  const stats = [
    {
      label: 'Entradas hoje',
      value: data.visits.length,
      hint: 'pessoas no local',
      icon: UsersRound,
      tone: 'bg-cyan-50 text-cyan-700',
    },
    {
      label: 'Comandas abertas',
      value: openTabs.length,
      hint: formatCurrency(openTabs.reduce((sum, tab) => sum + tab.total, 0)),
      icon: ClipboardList,
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Diárias de pesca',
      value: fishing.length,
      hint: 'registros no dia',
      icon: Fish,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Locações ativas',
      value: rentals.length,
      hint: `${occupiedParking.length} vagas reservadas`,
      icon: ShipWheel,
      tone: 'bg-blue-50 text-blue-700',
    },
  ]

  return (
    <div className="page-shell space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow mb-2">Operação do dia</p>
          <h1 className="page-heading">Bom dia, gestor!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {new Intl.DateTimeFormat('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
            }).format(new Date())}{' '}
            · veja o que acontece agora.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/app/operacoes">
              <CalendarDays className="mr-2 h-4 w-4" /> Nova reserva
            </Link>
          </Button>
          <Button asChild>
            <Link to="/app/comandas">
              <Plus className="mr-2 h-4 w-4" /> Abrir comanda
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-36 rounded-2xl" />
            ))
          : stats.map((stat) => (
              <article key={stat.label} className="stat-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight">{stat.value}</p>
                  </div>
                  <span className={`grid h-11 w-11 place-items-center rounded-xl ${stat.tone}`}>
                    <stat.icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">{stat.hint}</p>
              </article>
            ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="soft-card p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl">Movimentação recente</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Entradas, comandas e reservas do dia.
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/comandas">
                Ver comandas <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div>
            {timeline.length === 0 ? (
              <div className="rounded-xl bg-muted/40 px-4 py-10 text-center text-sm text-muted-foreground">
                A primeira movimentação do dia aparecerá aqui.
              </div>
            ) : (
              timeline.map((item) => (
                <div key={item.id} className="data-row">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary">
                      <item.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{item.title}</p>
                      <p className="truncate text-xs capitalize text-muted-foreground">
                        {item.detail.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(item.date, true)}
                  </span>
                </div>
              ))
            )}
          </div>
        </article>

        <div className="space-y-5">
          <article className="overflow-hidden rounded-2xl bg-primary p-6 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10">
                <Banknote className="h-5 w-5 text-amber-300" />
              </span>
              <Badge className="bg-white/10 text-white hover:bg-white/10">Hoje</Badge>
            </div>
            <p className="mt-7 text-sm text-white/55">Resultado financeiro do dia</p>
            <p className="mt-1 text-3xl font-bold">{formatCurrency(todayIncome)}</p>
            <Button variant="secondary" size="sm" asChild className="mt-6">
              <Link to="/app/financeiro">
                Abrir financeiro <ArrowRightIcon />
              </Link>
            </Button>
          </article>
          <article className="soft-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg">Estacionamento</h2>
              <Car className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/55 p-4">
                <p className="text-2xl font-bold">{occupiedParking.length}</p>
                <p className="text-xs text-muted-foreground">reservadas/ocupadas</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-2xl font-bold text-emerald-700">
                  {Math.max(0, 20 - occupiedParking.length)}
                </p>
                <p className="text-xs text-emerald-700/70">vagas livres</p>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}

function ArrowRightIcon() {
  return <ArrowUpRight className="ml-2 h-4 w-4" />
}
