import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Building2,
  ChartNoAxesCombined,
  CircleDollarSign,
  Pencil,
  Plus,
  ReceiptText,
  TrendingUp,
  WalletCards,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useBusinessSettings } from '@/hooks/use-business-settings'
import { createRecord, formatCurrency, formatDate, listRecords, updateRecord } from '@/services/api'
import LoadingState from '@/components/LoadingState'
import EmptyState from '@/components/EmptyState'
import type { Activity, FinancialEntry, TabItem } from '@/types'

const localDate = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
const categoryLabels: Record<FinancialEntry['category'], string> = {
  restaurante: 'Restaurante',
  pesca: 'Pesca',
  locacao: 'Locação',
  estacionamento: 'Estacionamento',
  fornecedor: 'Fornecedor',
  manutencao: 'Manutenção',
  outros: 'Outros',
}

export default function FinancePage() {
  const { user } = useAuth()
  const { settings, refresh: refreshSettings } = useBusinessSettings()
  const { toast } = useToast()
  const [entries, setEntries] = useState<FinancialEntry[]>([])
  const [items, setItems] = useState<TabItem[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [entryOpen, setEntryOpen] = useState(false)
  const [bankOpen, setBankOpen] = useState(false)
  const [entryForm, setEntryForm] = useState({
    type: 'entrada' as 'entrada' | 'saida',
    category: 'outros' as FinancialEntry['category'],
    description: '',
    amount: '',
    entry_date: localDate(),
  })
  const [bankForm, setBankForm] = useState({
    bank_name: '',
    bank_agency: '',
    bank_account: '',
    pix_key: '',
    commission_percent: '5',
    business_name: '',
  })

  const refresh = async () => {
    const [entryRows, itemRows, activityRows] = await Promise.all([
      listRecords<FinancialEntry>('financial_entries', { sort: '-entry_date' }),
      listRecords<TabItem>('tab_items', { sort: '-created' }),
      listRecords<Activity>('activities', { sort: '-start_at' }),
    ])
    setEntries(entryRows)
    setItems(itemRows.filter((item) => item.status !== 'cancelado'))
    setActivities(activityRows.filter((item) => item.status !== 'cancelada'))
    setLoading(false)
  }
  useEffect(() => {
    void refresh()
  }, [])

  const totals = useMemo(() => {
    const income = entries
      .filter((entry) => entry.type === 'entrada')
      .reduce((sum, entry) => sum + entry.amount, 0)
    const expense = entries
      .filter((entry) => entry.type === 'saida')
      .reduce((sum, entry) => sum + entry.amount, 0)
    return { income, expense, balance: income - expense }
  }, [entries])

  const productSales = useMemo(() => {
    const grouped = new Map<
      string,
      { name: string; quantity: number; total: number; commission: number }
    >()
    items.forEach((item) => {
      const current = grouped.get(item.item_name) ?? {
        name: item.item_name,
        quantity: 0,
        total: 0,
        commission: 0,
      }
      current.quantity += item.quantity
      current.total += item.subtotal
      current.commission += item.commission_amount
      grouped.set(item.item_name, current)
    })
    return Array.from(grouped.values()).sort((a, b) => b.total - a.total)
  }, [items])

  const restaurantSales = productSales.reduce((sum, row) => sum + row.total, 0)
  const fishingSales = activities
    .filter((row) => row.type === 'pesca')
    .reduce((sum, row) => sum + row.amount, 0)
  const rentalSales = activities
    .filter((row) => row.type === 'locacao')
    .reduce((sum, row) => sum + row.amount, 0)
  const overallSales = restaurantSales + fishingSales + rentalSales
  const commission = productSales.reduce((sum, row) => sum + row.commission, 0)

  const saveEntry = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return
    try {
      await createRecord<FinancialEntry>('financial_entries', {
        ...entryForm,
        amount: Number(entryForm.amount),
        entry_date: new Date(`${entryForm.entry_date}T12:00:00`).toISOString(),
        source_type: 'manual',
        registered_by: user.id,
      })
      toast({ title: entryForm.type === 'entrada' ? 'Entrada registrada' : 'Saída registrada' })
      setEntryOpen(false)
      setEntryForm({
        type: 'entrada',
        category: 'outros',
        description: '',
        amount: '',
        entry_date: localDate(),
      })
      await refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível registrar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    }
  }

  const openBank = () => {
    setBankForm({
      bank_name: settings.bank_name || '',
      bank_agency: settings.bank_agency || '',
      bank_account: settings.bank_account || '',
      pix_key: settings.pix_key || '',
      commission_percent: String(settings.commission_percent || 0),
      business_name: settings.business_name || '',
    })
    setBankOpen(true)
  }

  const saveBank = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await updateRecord('settings', settings.id, {
        ...bankForm,
        commission_percent: Number(bankForm.commission_percent),
      })
      window.dispatchEvent(new Event('business-settings-updated'))
      await refreshSettings()
      setBankOpen(false)
      toast({ title: 'Configurações atualizadas' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível salvar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    }
  }

  const financialStats = [
    {
      label: 'Entradas',
      value: totals.income,
      icon: ArrowUpRight,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Saídas',
      value: totals.expense,
      icon: ArrowDownRight,
      tone: 'bg-red-50 text-red-700',
    },
    {
      label: 'Saldo atual',
      value: totals.balance,
      icon: WalletCards,
      tone: totals.balance >= 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700',
    },
    {
      label: 'Comissões',
      value: commission,
      icon: CircleDollarSign,
      tone: 'bg-amber-50 text-amber-700',
    },
  ]

  return (
    <div className="page-shell space-y-6">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow mb-2">Resultados</p>
          <h1 className="page-heading">Financeiro & relatórios</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acompanhe o caixa, as vendas e a comissão da equipe.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openBank}>
            <Building2 className="mr-2 h-4 w-4" /> Conta e negócio
          </Button>
          <Button onClick={() => setEntryOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo lançamento
          </Button>
        </div>
      </header>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {financialStats.map((stat) => (
              <article key={stat.label} className="stat-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="mt-2 text-2xl font-bold">{formatCurrency(stat.value)}</p>
                  </div>
                  <span className={`grid h-10 w-10 place-items-center rounded-xl ${stat.tone}`}>
                    <stat.icon className="h-5 w-5" />
                  </span>
                </div>
              </article>
            ))}
          </section>

          <Tabs defaultValue="cash">
            <TabsList className="grid w-full grid-cols-2 sm:w-[380px]">
              <TabsTrigger value="cash">Fluxo de caixa</TabsTrigger>
              <TabsTrigger value="reports">Relatórios de vendas</TabsTrigger>
            </TabsList>
            <TabsContent value="cash" className="mt-5">
              <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
                <section className="soft-card p-5 sm:p-6">
                  <div className="mb-5">
                    <h2 className="text-xl">Lançamentos</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Entradas e saídas registradas no período.
                    </p>
                  </div>
                  {entries.length === 0 ? (
                    <EmptyState
                      icon={ReceiptText}
                      title="Caixa sem lançamentos"
                      description="Registre uma entrada ou saída para começar."
                    />
                  ) : (
                    entries.map((entry) => (
                      <div key={entry.id} className="data-row">
                        <span
                          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${entry.type === 'entrada' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}
                        >
                          {entry.type === 'entrada' ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{entry.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {categoryLabels[entry.category]} · {formatDate(entry.entry_date)}
                          </p>
                        </div>
                        <strong
                          className={entry.type === 'entrada' ? 'text-emerald-700' : 'text-red-600'}
                        >
                          {entry.type === 'entrada' ? '+' : '−'} {formatCurrency(entry.amount)}
                        </strong>
                      </div>
                    ))
                  )}
                </section>
                <aside className="space-y-5">
                  <article className="rounded-2xl bg-primary p-6 text-white shadow-lg">
                    <Banknote className="h-7 w-7 text-amber-300" />
                    <p className="mt-7 text-sm text-white/55">Saldo disponível</p>
                    <p className="mt-1 text-3xl font-bold">{formatCurrency(totals.balance)}</p>
                    <p className="mt-4 text-xs text-white/45">
                      Calculado com todos os lançamentos registrados.
                    </p>
                  </article>
                  <article className="soft-card p-5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg">Conta bancária</h2>
                      <Button size="icon" variant="ghost" onClick={openBank}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-4 space-y-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Banco</p>
                        <p className="font-semibold">{settings.bank_name || 'Não cadastrado'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Agência</p>
                          <p className="font-semibold">{settings.bank_agency || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Conta</p>
                          <p className="font-semibold">{settings.bank_account || '—'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Chave PIX</p>
                        <p className="truncate font-semibold">{settings.pix_key}</p>
                      </div>
                    </div>
                  </article>
                </aside>
              </div>
            </TabsContent>
            <TabsContent value="reports" className="mt-5 space-y-5">
              <section className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    label: 'Restaurante',
                    value: restaurantSales,
                    icon: UtensilsReport,
                    tone: 'bg-orange-50 text-orange-700',
                  },
                  {
                    label: 'Pesca',
                    value: fishingSales,
                    icon: TrendingUp,
                    tone: 'bg-emerald-50 text-emerald-700',
                  },
                  {
                    label: 'Locações',
                    value: rentalSales,
                    icon: ChartNoAxesCombined,
                    tone: 'bg-blue-50 text-blue-700',
                  },
                ].map(({ label, value, icon: Icon, tone }) => (
                  <article key={label} className="soft-card p-5">
                    <div className={`mb-4 grid h-10 w-10 place-items-center rounded-xl ${tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm text-muted-foreground">Vendas · {label}</p>
                    <p className="mt-1 text-2xl font-bold">{formatCurrency(value)}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {overallSales > 0 ? ((value / overallSales) * 100).toFixed(1) : '0,0'}% do
                      total
                    </p>
                  </article>
                ))}
              </section>
              <section className="soft-card p-5 sm:p-6">
                <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-xl">Vendas por produto</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Participação e comissão de garçom-assistente.
                    </p>
                  </div>
                  <Badge variant="secondary">
                    Comissão configurada: {settings.commission_percent}%
                  </Badge>
                </div>
                {productSales.length === 0 ? (
                  <EmptyState
                    icon={ChartNoAxesCombined}
                    title="Ainda não há vendas por produto"
                    description="Os itens lançados em comandas aparecerão neste relatório."
                  />
                ) : (
                  <div className="space-y-5">
                    {productSales.map((row) => {
                      const percent = restaurantSales ? (row.total / restaurantSales) * 100 : 0
                      return (
                        <div key={row.name}>
                          <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">{row.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {row.quantity} unidades · {percent.toFixed(1)}% das vendas do
                                restaurante
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold">{formatCurrency(row.total)}</p>
                              <p className="text-xs text-amber-700">
                                Comissão {formatCurrency(row.commission)}
                              </p>
                            </div>
                          </div>
                          <Progress value={percent} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            </TabsContent>
          </Tabs>
        </>
      )}

      <Dialog open={entryOpen} onOpenChange={setEntryOpen}>
        <DialogContent>
          <form onSubmit={saveEntry}>
            <DialogHeader>
              <DialogTitle>Novo lançamento</DialogTitle>
              <DialogDescription>
                Registre uma entrada ou saída para atualizar o saldo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={entryForm.type}
                    onValueChange={(type: 'entrada' | 'saida') =>
                      setEntryForm({ ...entryForm, type })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entry-amount">Valor</Label>
                  <Input
                    id="entry-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={entryForm.amount}
                    onChange={(e) => setEntryForm({ ...entryForm, amount: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={entryForm.category}
                  onValueChange={(category: FinancialEntry['category']) =>
                    setEntryForm({ ...entryForm, category })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="entry-description">Descrição</Label>
                <Textarea
                  id="entry-description"
                  value={entryForm.description}
                  onChange={(e) => setEntryForm({ ...entryForm, description: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entry-date">Data</Label>
                <Input
                  id="entry-date"
                  type="date"
                  value={entryForm.entry_date}
                  onChange={(e) => setEntryForm({ ...entryForm, entry_date: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEntryOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Registrar lançamento</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={bankOpen} onOpenChange={setBankOpen}>
        <DialogContent>
          <form onSubmit={saveBank}>
            <DialogHeader>
              <DialogTitle>Conta e configurações</DialogTitle>
              <DialogDescription>
                Edite o nome do estabelecimento, a conta, a chave PIX e a comissão.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-5">
              <div className="space-y-2">
                <Label htmlFor="business-name">Nome do estabelecimento</Label>
                <Input
                  id="business-name"
                  value={bankForm.business_name}
                  onChange={(e) => setBankForm({ ...bankForm, business_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank-name">Banco</Label>
                <Input
                  id="bank-name"
                  value={bankForm.bank_name}
                  onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agency">Agência</Label>
                  <Input
                    id="agency"
                    value={bankForm.bank_agency}
                    onChange={(e) => setBankForm({ ...bankForm, bank_agency: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account">Conta</Label>
                  <Input
                    id="account"
                    value={bankForm.bank_account}
                    onChange={(e) => setBankForm({ ...bankForm, bank_account: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pix">Chave PIX</Label>
                <Input
                  id="pix"
                  value={bankForm.pix_key}
                  onChange={(e) => setBankForm({ ...bankForm, pix_key: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commission">Comissão do garçom-assistente (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={bankForm.commission_percent}
                  onChange={(e) => setBankForm({ ...bankForm, commission_percent: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBankOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar configurações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function UtensilsReport({ className }: { className?: string }) {
  return <ReceiptText className={className} />
}
