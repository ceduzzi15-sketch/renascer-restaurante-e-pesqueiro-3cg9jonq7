import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { BookOpen, FileSpreadsheet, FolderOpen, ImagePlus, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import { createRecord, deleteRecord, getFileUrl, listRecords, updateRecord } from '@/services/api'
import { fetchMenuFolders, groupCategoriesByFolder } from '@/services/menu'
import EmptyState from '@/components/EmptyState'
import LoadingState from '@/components/LoadingState'
import CsvImportModal from '@/components/CsvImportModal'
import CategoryArtDialog from '@/components/CategoryArtDialog'
import MenuFolderEditor from '@/components/MenuFolderEditor'
import MenuItemCard from '@/components/MenuItemCard'
import LogoEmblem from '@/components/LogoEmblem'
import { sortHighlightsFirst } from '@/lib/highlights'
import { cn } from '@/lib/utils'
import type { MenuCategory, MenuCategoryRecord, MenuFolder, MenuItem } from '@/types'

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
  const [folders, setFolders] = useState<MenuFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFolder, setActiveFolder] = useState<string>('todos')
  const [folderEditorOpen, setFolderEditorOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [deleting, setDeleting] = useState<MenuItem | null>(null)
  const [artCategory, setArtCategory] = useState<MenuCategoryRecord | null>(null)
  const [artDialogOpen, setArtDialogOpen] = useState(false)
  const [focusPhotoField, setFocusPhotoField] = useState(false)
  const [form, setForm] = useState(blankForm)

  const refresh = async () => {
    try {
      const [itemRecords, categoryRecords, folderRecords] = await Promise.all([
        listRecords<MenuItem>('menu_items', { sort: 'categoria_ordem,ordem,category,name' }),
        listRecords<MenuCategoryRecord>('menu_categories', { sort: 'order,name' }).catch(() => []),
        fetchMenuFolders().catch(() => []),
      ])
      setItems(itemRecords)
      setCategories(categoryRecords)
      setFolders(folderRecords)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const sections = useMemo(
    () => groupCategoriesByFolder(categories, folders),
    [categories, folders],
  )

  const itemsOfCategory = (categoryId: string) =>
    items.filter((item) => item.categoria_id === categoryId)

  const matchesSearch = (item: MenuItem) => {
    const term = search.toLowerCase()
    if (!term) return true
    return (
      item.name.toLowerCase().includes(term) ||
      (item.description && item.description.toLowerCase().includes(term)) ||
      (item.subcategoria && item.subcategoria.toLowerCase().includes(term)) ||
      (item.category_name && item.category_name.toLowerCase().includes(term))
    )
  }

  const artImage = (category: MenuCategoryRecord) =>
    getFileUrl(category, category.art_image as string, '200x200')

  const openArtDialog = (category: MenuCategoryRecord) => {
    setArtCategory(category)
    setArtDialogOpen(true)
  }

  const openCreate = () => {
    setEditing(null)
    setForm(blankForm)
    setDialogOpen(true)
  }

  /** Abre o diálogo de edição já com o seletor de foto em destaque. */
  const openPhotoDialog = (item: MenuItem) => {
    openEdit(item)
    setFocusPhotoField(true)
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
      setFocusPhotoField(false)
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

  const activeFolderName =
    activeFolder === 'todos'
      ? 'Todos os setores'
      : (sections.find((section) => (section.folder?.id ?? 'sem-pasta') === activeFolder)?.folder
          ?.name ?? 'Sem pasta')

  const folderTabs = [
    { id: 'todos', name: 'Todos', count: items.length },
    ...sections.map((section) => ({
      id: section.folder?.id ?? 'sem-pasta',
      name: section.folder?.name ?? 'Sem pasta',
      count: section.categories.reduce(
        (total, category) => total + itemsOfCategory(category.id).length,
        0,
      ),
    })),
  ]

  const visibleSections =
    activeFolder === 'todos'
      ? sections
      : sections.filter((section) => (section.folder?.id ?? 'sem-pasta') === activeFolder)

  return (
    <div className="page-shell space-y-6">
      {/* Visual do Cartaz no topo da tela de Cardápio */}
      <section className="poster-container poster-double-border rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <LogoEmblem className="mb-2 h-16 w-16 rounded-xl border border-[#d4af37]/40 shadow-lg" />
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d4af37]/40 bg-[#0c241b]/80 px-3 py-1 text-xs font-semibold tracking-widest text-[#e5c158] uppercase">
              ✦ Cartaz Oficial ✦
            </div>
            <h1 className="mt-2 font-cinzel text-3xl sm:text-4xl font-black uppercase tracking-wider text-[#e5c158]">
              RENASCER
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
                onClick={() => setFolderEditorOpen(true)}
                variant="outline"
                className="border-[#d4af37]/60 font-condensed text-sm uppercase tracking-wider text-white hover:bg-white/10 hover:text-white h-10"
              >
                <FolderOpen className="mr-2 h-4 w-4 text-[#e5c158]" /> Pastas
              </Button>
              <Button
                onClick={() => setCsvModalOpen(true)}
                className="bg-[#d4af37] font-condensed text-sm font-bold uppercase tracking-wider text-[#0d271e] hover:bg-[#e5c158] h-10 px-4 shadow-md"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4 text-[#0d271e]" />
                Importar CSV
              </Button>
              <Button
                variant="outline"
                onClick={openCreate}
                className="border-[#d4af37]/60 font-condensed text-sm uppercase tracking-wider text-white hover:bg-white/10 hover:text-white h-10"
              >
                <Plus className="mr-2 h-4 w-4 text-[#e5c158]" /> Novo item
              </Button>
            </div>
          )}
        </div>

        {/* Faixa decorativa xadrez estilo cartaz Renascer */}
        <div className="mt-6 h-2.5 w-full poster-ribbon rounded-sm opacity-80" />
      </section>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {folderTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeFolder === tab.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFolder(tab.id)}
              className="font-condensed text-xs uppercase tracking-wider"
            >
              {tab.name} ({tab.count})
            </Button>
          ))}
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
      ) : visibleSections.length === 0 || items.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nenhum item encontrado"
          description="Ajuste os filtros ou utilize o botão 'Importar CSV' para carregar a lista de produtos."
        />
      ) : (
        <div className="space-y-10">
          {visibleSections.map((section) => {
            const sectionCategories = section.categories.filter((category) =>
              itemsOfCategory(category.id).some(matchesSearch),
            )
            if (sectionCategories.length === 0) return null

            return (
              <div key={section.folder?.id ?? 'sem-pasta'} className="space-y-5">
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className="border-[#d4af37]/50 bg-[#0d271e] px-3 py-1.5 font-condensed text-xs font-bold uppercase tracking-[0.18em] text-[#e5c158]"
                  >
                    <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
                    {section.folder?.name ?? 'Sem pasta'}
                  </Badge>
                  {activeFolder !== 'todos' && (
                    <span className="text-xs text-muted-foreground">{activeFolderName}</span>
                  )}
                </div>

                {sectionCategories.map((category) => {
                  const categoryItems = sortHighlightsFirst(
                    itemsOfCategory(category.id).filter(matchesSearch),
                  )
                  return (
                    <div key={category.id} className="space-y-3">
                      <div className="flex items-center gap-2">
                        {category.art_image ? (
                          <img
                            src={artImage(category)}
                            alt={`Arte da categoria ${category.name}`}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : null}
                        <h2 className="font-condensed text-lg font-bold uppercase tracking-wider text-foreground">
                          {category.name}
                        </h2>
                        <span className="text-xs text-muted-foreground">
                          ({categoryItems.length} {categoryItems.length === 1 ? 'item' : 'itens'})
                        </span>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {categoryItems.map((item) => (
                          <MenuItemCard
                            key={item.id}
                            item={item}
                            onEdit={openEdit}
                            onDelete={setDeleting}
                            onAddPhoto={openPhotoDialog}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Importação de CSV */}
      <CsvImportModal open={csvModalOpen} onOpenChange={setCsvModalOpen} onSuccess={refresh} />

      {/* Modal de arte da categoria */}
      <CategoryArtDialog
        category={artCategory}
        open={artDialogOpen}
        onOpenChange={setArtDialogOpen}
        onSaved={refresh}
      />

      {/* Editor de pastas/setores do cardápio */}
      <Dialog open={folderEditorOpen} onOpenChange={setFolderEditorOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Pastas do cardápio</DialogTitle>
            <DialogDescription>
              Organize as categorias em pastas/setores — elas aparecem agrupadas no painel e no
              cardápio público.
            </DialogDescription>
          </DialogHeader>
          <MenuFolderEditor categories={categories} onChanged={refresh} />
        </DialogContent>
      </Dialog>

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
              <div
                className={cn(
                  'space-y-2',
                  focusPhotoField && 'rounded-2xl border-2 border-primary/50 p-3',
                )}
              >
                <Label htmlFor="image">Foto</Label>
                {focusPhotoField && (
                  <p className="text-xs text-muted-foreground">
                    Selecione a nova foto do item — ela substitui a anterior ao salvar.
                  </p>
                )}
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
