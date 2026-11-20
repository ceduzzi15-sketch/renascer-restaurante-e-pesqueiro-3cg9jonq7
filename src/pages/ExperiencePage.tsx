import { useEffect, useState, type FormEvent } from 'react'
import { Camera, CheckCircle2, ImagePlus, Images, Send, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { createRecord, formatDate, getFileUrl, listRecords } from '@/services/api'
import { LOCAL_PHOTOS } from '@/lib/assets'
import type { Review } from '@/types'

export default function ExperiencePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [reviews, setReviews] = useState<Review[]>([])
  const [rating, setRating] = useState(5)
  const [suggestion, setSuggestion] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [sending, setSending] = useState(false)

  const refresh = async () => setReviews(await listRecords<Review>('reviews', { sort: '-created' }))
  useEffect(() => {
    void refresh()
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return
    setSending(true)
    try {
      const data = new FormData()
      data.set('user', user.id)
      data.set('customer_name', user.name)
      data.set('rating', String(rating))
      data.set('suggestion', suggestion)
      data.set('approved', 'false')
      photos.forEach((photo) => data.append('photos', photo))
      await createRecord<Review>('reviews', data)
      setSuggestion('')
      setPhotos([])
      setRating(5)
      await refresh()
      toast({
        title: 'Obrigado por compartilhar!',
        description: 'Sua avaliação e suas fotos foram enviadas.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível enviar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="page-shell space-y-7">
      <header>
        <p className="eyebrow mb-2">Seu recanto</p>
        <h1 className="page-heading">Fotos & avaliação</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Compartilhe seus melhores momentos e ajude a melhorar sua próxima visita.
        </p>
      </header>
      <section className="grid gap-5 md:grid-cols-3">
        <img
          src={LOCAL_PHOTOS.dish}
          alt="Porção servida no restaurante"
          className="h-64 w-full rounded-2xl object-cover shadow-lg"
        />
        <img
          src={LOCAL_PHOTOS.fish}
          alt="Peixe pescado no lago"
          className="h-64 w-full rounded-2xl object-cover shadow-lg"
        />
        <img
          src={LOCAL_PHOTOS.lake}
          alt="Vista do lago"
          className="h-64 w-full rounded-2xl object-cover shadow-lg"
        />
      </section>
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="soft-card p-6">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <Star className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl">Como foi sua experiência?</h2>
              <p className="text-sm text-muted-foreground">Sua opinião é muito importante.</p>
            </div>
          </div>
          <form onSubmit={submit} className="space-y-5">
            <div>
              <Label>Sua nota</Label>
              <div className="mt-2 flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className={value <= rating ? 'text-amber-500' : 'text-muted'}
                    aria-label={`${value} estrelas`}
                  >
                    <Star className={`h-8 w-8 ${value <= rating ? 'fill-current' : ''}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="suggestion">Avaliação ou sugestão</Label>
              <Textarea
                id="suggestion"
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                rows={5}
                placeholder="Conte o que mais gostou e o que podemos melhorar..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="photos">Fotos do local</Label>
              <label
                htmlFor="photos"
                className="flex cursor-pointer flex-col items-center rounded-2xl border border-dashed p-7 text-center hover:bg-muted/30"
              >
                <ImagePlus className="mb-2 h-7 w-7 text-primary" />
                <span className="text-sm font-semibold">Escolha até 6 fotos</span>
                <span className="mt-1 text-xs text-muted-foreground">JPG, PNG ou WEBP</span>
              </label>
              <input
                id="photos"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => setPhotos(Array.from(e.target.files ?? []).slice(0, 6))}
              />
              {photos.length > 0 && (
                <p className="text-xs text-primary">{photos.length} foto(s) selecionada(s)</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={sending}>
              {sending ? (
                'Enviando...'
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Enviar avaliação
                </>
              )}
            </Button>
          </form>
        </article>
        <article className="soft-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl">Suas contribuições</h2>
              <p className="text-sm text-muted-foreground">Avaliações e fotos enviadas.</p>
            </div>
            <Images className="h-5 w-5 text-muted-foreground" />
          </div>
          {reviews.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl bg-muted/35 px-6 text-center">
              <Camera className="h-9 w-9 text-muted-foreground" />
              <h3 className="mt-3 text-lg">Registre seu momento</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Sua primeira avaliação aparecerá aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-2xl border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex text-amber-500">
                      {Array.from({ length: review.rating }).map((_, index) => (
                        <Star key={index} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <Badge variant={review.approved ? 'default' : 'secondary'}>
                      {review.approved ? (
                        <>
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Publicada
                        </>
                      ) : (
                        'Em análise'
                      )}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {review.suggestion}
                  </p>
                  {review.photos?.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {review.photos.map((photo) => (
                        <img
                          key={photo}
                          src={getFileUrl(review, photo, '600x600')}
                          alt="Foto enviada na avaliação"
                          className="aspect-square rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">{formatDate(review.created)}</p>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  )
}
