import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  BookOpen,
  FileSpreadsheet,
  ImagePlus,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
} from 'lucide-react'
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
import CsvImportModal from '@/components/CsvImportModal'
import type { MenuCategory, MenuCategoryRecord, MenuItem } from '@/types'

const labels: Record<MenuCategory, string> = {
  comida: 'Comidas',
  porcao: 'Porções',
  bebida: 'Bebidas',
}

const blankForm = {
  name: '',
  description: '',
  category: 'comida' as MenuCategory,
  categoria_id: '',
  category_name: '',
  subcategoria: '',
  observacao: '',
  price: '',
  active: true,
  image: null as File | null,
}

export default function MenuPage() {
  const { user, isRole } = useAuth()
  const { toast } = useToast()
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<MenuCategoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('todos')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [deleting, setDeleting] = useState<MenuItem | null>(null)
  const [form, setForm] = useState(blankForm)

  const refresh = async () => {
    try {
      const [itemRecords, categoryRecords] = await Promise.all([
        listRecords<MenuItem>('menu_items', { sort: 'categoria_ordem,ordem,category,name' }),
        listRecords<MenuCategoryRecord>('menu_categories', { sort: 'order,name' }).catch(() => []),
      ])
      setItems(itemRecords)
      setCategories(categoryRecords)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const visible = useMemo(
    () =>
      items.filter((item) => {
        const matchesCategory =
          selectedCategoryTab === 'todos' ||
          item.categoria_id === selectedCategoryTab ||
          item.category === selectedCategoryTab

        const matchesSearch =
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(search.toLowerCase())) ||
          (item.subcategoria && item.subcategoria.toLowerCase().includes(search.toLowerCase())) ||
          (item.category_name && item.category_name.toLowerCase().includes(search.toLowerCase()))

        const matchesRole = user?.role !== 'cliente' || item.active
        return matchesCategory && matchesSearch && matchesRole
      }),
    [items, selectedCategoryTab, search, user?.role],
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
      description: item.description || '',
      category: item.category,
      categoria_id: item.categoria_id || '',
      category_name: item.category_name || '',
      subcategoria: item.subcategoria || '',
      observacao: item.observacao || '',
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
      if (form.categoria_id) data.set('categoria_id', form.categoria_id)
      if (form.category_name) data.set('category_name', form.category_name)
      if (form.subcategoria) data.set('subcategoria', form.subcategoria)
      if (form.observacao) data.set('observacao', form.observacao)
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
      {/* Visual do Cartaz no topo da tela de Cardápio */}
      <section className="poster-container poster-double-border rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d4af37]/40 bg-[#0c241b]/80 px-3 py-1 text-xs font-semibold tracking-widest text-[#e5c158] uppercase">
              ✦ Cartaz Oficial ✦
            </div>
            <h1 className="mt-2 font-cinzel text-3xl sm:text-4xl font-black uppercase tracking-wider text-[#e5c158]">
              RENASCERE
            </h1>
            <p className="font-condensed text-base uppercase tracking-[0.22em] text-white/80">
              Restaurante e Pesqueiro
            </p>
            <p className="mt-2 max-w-xl text-xs sm:text-sm text-white/70">
              {user?.role === 'cliente'
                ? 'Consulte os itens frescos de nossa cozinha e lance diretamente na sua comanda.'
                : 'Gestão completa do cardápio: cadastre novos pratos ou importe tabelas via CSV com categorias e preços.'}
            </p>
          </div>

          {isRole('gestor', 'atendimento') && (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => setCsvModalOpen(true)}
                className="bg-[#d4af37] text-[#0d271e] hover:bg-[#e5c158] font-condensed text-sm font-bold uppercase tracking-wider h-10 px-4 shadow-md"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4 text-[#0d271e]" />
                Importar CSV
              </Button>
              <Button
                variant="outline"
                onClick={openCreate}
                className="border-[#d4af37]/60 text-white hover:bg-white/10 hover:text-white font-condensed text-sm uppercase tracking-wider h-10"
              >
                <Plus className="mr-2 h-4 w-4 text-[#e5c158]" /> Novo item
              </Button>
            </div>
          )}
        </div>

        {/* Faixa decorativa xadrez estilo cartaz Renascere */}
        <div className="mt-6 h-2.5 w-full poster-ribbon rounded-sm opacity-80" />
      </section>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Button
            variant={selectedCategoryTab === 'todos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategoryTab('todos')}
            className="font-condensed text-xs uppercase tracking-wider"
          >
            Todos ({items.length})
          </Button>

          {categories.length > 0 ? (
            categories.map((cat) => (
              <Button
                key={cat.category_id}
                variant={selectedCategoryTab === cat.category_id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategoryTab(cat.category_id)}
                className="font-condensed text-xs uppercase tracking-wider"
              >
                {cat.name}
              </Button>
            ))
          ) : (
            <>
              <Button
                variant={selectedCategoryTab === 'comida' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategoryTab('comida')}
                className="font-condensed text-xs uppercase tracking-wider"
              >
                Comidas
              </Button>
              <Button
                variant={selectedCategoryTab === 'porcao' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategoryTab('porcao')}
                className="font-condensed text-xs uppercase tracking-wider"
              >
                Porções
              </Button>
              <Button
                variant={selectedCategoryTab === 'bebida' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategoryTab('bebida')}
                className="font-condensed text-xs uppercase tracking-wider"
              >
                Bebidas
              </Button>
            </>
          )}
        </div>

        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, subcategoria..."
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
          description="Ajuste os filtros ou utilize o botão 'Importar CSV' para carregar a lista de produtos."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visible.map((item, index) => {
            const image = item.image
              ? getFileUrl(item, item.image, '600x400')
              : item.image_url ||
                (item.category === 'bebida'
                  ? LOCAL_PHOTOS.lake
                  : index % 2
                    ? LOCAL_PHOTOS.fish
                    : LOCAL_PHOTOS.dish)

            const categoryBadgeLabel = item.category_name || labels[item.category] || 'Prato'

            return (
              <article
                key={item.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:shadow-md"
              >
                <div>
                  <div className="relative h-40 overflow-hidden bg-muted">
                    <img
                      src={image}
                      alt={item.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    <Badge className="absolute left-3 top-3 bg-[#0d271e] text-[#e5c158] border border-[#d4af37]/40 font-condensed text-xs uppercase tracking-wider">
                      {categoryBadgeLabel}
                    </Badge>
                    {item.subcategoria && (
                      <span className="absolute left-3 bottom-2.5 text-xs text-white/90 drop-shadow font-medium">
                        {item.subcategoria}
                      </span>
                    )}
                    {!item.active && (
                      <Badge variant="destructive" className="absolute right-3 top-3">
                        Indisponível
                      </Badge>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {item.ordem ? (
                          <span className="text-[11px] font-mono text-muted-foreground mr-1.5 font-bold">
                            #{item.ordem}
                          </span>
                        ) : null}
                        <h2 className="font-condensed text-xl font-bold uppercase tracking-wide text-foreground group-hover:text-primary transition">
                          {item.name}
                        </h2>
                      </div>
                    </div>

                    {(item.observacao || item.description) && (
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {item.observacao || item.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground block">Preço</span>
                      <span className="font-condensed text-xl font-extrabold text-primary">
                        {item.preco_formatado || formatCurrency(item.price)}
                      </span>
                    </div>

                    {user?.role === 'cliente' ? (
                      <Button size="sm" asChild className="bg-primary">
                        <a href="/app/comandas">
                          <ShoppingBag className="mr-1.5 h-4 w-4" /> Pedir
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

      {/* Modal de Importação de CSV */}
      <CsvImportModal open={csvModalOpen} onOpenChange={setCsvModalOpen} onSuccess={refresh} />

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
                  <Label htmlFor="subcategoria">Subcategoria</Label>
                  <Input
                    id="subcategoria"
                    value={form.subcategoria}
                    placeholder="Ex: Segunda a Domingo, Garrafa..."
                    onChange={(e) => setForm({ ...form, subcategoria: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacao">Observação</Label>
                  <Input
                    id="observacao"
                    value={form.observacao}
                    placeholder="Ex: 500 g, 10 un, 350 ml..."
                    onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                  />
                </div>
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
