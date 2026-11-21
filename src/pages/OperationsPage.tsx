import { useEffect, useState } from 'react'
import { Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import {
  listRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  formatCurrency,
} from '@/services/api'
import type { ServiceRate, ServiceRateType } from '@/types'

const TYPE_LABELS: Record<ServiceRateType, string> = {
  pesca: 'Pesca',
  locacao: 'Locação',
  estacionamento: 'Estacionamento',
}

const DURATIONS = ['Diária', 'Meio período', 'Hora', 'Avulso']

const canManage = (role?: string) => role === 'gestor' || role === 'atendimento'

export default function OperationsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const editable = canManage(user?.role)
  const [rates, setRates] = useState<ServiceRate[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, { description: string; price: string }>>({})
  const [creating, setCreating] = useState(false)
  const [newItem, setNewItem] = useState({
    name: '',
    type: 'pesca' as ServiceRateType,
    description: '',
    price: '',
    duration: 'Diária',
  })

  const load = () => {
    setLoading(true)
    listRecords<ServiceRate>('service_rates', { sort: 'type,name' })
      .then(setRates)
      .catch(() => toast({ variant: 'destructive', title: 'Erro ao carregar tabela' }))
      .finally(() => setLoading(false))
  }

  useEffect(load, [toast])

  const draftOf = (rate: ServiceRate) =>
    drafts[rate.id] ?? {
      description: rate.description ?? '',
      price: String(rate.price ?? 0),
    }

  const setDraft = (id: string, patch: Partial<{ description: string; price: string }>) =>
    setDrafts((current) => ({
      ...current,
      [id]: { ...(current[id] ?? { description: '', price: '0' }), ...patch },
    }))

  const save = async (rate: ServiceRate) => {
    const draft = draftOf(rate)
    setSavingId(rate.id)
    try {
      const updated = await updateRecord<ServiceRate>('service_rates', rate.id, {
        description: draft.description.trim(),
        price: Number(draft.price.replace(',', '.')) || 0,
      })
      setRates((current) => current.map((row) => (row.id === rate.id ? updated : row)))
      setDrafts((current) => {
        const next = { ...current }
        delete next[rate.id]
        return next
      })
      toast({ title: 'Tabela atualizada' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível salvar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setSavingId(null)
    }
  }

  const create = async () => {
    if (!newItem.name.trim()) {
      toast({ variant: 'destructive', title: 'Informe o nome do item' })
      return
    }
    setCreating(true)
    try {
      const created = await createRecord<ServiceRate>('service_rates', {
        name: newItem.name.trim(),
        type: newItem.type,
        description: newItem.description.trim(),
        price: Number(newItem.price.replace(',', '.')) || 0,
        duration: newItem.duration,
        active: true,
      })
      setRates((current) => [...current, created].sort((a, b) => a.type.localeCompare(b.type)))
      setNewItem({ name: '', type: 'pesca', description: '', price: '', duration: 'Diária' })
      toast({ title: 'Item adicionado à tabela' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível criar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setCreating(false)
    }
  }

  const remove = async (rate: ServiceRate) => {
    if (!window.confirm(`Remover "${rate.name}" da tabela?`)) return
    try {
      await deleteRecord('service_rates', rate.id)
      setRates((current) => current.filter((row) => row.id !== rate.id))
      toast({ title: 'Item removido' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível remover',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    }
  }

  const toggleActive = async (rate: ServiceRate) => {
    try {
      const updated = await updateRecord<ServiceRate>('service_rates', rate.id, {
        active: !rate.active,
      })
      setRates((current) => current.map((row) => (row.id === rate.id ? updated : row)))
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível alterar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    }
  }

  const grouped = (['pesca', 'locacao', 'estacionamento'] as ServiceRateType[])
    .map((type) => ({ type, rows: rates.filter((row) => row.type === type) }))
    .filter((group) => group.rows.length > 0)

  return (
    <div className="page-shell space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow mb-2">Operações</p>
          <h1 className="page-heading">Pesca & locações</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Tabelas de preços de pesca, locação de caiaque/barco e estacionamento — edite descrição
            e valores direto aqui.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={loading ? 'mr-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4'} /> Atualizar
        </Button>
      </header>

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        grouped.map((group) => (
          <section key={group.type} className="space-y-3">
            <Badge
              variant="outline"
              className="px-3 py-1 text-xs font-bold uppercase tracking-wider"
            >
              {TYPE_LABELS[group.type]}
            </Badge>
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Item</th>
                    <th className="px-4 py-2.5 font-semibold">Descrição</th>
                    <th className="px-4 py-2.5 font-semibold">Valor</th>
                    <th className="px-4 py-2.5 font-semibold">Período</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    {editable && <th className="px-4 py-2.5 text-right font-semibold">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {group.rows.map((rate) => {
                    const draft = draftOf(rate)
                    const dirty =
                      draft.description !== (rate.description ?? '') ||
                      draft.price !== String(rate.price ?? 0)
                    return (
                      <tr key={rate.id}>
                        <td className="px-4 py-3 font-medium">{rate.name}</td>
                        <td className="px-4 py-3">
                          {editable ? (
                            <Input
                              value={draft.description}
                              onChange={(e) => setDraft(rate.id, { description: e.target.value })}
                              placeholder="Descrição exibida na tabela"
                              className="h-9 min-w-52"
                            />
                          ) : (
                            rate.description || '—'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editable ? (
                            <Input
                              value={draft.price}
                              onChange={(e) => setDraft(rate.id, { price: e.target.value })}
                              inputMode="decimal"
                              className="h-9 w-28"
                            />
                          ) : (
                            <strong>{formatCurrency(rate.price)}</strong>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{rate.duration}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => editable && toggleActive(rate)}
                            disabled={!editable}
                            className="disabled:cursor-default"
                          >
                            <Badge variant={rate.active ? 'default' : 'secondary'}>
                              {rate.active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </button>
                        </td>
                        {editable && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              {dirty && (
                                <Button
                                  size="sm"
                                  onClick={() => save(rate)}
                                  disabled={savingId === rate.id}
                                >
                                  {savingId === rate.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Pencil className="mr-1 h-3.5 w-3.5" />
                                  )}
                                  Salvar
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => remove(rate)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}

      {editable && (
        <section className="rounded-xl border bg-card p-5">
          <h2 className="flex items-center gap-2 text-base font-bold">
            <Plus className="h-4 w-4 text-primary" /> Novo item da tabela
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1.5">
              <Label htmlFor="new-name">Nome</Label>
              <Input
                id="new-name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Ex.: Diária de pesca"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-type">Tipo</Label>
              <select
                id="new-type"
                value={newItem.type}
                onChange={(e) =>
                  setNewItem({ ...newItem, type: e.target.value as ServiceRateType })
                }
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                {(['pesca', 'locacao', 'estacionamento'] as ServiceRateType[]).map((type) => (
                  <option key={type} value={type}>
                    {TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-description">Descrição</Label>
              <Input
                id="new-description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="h-9"
                placeholder="O que inclui"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-price">Valor (R$)</Label>
              <Input
                id="new-price"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                inputMode="decimal"
                className="h-9"
                placeholder="0,00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-duration">Período</Label>
              <select
                id="new-duration"
                value={newItem.duration}
                onChange={(e) => setNewItem({ ...newItem, duration: e.target.value })}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                {DURATIONS.map((duration) => (
                  <option key={duration} value={duration}>
                    {duration}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button onClick={create} disabled={creating} className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> {creating ? 'Adicionando...' : 'Adicionar item'}
          </Button>
        </section>
      )}
    </div>
  )
}
