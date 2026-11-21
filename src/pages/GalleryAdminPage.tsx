import { useEffect, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Film,
  ImagePlus,
  Images,
  LoaderCircle,
  Star,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { getFileUrl } from '@/services/api'
import {
  createGalleryMedia,
  deleteGalleryMedia,
  getGalleryMedia,
  reorderGalleryMedia,
  updateGalleryMedia,
} from '@/services/gallery'
import EmptyState from '@/components/EmptyState'
import LoadingState from '@/components/LoadingState'
import type { GalleryMedia } from '@/types'

const blankForm = {
  type: 'foto' as GalleryMedia['type'],
  caption: '',
  featured: false,
  file: null as File | null,
}

export default function GalleryAdminPage() {
  const { isRole } = useAuth()
  const { toast } = useToast()
  const [items, setItems] = useState<GalleryMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(blankForm)
  const [deleting, setDeleting] = useState<GalleryMedia | null>(null)
  const [movingId, setMovingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canManage = isRole('gestor', 'atendimento')
  const canDelete = isRole('gestor')

  const refresh = async () => {
    try {
      setItems(await getGalleryMedia())
    } catch {
      toast({ variant: 'destructive', title: 'Não foi possível carregar a galeria' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = async () => {
    if (!form.file) {
      toast({
        variant: 'destructive',
        title: 'Escolha um arquivo',
        description: 'Selecione uma foto (JPG, PNG, WebP) ou um vídeo (MP4, WebM, MOV até 100 MB).',
      })
      return
    }
    setSaving(true)
    try {
      const data = new FormData()
      data.set('type', form.type)
      data.set('caption', form.caption)
      data.set('featured', String(form.featured))
      data.set('file', form.file)
      data.set('order', String(items.length + 1))
      await createGalleryMedia(data)
      toast({ title: 'Mídia adicionada', description: 'A galeria do site já foi atualizada.' })
      setDialogOpen(false)
      setForm(blankForm)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível enviar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!deleting) return
    try {
      await deleteGalleryMedia(deleting.id)
      setItems((current) => current.filter((item) => item.id !== deleting.id))
      toast({ title: 'Mídia removida' })
    } catch {
      toast({ variant: 'destructive', title: 'Não foi possível remover a mídia' })
    } finally {
      setDeleting(null)
    }
  }

  const toggleFeatured = async (item: GalleryMedia, featured: boolean) => {
    setItems((current) =>
      current.map((media) => (media.id === item.id ? { ...media, featured } : media)),
    )
    try {
      await updateGalleryMedia(item.id, { featured })
      toast({ title: featured ? 'Mídia em destaque' : 'Destaque removido' })
    } catch {
      setItems((current) =>
        current.map((media) => (media.id === item.id ? { ...media, featured: !featured } : media)),
      )
      toast({ variant: 'destructive', title: 'Não foi possível atualizar o destaque' })
    }
  }

  const move = async (item: GalleryMedia, direction: -1 | 1) => {
    const index = items.findIndex((media) => media.id === item.id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    setItems(next)
    setMovingId(item.id)
    try {
      await reorderGalleryMedia(next)
    } catch {
      toast({ variant: 'destructive', title: 'Não foi possível reordenar' })
      await refresh()
    } finally {
      setMovingId(null)
    }
  }

  const mediaUrl = (item: GalleryMedia) => getFileUrl(item, item.file)

  return (
    <div className="page-shell space-y-6">
      <section className="flex flex-col justify-between gap-4 rounded-2xl border bg-card p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl">Galeria do site</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Envie fotos e vídeos do pesqueiro para a seção “Fotos e vídeos do local” da página
            pública. Vídeos devem ter até 100 MB — prefira clipes curtos (MP4).
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setForm(blankForm)
              setDialogOpen(true)
            }}
            className="shrink-0"
          >
            <ImagePlus className="mr-2 h-4 w-4" /> Enviar mídia
          </Button>
        )}
      </section>

      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Images}
          title="Nenhuma mídia enviada ainda"
          description="A seção do site está mostrando as fotos padrão (prato, peixe e lago). Envie a primeira mídia para começar a personalizar."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => (
            <article
              key={item.id}
              className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm"
            >
              <div className="relative h-44 bg-muted">
                {item.type === 'foto' ? (
                  <img
                    src={mediaUrl(item)}
                    alt={item.caption || 'Foto do pesqueiro'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <video src={mediaUrl(item)} className="h-full w-full object-cover" controls />
                )}
                <Badge className="absolute left-3 top-3 bg-primary/90 text-primary-foreground">
                  {item.type === 'foto' ? 'Foto' : 'Vídeo'}
                </Badge>
                {item.featured && (
                  <Badge className="absolute right-3 top-3 border-amber-300/50 bg-amber-300/20 text-amber-200">
                    <Star className="mr-1 h-3 w-3 fill-current" /> Destaque
                  </Badge>
                )}
              </div>
              <div className="flex flex-1 items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.caption || 'Sem legenda'}</p>
                  <p className="text-xs text-muted-foreground">Ordem #{item.order ?? index + 1}</p>
                </div>
                {canManage && (
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      disabled={index === 0 || movingId === item.id}
                      onClick={() => move(item, -1)}
                      aria-label="Mover para cima"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      disabled={index === items.length - 1 || movingId === item.id}
                      onClick={() => move(item, 1)}
                      aria-label="Mover para baixo"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-amber-500 hover:text-amber-600"
                      onClick={() => toggleFeatured(item, !item.featured)}
                      aria-label="Alternar destaque"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                    {canDelete && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleting(item)}
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Enviar foto ou vídeo</DialogTitle>
            <DialogDescription>
              O arquivo vai para o armazenamento do backend e aparece na galeria do site público.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void submit()
            }}
          >
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) =>
                    setForm({ ...form, type: value as GalleryMedia['type'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="foto">Foto</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gallery-file">Arquivo</Label>
                <label
                  htmlFor="gallery-file"
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground hover:bg-muted/40"
                >
                  <Film className="h-5 w-5 text-primary" />
                  <span>{form.file?.name ?? 'Escolher foto ou vídeo'}</span>
                </label>
                <Input
                  id="gallery-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gallery-caption">Legenda</Label>
                <Input
                  id="gallery-caption"
                  value={form.caption}
                  placeholder="Ex: Lago principal ao amanhecer"
                  onChange={(e) => setForm({ ...form, caption: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/45 p-3">
                <div>
                  <Label>Destaque</Label>
                  <p className="text-xs text-muted-foreground">
                    Itens em destaque aparecem primeiro na galeria.
                  </p>
                </div>
                <Switch
                  checked={form.featured}
                  onCheckedChange={(featured) => setForm({ ...form, featured })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                  </>
                ) : (
                  'Enviar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover esta mídia?</AlertDialogTitle>
            <AlertDialogDescription>
              Ela deixará de aparecer na galeria do site. Esta ação não pode ser desfeita.
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
