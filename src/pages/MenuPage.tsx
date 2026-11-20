import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { BookOpen, ImagePlus, Pencil, Plus, Search, ShoppingBag, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import {
  createRecord,
  deleteRecord,
  formatCurrency,
  getFileUrl,
  listRecords,
  updateRecord,
} from '@/services/api'
import { LOCAL_PHOTOS } from '@/lib/assets'
import EmptyState from '@/components/EmptyState'
import LoadingState from '@/components/LoadingState'
import type { MenuCategory, MenuItem } from '@/types'

const labels: Record<MenuCategory, string> = {
  comida: 'Comidas',
  porcao: 'Porções',
  bebida: 'Bebidas',
}
const blankForm = {
  name: '',
  description: '',
  category: 'comida' as MenuCategory,
  price: '',
  active: true,
  image: null as File | null,
}

export default function MenuPage() {
  const { user, isRole } = useAuth()
  const { toast } = useToast()
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<'todos' | MenuCategory>('todos')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [deleting, setDeleting] = useState<MenuItem | null>(null)
  const [form, setForm] = useState(blankForm)

  const refresh = async () => {
    const records = await listRecords<MenuItem>('menu_items', { sort: 'category,name' })
    setItems(records)
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
  }, [])

  const visible = useMemo(
    () =>
      items.filter(
        (item) =>
          (category === 'todos' || item.category === category) &&
          item.name.toLowerCase().includes(search.toLowerCase()) &&
          (user?.role !== 'cliente' || item.active),
      ),
    [items, category, search, user?.role],
  )

  const openCreate = () => {
    setEditing(null)
    setForm(blankForm)
    setDialogOpen(true)
  }
  const openEdit = (item: MenuItem) => {
    setEditing(item)
    setForm({
      name: item.name,
      description: item.description,
      category: item.category,
      price: String(item.price),
      active: item.active,
      image: null,
    })
    setDialogOpen(true)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      const data = new FormData()
      data.set('name', form.name)
      data.set('description', form.description)
      data.set('category', form.category)
      data.set('price', form.price)
      data.set('active', String(form.active))
      if (form.image) data.set('image', form.image)
      if (editing) await updateRecord<MenuItem>('menu_items', editing.id, data)
      else await createRecord<MenuItem>('menu_items', data)
      toast({
        title: editing ? 'Item atualizado' : 'Item adicionado',
        description: 'O cardápio já está com as novas informações.',
      })
      setDialogOpen(false)
      await refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível salvar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!deleting) return
    try {
      await deleteRecord('menu_items', deleting.id)
      setItems((current) => current.filter((item) => item.id !== deleting.id))
      toast({ title: 'Item removido' })
    } catch {
      toast({ variant: 'destructive', title: 'Não foi possível remover o item' })
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="page-shell space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow mb-2">Cozinha & bar</p>
          <h1 className="page-heading">Cardápio</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {user?.role === 'cliente'
              ? 'Escolha o que deseja e adicione à sua comanda.'
              : 'Organize comidas, porções e bebidas disponíveis.'}
          </p>
        </div>
        {isRole('gestor', 'atendimento') && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Novo item
          </Button>
        )}
      </header>

      <div className="flex flex-col justify-between gap-4 rounded-2xl border bg-card p-3 sm:flex-row sm:items-center">
        <Tabs value={category} onValueChange={(value) => setCategory(value as typeof category)}>
          <TabsList className="grid w-full grid-cols-4 sm:w-auto">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="comida">Comidas</TabsTrigger>
            <TabsTrigger value="porcao">Porções</TabsTrigger>
            <TabsTrigger value="bebida">Bebidas</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar no cardápio"
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nenhum item encontrado"
          description="Ajuste os filtros ou adicione o primeiro item desta categoria."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visible.map((item, index) => {
            const image = item.image
              ? getFileUrl(item, item.image, '600x400')
              : item.image_url ||
                (item.category === 'bebida'
                  ? LOCAL_PHOTOS.lake
                  : index % 2
                    ? LOCAL_PHOTOS.fish
                    : LOCAL_PHOTOS.dish)
            return (
              <article
                key={item.id}
                className="group overflow-hidden rounded-2xl border bg-card shadow-[0_15px_40px_-30px_rgba(24,67,51,0.45)]"
              >
                <div className="relative h-44 overflow-hidden bg-muted">
                  <img
                    src={image}
                    alt={item.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <Badge className="absolute left-3 top-3 bg-primary/90">
                    {labels[item.category]}
                  </Badge>
                  {!item.active && (
                    <Badge variant="secondary" className="absolute right-3 top-3">
                      Indisponível
                    </Badge>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl">{item.name}</h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(item.price)}
                    </span>
                    {user?.role === 'cliente' ? (
                      <Button size="sm" asChild>
                        <a href="/app/comandas">
                          <ShoppingBag className="mr-2 h-4 w-4" /> Pedir
                        </a>
                      </Button>
                    ) : (
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(item)}
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {user?.role === 'gestor' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleting(item)}
                            className="text-destructive hover:text-destructive"
                            aria-label="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar item' : 'Novo item do cardápio'}</DialogTitle>
              <DialogDescription>
                Preencha as informações que serão exibidas para a equipe e os clientes.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-5">
              <div className="space-y-2">
                <Label htmlFor="item-name">Nome</Label>
                <Input
                  id="item-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value: MenuCategory) => setForm({ ...form, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comida">Comida</SelectItem>
                      <SelectItem value="porcao">Porção</SelectItem>
                      <SelectItem value="bebida">Bebida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Preço</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Foto</Label>
                <label
                  htmlFor="image"
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground hover:bg-muted/40"
                >
                  <ImagePlus className="h-5 w-5 text-primary" />
                  <span>{form.image?.name ?? 'Escolher foto do item'}</span>
                </label>
                <Input
                  id="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => setForm({ ...form, image: e.target.files?.[0] ?? null })}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/45 p-3">
                <div>
                  <Label>Disponível</Label>
                  <p className="text-xs text-muted-foreground">
                    Visível para pedidos dos clientes.
                  </p>
                </div>
                <Switch
                  checked={form.active}
                  onCheckedChange={(active) => setForm({ ...form, active })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              O item deixará de aparecer no cardápio. Registros antigos de venda serão preservados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
