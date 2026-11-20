import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Copy,
  Minus,
  Plus,
  QrCode,
  ReceiptText,
  Search,
  ShoppingBag,
  Trash2,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useBusinessSettings } from '@/hooks/use-business-settings'
import {
  createRecord,
  findCustomerByCpf,
  findUserByCpf,
  formatCurrency,
  formatDate,
  listRecords,
  normalizeCpf,
  normalizePhone,
  updateRecord,
} from '@/services/api'
import LoadingState from '@/components/LoadingState'
import EmptyState from '@/components/EmptyState'
import type { Customer, CustomerTab, MenuItem, TabItem } from '@/types'

const blankTab = { name: '', phone: '', cpf: '', table: '' }
const statusLabels: Record<CustomerTab['status'], string> = {
  aberta: 'Aberta',
  aguardando_pagamento: 'Aguardando PIX',
  paga: 'Paga',
  fechada: 'Fechada',
}
const statusStyles: Record<CustomerTab['status'], string> = {
  aberta: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  aguardando_pagamento: 'bg-amber-50 text-amber-700 border-amber-200',
  paga: 'bg-blue-50 text-blue-700 border-blue-200',
  fechada: 'bg-slate-100 text-slate-600 border-slate-200',
}

export default function TabsPage({ paymentMode = false }: { paymentMode?: boolean }) {
  const { user } = useAuth()
  const { settings } = useBusinessSettings()
  const { toast } = useToast()
  const [tabs, setTabs] = useState<CustomerTab[]>([])
  const [items, setItems] = useState<TabItem[]>([])
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [selected, setSelected] = useState<CustomerTab | null>(null)
  const [checkout, setCheckout] = useState<CustomerTab | null>(null)
  const [form, setForm] = useState(blankTab)
  const [notes, setNotes] = useState('')
  const [addingItem, setAddingItem] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) return
    const [tabRows, itemRows, menuRows] = await Promise.all([
      listRecords<CustomerTab>('tabs', { sort: '-opened_at' }),
      listRecords<TabItem>('tab_items', { sort: '-created' }),
      listRecords<MenuItem>('menu_items', { filter: 'active = true', sort: 'category,name' }),
    ])
    setTabs(tabRows)
    setItems(itemRows)
    setMenu(menuRows)
    setLoading(false)
    setSelected((current) =>
      current ? (tabRows.find((tab) => tab.id === current.id) ?? null) : null,
    )
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const visibleTabs = useMemo(
    () =>
      tabs.filter((tab) => {
        if (paymentMode && tab.status !== 'aguardando_pagamento') return false
        if (!paymentMode && user?.role === 'cliente' && tab.customer_user !== user.id) return false
        return `${tab.customer_name} ${tab.cpf} ${tab.table_label}`
          .toLowerCase()
          .includes(search.toLowerCase())
      }),
    [tabs, paymentMode, search, user],
  )

  const tabItems = (tabId: string) =>
    items.filter((item) => item.tab === tabId && item.status !== 'cancelado')

  const openTab = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return
    try {
      let customer = await findCustomerByCpf(form.cpf)
      let customerUser = customer?.user || ''
      if (!customer) {
        const matchingUser = await findUserByCpf(form.cpf)
        customerUser = matchingUser?.id || ''
        customer = await createRecord<Customer>('customers', {
          user: customerUser || undefined,
          name: form.name,
          phone: form.phone,
          cpf: form.cpf,
          total_spent: 0,
        })
      }
      const record = await createRecord<CustomerTab>('tabs', {
        customer: customer.id,
        customer_user: customerUser || customer.user || undefined,
        customer_name: form.name,
        phone: form.phone,
        cpf: form.cpf,
        table_label: form.table,
        status: 'aberta',
        total: 0,
        pix_status: 'pendente',
        attendant: user.id,
        attendant_name: user.name,
        opened_at: new Date().toISOString(),
      })
      setTabs((current) => [record, ...current])
      setForm(blankTab)
      setOpenDialog(false)
      setSelected(record)
      toast({
        title: 'Comanda aberta',
        description: `Comanda de ${record.customer_name} pronta para receber pedidos.`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível abrir a comanda',
        description: error instanceof Error ? error.message : 'Confira os dados.',
      })
    }
  }

  const addItem = async (menuItem: MenuItem) => {
    if (!selected || !user) return
    setAddingItem(true)
    try {
      const commission = (menuItem.price * (settings.commission_percent || 0)) / 100
      const newItem = await createRecord<TabItem>('tab_items', {
        tab: selected.id,
        menu_item: menuItem.id,
        item_name: menuItem.name,
        unit_price: menuItem.price,
        quantity: 1,
        subtotal: menuItem.price,
        status: 'solicitado',
        notes,
        ordered_by: user.id,
        commission_amount: commission,
      })
      const newTotal = selected.total + menuItem.price
      const updated = await updateRecord<CustomerTab>('tabs', selected.id, { total: newTotal })
      setItems((current) => [newItem, ...current])
      setTabs((current) => current.map((tab) => (tab.id === updated.id ? updated : tab)))
      setSelected(updated)
      setNotes('')
      toast({ title: 'Pedido lançado', description: `${menuItem.name} foi adicionado à comanda.` })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível lançar o pedido',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setAddingItem(false)
    }
  }

  const changeQuantity = async (item: TabItem, delta: number) => {
    if (!selected) return
    const quantity = Math.max(1, item.quantity + delta)
    const subtotal = quantity * item.unit_price
    const difference = subtotal - item.subtotal
    try {
      const updatedItem = await updateRecord<TabItem>('tab_items', item.id, {
        quantity,
        subtotal,
        commission_amount: (subtotal * (settings.commission_percent || 0)) / 100,
      })
      const updatedTab = await updateRecord<CustomerTab>('tabs', selected.id, {
        total: Math.max(0, selected.total + difference),
      })
      setItems((current) => current.map((row) => (row.id === updatedItem.id ? updatedItem : row)))
      setTabs((current) => current.map((row) => (row.id === updatedTab.id ? updatedTab : row)))
      setSelected(updatedTab)
    } catch {
      toast({ variant: 'destructive', title: 'Não foi possível alterar a quantidade' })
    }
  }

  const removeItem = async (item: TabItem) => {
    if (!selected) return
    try {
      const updatedItem = await updateRecord<TabItem>('tab_items', item.id, { status: 'cancelado' })
      const updatedTab = await updateRecord<CustomerTab>('tabs', selected.id, {
        total: Math.max(0, selected.total - item.subtotal),
      })
      setItems((current) => current.map((row) => (row.id === updatedItem.id ? updatedItem : row)))
      setTabs((current) => current.map((row) => (row.id === updatedTab.id ? updatedTab : row)))
      setSelected(updatedTab)
    } catch {
      toast({ variant: 'destructive', title: 'Não foi possível remover o item' })
    }
  }

  const requestPayment = async () => {
    if (!selected) return
    const updated = await updateRecord<CustomerTab>('tabs', selected.id, {
      status: 'aguardando_pagamento',
      payment_method: 'pix',
      pix_status: 'pendente',
    })
    setTabs((current) => current.map((tab) => (tab.id === updated.id ? updated : tab)))
    setSelected(updated)
    setCheckout(updated)
  }

  const confirmPayment = async () => {
    if (!checkout || !user) return
    try {
      const closedAt = new Date().toISOString()
      const updated = await updateRecord<CustomerTab>('tabs', checkout.id, {
        status: 'fechada',
        pix_status: 'confirmado',
        payment_method: 'pix',
        closed_at: closedAt,
      })
      await createRecord('financial_entries', {
        type: 'entrada',
        category: 'restaurante',
        description: `Comanda de ${checkout.customer_name}`,
        amount: checkout.total,
        entry_date: closedAt,
        source_type: 'comanda',
        source_id: checkout.id,
        registered_by: user.id,
      })
      if (checkout.customer) {
        const customer = await listRecords<Customer>('customers', {
          filter: `id = "${checkout.customer}"`,
        })
        if (customer[0])
          await updateRecord<Customer>('customers', customer[0].id, {
            total_spent: Number(customer[0].total_spent || 0) + checkout.total,
            last_visit: closedAt,
          })
      }
      setTabs((current) => current.map((tab) => (tab.id === updated.id ? updated : tab)))
      setSelected((current) => (current?.id === updated.id ? updated : current))
      setCheckout(null)
      toast({
        title: 'Pagamento confirmado',
        description: 'Comanda fechada e entrada registrada no financeiro.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível confirmar o pagamento',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    }
  }

  const currentItems = selected ? tabItems(selected.id) : []
  const canManage = user?.role !== 'cliente'

  return (
    <div className="page-shell space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow mb-2">
            {paymentMode ? 'Caixa' : user?.role === 'cliente' ? 'Seu atendimento' : 'Restaurante'}
          </p>
          <h1 className="page-heading">
            {paymentMode
              ? 'Recebimentos PIX'
              : user?.role === 'cliente'
                ? 'Minha comanda'
                : 'Comandas'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {paymentMode
              ? 'Confirme pagamentos e feche contas com segurança.'
              : user?.role === 'cliente'
                ? 'Peça pelo celular e acompanhe o valor em tempo real.'
                : 'Abra, lance consumos e acompanhe as contas abertas.'}
          </p>
        </div>
        {canManage && !paymentMode && (
          <Button onClick={() => setOpenDialog(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Abrir comanda
          </Button>
        )}
      </header>

      <div className="soft-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, CPF ou mesa"
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : visibleTabs.length === 0 ? (
        <EmptyState
          icon={paymentMode ? QrCode : ClipboardList}
          title={
            paymentMode
              ? 'Nenhum PIX pendente'
              : user?.role === 'cliente'
                ? 'Você ainda não possui comanda'
                : 'Nenhuma comanda encontrada'
          }
          description={
            paymentMode
              ? 'As comandas aguardando pagamento aparecerão aqui.'
              : user?.role === 'cliente'
                ? 'Peça à equipe para vincular sua conta à comanda.'
                : 'Abra a primeira comanda para começar o atendimento.'
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => (paymentMode ? setCheckout(tab) : setSelected(tab))}
              className="soft-card group p-5 text-left transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {tab.table_label || 'Sem mesa'}
                  </p>
                  <h2 className="mt-1 font-sans text-lg font-bold tracking-normal">
                    {tab.customer_name}
                  </h2>
                  <p className="text-xs text-muted-foreground">{tab.phone}</p>
                </div>
                <Badge variant="outline" className={statusStyles[tab.status]}>
                  {statusLabels[tab.status]}
                </Badge>
              </div>
              <Separator className="my-4" />
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total atual</p>
                  <p className="mt-1 text-2xl font-bold text-primary">
                    {formatCurrency(tab.total)}
                  </p>
                </div>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/8 text-primary transition group-hover:bg-primary group-hover:text-white">
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Aberta em {formatDate(tab.opened_at, true)} · {tabItems(tab.id).length} itens
              </p>
            </button>
          ))}
        </div>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <form onSubmit={openTab}>
            <DialogHeader>
              <DialogTitle>Abrir nova comanda</DialogTitle>
              <DialogDescription>
                Informe os dados do cliente para liberar o atendimento e o acesso local.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-5">
              <div className="space-y-2">
                <Label htmlFor="tab-name">Nome do cliente</Label>
                <Input
                  id="tab-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tab-phone">Telefone</Label>
                  <Input
                    id="tab-phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: normalizePhone(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tab-cpf">CPF</Label>
                  <Input
                    id="tab-cpf"
                    value={form.cpf}
                    onChange={(e) => setForm({ ...form, cpf: normalizeCpf(e.target.value) })}
                    required
                    minLength={14}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="table">Mesa ou identificação</Label>
                <Input
                  id="table"
                  value={form.table}
                  onChange={(e) => setForm({ ...form, table: e.target.value })}
                  placeholder="Ex.: Mesa 08 ou Quiosque 2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">Abrir comanda</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <div className="flex items-start justify-between gap-3 pr-8">
              <div>
                <SheetTitle>{selected?.customer_name}</SheetTitle>
                <SheetDescription>
                  {selected?.table_label || 'Comanda do cliente'} · {selected?.cpf}
                </SheetDescription>
              </div>
              {selected && (
                <Badge variant="outline" className={statusStyles[selected.status]}>
                  {statusLabels[selected.status]}
                </Badge>
              )}
            </div>
          </SheetHeader>
          {selected && (
            <div className="mt-6 space-y-6">
              <div className="rounded-2xl bg-primary p-5 text-white">
                <p className="text-sm text-white/60">Total da comanda</p>
                <p className="mt-1 text-3xl font-bold">{formatCurrency(selected.total)}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-white/50">
                  <span>{currentItems.length} itens</span>
                  <span>Atendimento: {selected.attendant_name || 'Equipe'}</span>
                </div>
              </div>
              <section>
                <h3 className="mb-3 font-sans text-sm font-bold tracking-normal">Itens lançados</h3>
                {currentItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-7 text-center text-sm text-muted-foreground">
                    Nenhum consumo lançado.
                  </div>
                ) : (
                  currentItems.map((item) => (
                    <div key={item.id} className="data-row">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{item.item_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.unit_price)} cada
                        </p>
                      </div>
                      {canManage && selected.status === 'aberta' ? (
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => void changeQuantity(item, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-7 text-center text-sm font-bold">{item.quantity}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => void changeQuantity(item, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm">{item.quantity}x</span>
                      )}
                      <strong className="w-24 text-right text-sm">
                        {formatCurrency(item.subtotal)}
                      </strong>
                      {canManage && selected.status === 'aberta' && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => void removeItem(item)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </section>
              {selected.status === 'aberta' && (
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-sans text-sm font-bold tracking-normal">
                      Adicionar pedido
                    </h3>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mb-3"
                    placeholder="Observação para a cozinha (opcional)"
                  />
                  <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                    {menu.map((item) => (
                      <button
                        key={item.id}
                        disabled={addingItem}
                        onClick={() => void addItem(item)}
                        className="flex items-center justify-between rounded-xl border p-3 text-left transition hover:border-primary/35 hover:bg-primary/[0.035]"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{item.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(item.price)}
                          </span>
                        </span>
                        <Plus className="h-4 w-4 shrink-0 text-primary" />
                      </button>
                    ))}
                  </div>
                </section>
              )}
              <div className="sticky bottom-0 -mx-6 border-t bg-background/95 px-6 py-4 backdrop-blur">
                {selected.status === 'aberta' ? (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => void requestPayment()}
                    disabled={selected.total <= 0}
                  >
                    <QrCode className="mr-2 h-4 w-4" /> Fechar conta e exibir PIX
                  </Button>
                ) : selected.status === 'aguardando_pagamento' ? (
                  <Button
                    className="w-full"
                    size="lg"
                    variant="secondary"
                    onClick={() => setCheckout(selected)}
                  >
                    <QrCode className="mr-2 h-4 w-4" /> Ver pagamento PIX
                  </Button>
                ) : (
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 className="h-5 w-5" /> Comanda encerrada
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={Boolean(checkout)} onOpenChange={(open) => !open && setCheckout(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-white">
              <QrCode className="h-7 w-7" />
            </div>
            <AlertDialogTitle className="text-center">Pagamento por PIX</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Exiba esta chave para {checkout?.customer_name} e confirme somente após verificar o
              recebimento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-3 rounded-2xl bg-secondary/55 p-5 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Valor total
            </p>
            <p className="mt-2 text-3xl font-bold text-primary">
              {formatCurrency(checkout?.total)}
            </p>
            <div className="mx-auto mt-5 flex max-w-sm items-center justify-between gap-3 rounded-xl border bg-white p-3">
              <span className="truncate text-sm font-semibold">{settings.pix_key}</span>
              <Button
                size="icon"
                variant="ghost"
                className="shrink-0"
                onClick={() => {
                  void navigator.clipboard.writeText(settings.pix_key)
                  toast({ title: 'Chave PIX copiada' })
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            {canManage ? (
              <AlertDialogAction onClick={() => void confirmPayment()}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Confirmar recebimento
              </AlertDialogAction>
            ) : (
              <AlertDialogAction onClick={() => setCheckout(null)}>Entendi</AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
