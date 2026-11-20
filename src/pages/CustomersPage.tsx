import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  CalendarDays,
  History,
  MessageSquareText,
  Pencil,
  Search,
  Star,
  UserPlus,
  UsersRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useToast } from '@/hooks/use-toast'
import {
  createRecord,
  formatCurrency,
  formatDate,
  listRecords,
  normalizeCpf,
  normalizePhone,
  updateRecord,
} from '@/services/api'
import LoadingState from '@/components/LoadingState'
import EmptyState from '@/components/EmptyState'
import type { Activity, Customer, CustomerTab, Review } from '@/types'

const blank = { name: '', phone: '', cpf: '', notes: '' }

export default function CustomersPage() {
  const { toast } = useToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [tabs, setTabs] = useState<CustomerTab[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selected, setSelected] = useState<Customer | null>(null)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm] = useState(blank)

  const refresh = async () => {
    const [customerRows, tabRows, activityRows, reviewRows] = await Promise.all([
      listRecords<Customer>('customers', { sort: 'name' }),
      listRecords<CustomerTab>('tabs', { sort: '-opened_at' }),
      listRecords<Activity>('activities', { sort: '-start_at' }),
      listRecords<Review>('reviews', { sort: '-created' }),
    ])
    setCustomers(customerRows)
    setTabs(tabRows)
    setActivities(activityRows)
    setReviews(reviewRows)
    setLoading(false)
  }
  useEffect(() => {
    void refresh()
  }, [])

  const visible = useMemo(
    () =>
      customers.filter((customer) =>
        `${customer.name} ${customer.phone} ${customer.cpf}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [customers, search],
  )

  const openForm = (customer?: Customer) => {
    setEditing(customer ?? null)
    setForm(
      customer
        ? { name: customer.name, phone: customer.phone, cpf: customer.cpf, notes: customer.notes }
        : blank,
    )
    setDialogOpen(true)
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    try {
      if (editing) await updateRecord<Customer>('customers', editing.id, form)
      else await createRecord<Customer>('customers', { ...form, total_spent: 0 })
      toast({ title: editing ? 'Cliente atualizado' : 'Cliente cadastrado' })
      setDialogOpen(false)
      await refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível salvar',
        description: error instanceof Error ? error.message : 'Confira os dados.',
      })
    }
  }

  const customerTabs = selected
    ? tabs.filter(
        (tab) =>
          tab.customer === selected.id ||
          tab.cpf.replace(/\D/g, '') === selected.cpf.replace(/\D/g, ''),
      )
    : []
  const customerActivities = selected
    ? activities.filter(
        (activity) => activity.customer === selected.id || activity.customer_name === selected.name,
      )
    : []
  const customerReviews = selected
    ? reviews.filter((review) => review.customer_name === selected.name)
    : []
  const totalSpent = customerTabs
    .filter((tab) => ['paga', 'fechada'].includes(tab.status))
    .reduce((sum, tab) => sum + tab.total, 0)

  return (
    <div className="page-shell space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow mb-2">Relacionamento</p>
          <h1 className="page-heading">Carteira de clientes</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Dados, histórico de consumo e experiências em um único lugar.
          </p>
        </div>
        <Button onClick={() => openForm()}>
          <UserPlus className="mr-2 h-4 w-4" /> Cadastrar cliente
        </Button>
      </header>
      <div className="soft-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, telefone ou CPF"
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="Nenhum cliente encontrado"
          description="Cadastre um cliente ou ajuste sua busca."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((customer) => {
            const customerHistory = tabs.filter(
              (tab) => tab.customer === customer.id || tab.cpf === customer.cpf,
            )
            const spent = customerHistory
              .filter((tab) => ['paga', 'fechada'].includes(tab.status))
              .reduce((sum, tab) => sum + tab.total, 0)
            const initials = customer.name
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()
            return (
              <article key={customer.id} className="soft-card p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 font-bold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-sans text-base font-bold tracking-normal">
                      {customer.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">{customer.phone}</p>
                    <p className="text-xs text-muted-foreground">{customer.cpf}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => openForm(customer)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-lg font-bold">{customerHistory.length}</p>
                    <p className="text-xs text-muted-foreground">comandas</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3">
                    <p className="text-lg font-bold text-emerald-700">{formatCurrency(spent)}</p>
                    <p className="text-xs text-emerald-700/60">consumo</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => setSelected(customer)}
                >
                  <History className="mr-2 h-4 w-4" /> Ver histórico
                </Button>
              </article>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={save}>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar cliente' : 'Cadastrar cliente'}</DialogTitle>
              <DialogDescription>
                Os dados identificam a comanda e liberam o acesso local.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-5">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Nome completo</Label>
                <Input
                  id="customer-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-phone">Telefone</Label>
                  <Input
                    id="customer-phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: normalizePhone(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-cpf">CPF</Label>
                  <Input
                    id="customer-cpf"
                    value={form.cpf}
                    onChange={(e) => setForm({ ...form, cpf: normalizeCpf(e.target.value) })}
                    required
                    minLength={14}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Preferências ou observações internas"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar cliente</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{selected?.name}</SheetTitle>
            <SheetDescription>Histórico consolidado do cliente.</SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xl font-bold">{customerTabs.length}</p>
                  <p className="text-xs text-muted-foreground">visitas</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3">
                  <p className="text-xl font-bold text-emerald-700">{formatCurrency(totalSpent)}</p>
                  <p className="text-xs text-emerald-700/60">consumo</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3">
                  <p className="text-xl font-bold text-amber-700">{customerReviews.length}</p>
                  <p className="text-xs text-amber-700/60">avaliações</p>
                </div>
              </div>
              <section>
                <h3 className="mb-3 flex items-center gap-2 font-sans text-sm font-bold tracking-normal">
                  <CalendarDays className="h-4 w-4 text-primary" /> Comandas
                </h3>
                {customerTabs.length ? (
                  customerTabs.map((tab) => (
                    <div key={tab.id} className="data-row">
                      <div>
                        <p className="text-sm font-semibold">{formatDate(tab.opened_at, true)}</p>
                        <Badge variant="secondary" className="mt-1 capitalize">
                          {tab.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <strong>{formatCurrency(tab.total)}</strong>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
                    Nenhuma comanda registrada.
                  </p>
                )}
              </section>
              <section>
                <h3 className="mb-3 flex items-center gap-2 font-sans text-sm font-bold tracking-normal">
                  <History className="h-4 w-4 text-primary" /> Pesca e locações
                </h3>
                {customerActivities.length ? (
                  customerActivities.map((activity) => (
                    <div key={activity.id} className="data-row">
                      <div>
                        <p className="text-sm font-semibold">{activity.item_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(activity.start_at, true)}
                        </p>
                      </div>
                      <strong>{formatCurrency(activity.amount)}</strong>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
                    Nenhuma atividade registrada.
                  </p>
                )}
              </section>
              <section>
                <h3 className="mb-3 flex items-center gap-2 font-sans text-sm font-bold tracking-normal">
                  <MessageSquareText className="h-4 w-4 text-primary" /> Avaliações
                </h3>
                {customerReviews.map((review) => (
                  <div key={review.id} className="mb-3 rounded-xl border p-4">
                    <div className="flex gap-0.5 text-amber-500">
                      {Array.from({ length: review.rating }).map((_, index) => (
                        <Star key={index} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{review.suggestion}</p>
                  </div>
                ))}
              </section>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
