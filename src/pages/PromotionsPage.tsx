import { useEffect, useState, type FormEvent } from 'react'
import {
  CalendarDays,
  Facebook,
  Instagram,
  Megaphone,
  MessageCircle,
  Plus,
  Share2,
} from 'lucide-react'
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
import { useToast } from '@/hooks/use-toast'
import { createRecord, formatDate, getFileUrl, listRecords } from '@/services/api'
import { LOCAL_PHOTOS } from '@/lib/assets'
import EmptyState from '@/components/EmptyState'
import LoadingState from '@/components/LoadingState'
import type { Promotion } from '@/types'

const localDate = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10)

export default function PromotionsPage() {
  const { toast } = useToast()
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    text: '',
    promotion_date: localDate(),
    destination: 'todos' as Promotion['destination'],
    active: true,
    image: null as File | null,
  })
  const refresh = async () => {
    setPromotions(await listRecords<Promotion>('promotions', { sort: '-promotion_date' }))
    setLoading(false)
  }
  useEffect(() => {
    void refresh()
  }, [])

  const save = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const data = new FormData()
      data.set('title', form.title)
      data.set('text', form.text)
      data.set('promotion_date', new Date(`${form.promotion_date}T12:00:00`).toISOString())
      data.set('destination', form.destination)
      data.set('active', String(form.active))
      if (form.image) data.set('image', form.image)
      await createRecord<Promotion>('promotions', data)
      toast({
        title: 'Promoção publicada',
        description: 'Use os botões para compartilhar nas redes.',
      })
      setOpen(false)
      await refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível publicar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    }
  }

  const shareText = (promotion: Promotion) =>
    encodeURIComponent(`${promotion.title}\n\n${promotion.text}`)

  return (
    <div className="page-shell space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow mb-2">Divulgação</p>
          <h1 className="page-heading">Promoções</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie ofertas do dia e compartilhe manualmente nas redes sociais.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova promoção
        </Button>
      </header>
      {loading ? (
        <LoadingState />
      ) : promotions.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Nenhuma promoção criada"
          description="Publique sua primeira oferta do dia."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {promotions.map((promotion) => (
            <article
              key={promotion.id}
              className="overflow-hidden rounded-2xl border bg-card shadow-[0_15px_42px_-28px_rgba(24,67,51,0.4)] sm:grid sm:grid-cols-[190px_1fr]"
            >
              <img
                src={
                  promotion.image
                    ? getFileUrl(promotion, promotion.image, '800x500')
                    : LOCAL_PHOTOS.dish
                }
                alt={promotion.title}
                className="h-48 w-full object-cover sm:h-full"
              />
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant={promotion.active ? 'default' : 'secondary'}>
                    {promotion.active ? 'Ativa' : 'Inativa'}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" /> {formatDate(promotion.promotion_date)}
                  </span>
                </div>
                <h2 className="mt-4 text-xl">{promotion.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{promotion.text}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={`https://wa.me/?text=${shareText(promotion)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                    </a>
                  </Button>
                  <Button size="icon" variant="outline" asChild>
                    <a
                      href="https://www.instagram.com/"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Compartilhar no Instagram"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button size="icon" variant="outline" asChild>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Compartilhar no Facebook"
                    >
                      <Facebook className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={save}>
            <DialogHeader>
              <DialogTitle>Nova promoção</DialogTitle>
              <DialogDescription>
                Crie o texto que será exibido e compartilhado nas redes.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-5">
              <div className="space-y-2">
                <Label htmlFor="promo-title">Título</Label>
                <Input
                  id="promo-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-text">Texto da promoção</Label>
                <Textarea
                  id="promo-text"
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                  rows={5}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="promo-date">Data</Label>
                  <Input
                    id="promo-date"
                    type="date"
                    value={form.promotion_date}
                    onChange={(e) => setForm({ ...form, promotion_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Destino</Label>
                  <Select
                    value={form.destination}
                    onValueChange={(destination: Promotion['destination']) =>
                      setForm({ ...form, destination })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-image">Imagem</Label>
                <Input
                  id="promo-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setForm({ ...form, image: e.target.files?.[0] ?? null })}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                <div>
                  <Label>Publicar agora</Label>
                  <p className="text-xs text-muted-foreground">Aparece na landing page.</p>
                </div>
                <Switch
                  checked={form.active}
                  onCheckedChange={(active) => setForm({ ...form, active })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <Share2 className="mr-2 h-4 w-4" /> Publicar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
