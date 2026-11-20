import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CalendarPlus, Car, Clock3, Fish, Plus, ShipWheel, SquareParking } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { createRecord, formatCurrency, formatDate, listRecords, updateRecord } from '@/services/api'
import type { Activity, ParkingReservation, ServiceRate } from '@/types'
import LoadingState from '@/components/LoadingState'
import EmptyState from '@/components/EmptyState'

const localDateTime = () => {
  const date = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
  return date.toISOString().slice(0, 16)
}

export default function OperationsPage() {
  const { toast } = useToast()
  const [rates, setRates] = useState<ServiceRate[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [parking, setParking] = useState<ParkingReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [activityOpen, setActivityOpen] = useState(false)
  const [rateOpen, setRateOpen] = useState(false)
  const [parkingOpen, setParkingOpen] = useState(false)
  const [activityForm, setActivityForm] = useState({
    type: 'pesca' as 'pesca' | 'locacao',
    rate: '',
    customer_name: '',
    start_at: localDateTime(),
    status: 'reservada',
    notes: '',
  })
  const [rateForm, setRateForm] = useState({
    name: '',
    type: 'pesca' as 'pesca' | 'locacao',
    description: '',
    price: '',
    duration: '',
    active: true,
  })
  const [parkingForm, setParkingForm] = useState({
    spot: '',
    vehicle: '',
    plate: '',
    customer_name: '',
    start_at: localDateTime(),
    status: 'reservada',
  })

  const refresh = async () => {
    const [rateRows, activityRows, parkingRows] = await Promise.all([
      listRecords<ServiceRate>('service_rates', { sort: 'type,price' }),
      listRecords<Activity>('activities', { sort: '-start_at' }),
      listRecords<ParkingReservation>('parking_reservations', { sort: '-start_at' }),
    ])
    setRates(rateRows)
    setActivities(activityRows)
    setParking(parkingRows)
    setLoading(false)
  }
  useEffect(() => {
    void refresh()
  }, [])

  const selectedRate = rates.find((rate) => rate.id === activityForm.rate)
  const activeActivities = useMemo(
    () => activities.filter((activity) => activity.status !== 'cancelada'),
    [activities],
  )
  const activeParking = useMemo(
    () => parking.filter((item) => ['reservada', 'ocupada'].includes(item.status)),
    [parking],
  )

  const saveActivity = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedRate) return
    try {
      await createRecord<Activity>('activities', {
        type: activityForm.type,
        rate: selectedRate.id,
        customer_name: activityForm.customer_name,
        item_name: selectedRate.name,
        amount: selectedRate.price,
        start_at: new Date(activityForm.start_at).toISOString(),
        status: activityForm.status,
        notes: activityForm.notes,
      })
      toast({ title: activityForm.type === 'pesca' ? 'Diária registrada' : 'Locação registrada' })
      setActivityOpen(false)
      await refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível registrar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    }
  }

  const saveRate = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await createRecord<ServiceRate>('service_rates', {
        ...rateForm,
        price: Number(rateForm.price),
      })
      toast({ title: 'Valor adicionado à tabela' })
      setRateOpen(false)
      await refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível salvar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    }
  }

  const saveParking = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await createRecord<ParkingReservation>('parking_reservations', {
        ...parkingForm,
        plate: parkingForm.plate.toUpperCase(),
        start_at: new Date(parkingForm.start_at).toISOString(),
      })
      toast({ title: 'Vaga reservada' })
      setParkingOpen(false)
      await refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível reservar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    }
  }

  const updateStatus = async (
    collection: 'activities' | 'parking_reservations',
    id: string,
    status: string,
  ) => {
    try {
      await updateRecord(collection, id, {
        status,
        ...(status === 'concluida' || status === 'liberada'
          ? { end_at: new Date().toISOString() }
          : {}),
      })
      await refresh()
    } catch {
      toast({ variant: 'destructive', title: 'Não foi possível atualizar o status' })
    }
  }

  return (
    <div className="page-shell space-y-6">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow mb-2">Lazer & estrutura</p>
          <h1 className="page-heading">Pesca, locações e estacionamento</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Controle diárias, equipamentos e vagas reservadas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setRateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo valor
          </Button>
          <Button variant="outline" onClick={() => setParkingOpen(true)}>
            <SquareParking className="mr-2 h-4 w-4" /> Reservar vaga
          </Button>
          <Button onClick={() => setActivityOpen(true)}>
            <CalendarPlus className="mr-2 h-4 w-4" /> Novo registro
          </Button>
        </div>
      </header>

      {loading ? (
        <LoadingState />
      ) : (
        <Tabs defaultValue="agenda">
          <TabsList className="grid w-full grid-cols-3 sm:w-[480px]">
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
            <TabsTrigger value="tabela">Tabela de valores</TabsTrigger>
            <TabsTrigger value="parking">Estacionamento</TabsTrigger>
          </TabsList>
          <TabsContent value="agenda" className="mt-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {activeActivities.length === 0 ? (
                <EmptyState
                  icon={Fish}
                  title="Agenda livre"
                  description="Registre a primeira diária de pesca ou locação."
                  className="md:col-span-2 xl:col-span-3"
                />
              ) : (
                activeActivities.map((activity) => (
                  <article key={activity.id} className="soft-card p-5">
                    <div className="flex items-start justify-between">
                      <span
                        className={`grid h-11 w-11 place-items-center rounded-xl ${activity.type === 'pesca' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}
                      >
                        {activity.type === 'pesca' ? (
                          <Fish className="h-5 w-5" />
                        ) : (
                          <ShipWheel className="h-5 w-5" />
                        )}
                      </span>
                      <Badge variant="secondary" className="capitalize">
                        {activity.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <h2 className="mt-4 text-xl">{activity.item_name}</h2>
                    <p className="mt-1 text-sm font-medium">{activity.customer_name}</p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock3 className="h-4 w-4" /> {formatDate(activity.start_at, true)}
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <strong className="text-primary">{formatCurrency(activity.amount)}</strong>
                      {!['concluida', 'cancelada'].includes(activity.status) && (
                        <Select
                          value={activity.status}
                          onValueChange={(status) =>
                            void updateStatus('activities', activity.id, status)
                          }
                        >
                          <SelectTrigger className="h-8 w-36 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="reservada">Reservada</SelectItem>
                            <SelectItem value="em_andamento">Em andamento</SelectItem>
                            <SelectItem value="concluida">Concluída</SelectItem>
                            <SelectItem value="cancelada">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </TabsContent>
          <TabsContent value="tabela" className="mt-5">
            <div className="grid gap-4 md:grid-cols-2">
              {['pesca', 'locacao'].map((type) => (
                <section key={type} className="soft-card p-5 sm:p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary">
                      {type === 'pesca' ? (
                        <Fish className="h-5 w-5" />
                      ) : (
                        <ShipWheel className="h-5 w-5" />
                      )}
                    </span>
                    <h2 className="text-xl">
                      {type === 'pesca' ? 'Diárias de pesca' : 'Locações'}
                    </h2>
                  </div>
                  {rates
                    .filter((rate) => rate.type === type)
                    .map((rate) => (
                      <div key={rate.id} className="data-row">
                        <div>
                          <p className="text-sm font-semibold">{rate.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {rate.duration} · {rate.description}
                          </p>
                        </div>
                        <strong className="shrink-0 text-primary">
                          {formatCurrency(rate.price)}
                        </strong>
                      </div>
                    ))}
                </section>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="parking" className="mt-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {activeParking.length === 0 ? (
                <EmptyState
                  icon={Car}
                  title="Nenhuma vaga reservada"
                  description="As vagas do dia aparecerão aqui."
                  className="md:col-span-2 xl:col-span-3"
                />
              ) : (
                activeParking.map((item) => (
                  <article key={item.id} className="soft-card p-5">
                    <div className="flex items-start justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 font-bold text-amber-700">
                        {item.spot}
                      </span>
                      <Badge variant="secondary" className="capitalize">
                        {item.status}
                      </Badge>
                    </div>
                    <h2 className="mt-4 font-sans text-base font-bold tracking-normal">
                      {item.customer_name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {item.vehicle} · {item.plate}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {formatDate(item.start_at, true)}
                    </p>
                    <Select
                      value={item.status}
                      onValueChange={(status) =>
                        void updateStatus('parking_reservations', item.id, status)
                      }
                    >
                      <SelectTrigger className="mt-4 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reservada">Reservada</SelectItem>
                        <SelectItem value="ocupada">Ocupada</SelectItem>
                        <SelectItem value="liberada">Liberada</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </article>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
        <DialogContent>
          <form onSubmit={saveActivity}>
            <DialogHeader>
              <DialogTitle>Registrar pesca ou locação</DialogTitle>
              <DialogDescription>
                Selecione um item da tabela e vincule ao cliente.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-5">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={activityForm.type}
                  onValueChange={(type: 'pesca' | 'locacao') =>
                    setActivityForm({ ...activityForm, type, rate: '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pesca">Diária de pesca</SelectItem>
                    <SelectItem value="locacao">Locação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Serviço</Label>
                <Select
                  value={activityForm.rate}
                  onValueChange={(rate) => setActivityForm({ ...activityForm, rate })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha na tabela" />
                  </SelectTrigger>
                  <SelectContent>
                    {rates
                      .filter((rate) => rate.type === activityForm.type && rate.active)
                      .map((rate) => (
                        <SelectItem key={rate.id} value={rate.id}>
                          {rate.name} · {formatCurrency(rate.price)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="activity-customer">Cliente</Label>
                <Input
                  id="activity-customer"
                  value={activityForm.customer_name}
                  onChange={(e) =>
                    setActivityForm({ ...activityForm, customer_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start">Início</Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={activityForm.start_at}
                  onChange={(e) => setActivityForm({ ...activityForm, start_at: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activity-notes">Observações</Label>
                <Textarea
                  id="activity-notes"
                  value={activityForm.notes}
                  onChange={(e) => setActivityForm({ ...activityForm, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setActivityOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!selectedRate}>
                Registrar {selectedRate ? `· ${formatCurrency(selectedRate.price)}` : ''}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={rateOpen} onOpenChange={setRateOpen}>
        <DialogContent>
          <form onSubmit={saveRate}>
            <DialogHeader>
              <DialogTitle>Novo valor na tabela</DialogTitle>
              <DialogDescription>
                Cadastre uma diária de pesca ou item para locação.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={rateForm.type}
                    onValueChange={(type: 'pesca' | 'locacao') =>
                      setRateForm({ ...rateForm, type })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pesca">Pesca</SelectItem>
                      <SelectItem value="locacao">Locação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate-price">Valor</Label>
                  <Input
                    id="rate-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={rateForm.price}
                    onChange={(e) => setRateForm({ ...rateForm, price: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate-name">Nome</Label>
                <Input
                  id="rate-name"
                  value={rateForm.name}
                  onChange={(e) => setRateForm({ ...rateForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duração/horário</Label>
                <Input
                  id="duration"
                  value={rateForm.duration}
                  onChange={(e) => setRateForm({ ...rateForm, duration: e.target.value })}
                  placeholder="Ex.: 1 hora ou 07h às 18h"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate-description">Descrição</Label>
                <Textarea
                  id="rate-description"
                  value={rateForm.description}
                  onChange={(e) => setRateForm({ ...rateForm, description: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                <Label>Disponível</Label>
                <Switch
                  checked={rateForm.active}
                  onCheckedChange={(active) => setRateForm({ ...rateForm, active })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar valor</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={parkingOpen} onOpenChange={setParkingOpen}>
        <DialogContent>
          <form onSubmit={saveParking}>
            <DialogHeader>
              <DialogTitle>Reservar estacionamento</DialogTitle>
              <DialogDescription>Vincule a vaga ao cliente e ao veículo.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="spot">Vaga</Label>
                  <Input
                    id="spot"
                    value={parkingForm.spot}
                    onChange={(e) => setParkingForm({ ...parkingForm, spot: e.target.value })}
                    placeholder="A01"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plate">Placa</Label>
                  <Input
                    id="plate"
                    value={parkingForm.plate}
                    onChange={(e) =>
                      setParkingForm({ ...parkingForm, plate: e.target.value.toUpperCase() })
                    }
                    placeholder="ABC1D23"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parking-customer">Cliente</Label>
                <Input
                  id="parking-customer"
                  value={parkingForm.customer_name}
                  onChange={(e) =>
                    setParkingForm({ ...parkingForm, customer_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle">Veículo</Label>
                <Input
                  id="vehicle"
                  value={parkingForm.vehicle}
                  onChange={(e) => setParkingForm({ ...parkingForm, vehicle: e.target.value })}
                  placeholder="Ex.: Onix prata"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parking-start">Horário</Label>
                <Input
                  id="parking-start"
                  type="datetime-local"
                  value={parkingForm.start_at}
                  onChange={(e) => setParkingForm({ ...parkingForm, start_at: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setParkingOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Reservar vaga</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
