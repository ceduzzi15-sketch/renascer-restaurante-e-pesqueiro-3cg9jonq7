import { useEffect, useRef, useState } from 'react'
import { ImagePlus, LoaderCircle, Save, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import {
  createSiteContent,
  DEFAULT_SITE_CONTENT,
  getSiteContent,
  getSiteContentFileUrl,
  updateSiteContent,
} from '@/services/siteContent'
import LoadingState from '@/components/LoadingState'
import type { SiteContent } from '@/types'

type TextFieldKey = {
  [K in keyof Omit<
    SiteContent,
    | keyof import('@/types').BaseRecord
    | 'cover_image'
    | 'about_image_1'
    | 'about_image_2'
    | 'gallery_background'
    | 'promo_image'
  >]: SiteContent[K] extends string ? K : never
}[keyof Omit<
  SiteContent,
  | keyof import('@/types').BaseRecord
  | 'cover_image'
  | 'about_image_1'
  | 'about_image_2'
  | 'gallery_background'
  | 'promo_image'
>]

interface ImageField {
  key: 'cover_image' | 'about_image_1' | 'about_image_2' | 'gallery_background' | 'promo_image'
  label: string
  hint: string
}

const imageFields: ImageField[] = [
  {
    key: 'cover_image',
    label: 'Imagem de capa (hero)',
    hint: 'Foto grande do topo da página, atrás do título principal.',
  },
  {
    key: 'about_image_1',
    label: 'Foto da seção Experiência (peixe)',
    hint: 'Foto alta à esquerda da seção “Uma experiência completa”.',
  },
  {
    key: 'about_image_2',
    label: 'Foto da seção Experiência (prato)',
    hint: 'Foto menor sobre a citação, à direita da seção.',
  },
  {
    key: 'gallery_background',
    label: 'Fundo da seção Galeria',
    hint: 'Reservado para um futuro uso de fundo; a galeria em si é gerida em “Galeria do site”.',
  },
  {
    key: 'promo_image',
    label: 'Imagem da seção Promoções',
    hint: 'Foto à esquerda do bloco de promoção do dia.',
  },
]

interface TextGroup {
  title: string
  fields: { key: TextFieldKey; label: string; multiline?: boolean; placeholder?: string }[]
}

const textGroups: TextGroup[] = [
  {
    title: 'Capa (topo do site)',
    fields: [
      { key: 'hero_badge', label: 'Selo acima do título' },
      { key: 'hero_title', label: 'Título principal', multiline: true },
      { key: 'hero_subtitle', label: 'Subtítulo', multiline: true },
      { key: 'hero_cta_primary', label: 'Botão 1' },
      { key: 'hero_cta_secondary', label: 'Botão 2' },
    ],
  },
  {
    title: 'Faixa de destaques (sob a capa)',
    fields: [
      { key: 'strip_1_title', label: '1º item — título' },
      { key: 'strip_1_text', label: '1º item — texto' },
      { key: 'strip_2_title', label: '2º item — título' },
      { key: 'strip_2_text', label: '2º item — texto' },
      { key: 'strip_3_title', label: '3º item — título' },
      { key: 'strip_3_text', label: '3º item — texto' },
    ],
  },
  {
    title: 'Seção Experiência',
    fields: [
      { key: 'about_eyebrow', label: 'Rótulo pequeno' },
      { key: 'about_title', label: 'Título da seção', multiline: true },
      { key: 'about_text', label: 'Texto da seção', multiline: true },
      { key: 'feature_1_title', label: 'Recurso 1 — título' },
      { key: 'feature_1_text', label: 'Recurso 1 — texto' },
      { key: 'feature_2_title', label: 'Recurso 2 — título' },
      { key: 'feature_2_text', label: 'Recurso 2 — texto' },
      { key: 'about_quote', label: 'Citação no cartão verde', multiline: true },
    ],
  },
  {
    title: 'Seção Cardápio (cartaz)',
    fields: [
      { key: 'menu_tagline', label: 'Linha “Restaurante e Pesqueiro”' },
      { key: 'menu_description', label: 'Texto do cartaz', multiline: true },
      { key: 'menu_cta', label: 'Botão final do cartaz' },
    ],
  },
  {
    title: 'Seção Galeria',
    fields: [
      { key: 'gallery_eyebrow', label: 'Rótulo pequeno' },
      { key: 'gallery_title', label: 'Título da seção' },
      { key: 'gallery_text', label: 'Texto da seção', multiline: true },
    ],
  },
  {
    title: 'Seção Promoções',
    fields: [
      { key: 'promo_eyebrow', label: 'Rótulo pequeno' },
      { key: 'promo_fallback_title', label: 'Título quando não há promoção ativa' },
      { key: 'promo_fallback_text', label: 'Texto quando não há promoção ativa', multiline: true },
    ],
  },
  {
    title: 'Localização e contato',
    fields: [
      { key: 'location_eyebrow', label: 'Rótulo pequeno' },
      { key: 'location_title', label: 'Título da seção', multiline: true },
      { key: 'contact_phone', label: 'Telefone de contato' },
      { key: 'opening_hours', label: 'Horário de funcionamento' },
      { key: 'map_query', label: 'Busca do mapa (Google Maps)' },
    ],
  },
]

const imageKeys = imageFields.map((field) => field.key)

export default function SiteContentPage() {
  const { isRole } = useAuth()
  const { toast } = useToast()
  const [record, setRecord] = useState<SiteContent | null>(null)
  const [values, setValues] = useState<Record<string, string>>({ ...DEFAULT_SITE_CONTENT })
  const [newFiles, setNewFiles] = useState<Partial<Record<(typeof imageKeys)[number], File>>>({})
  const [removeImages, setRemoveImages] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const inputRefs = useRef<Partial<Record<string, HTMLInputElement | null>>>({})

  const canEdit = isRole('gestor', 'atendimento')

  useEffect(() => {
    let cancelled = false
    getSiteContent()
      .then((data) => {
        if (cancelled) return
        setRecord(data)
        if (data) {
          const merged: Record<string, string> = { ...DEFAULT_SITE_CONTENT }
          for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'string' && value.trim() !== '') merged[key] = value
          }
          setValues(merged)
        }
      })
      .catch(() => {
        toast({ variant: 'destructive', title: 'Não foi possível carregar o conteúdo do site' })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setValue = (key: string, value: string) =>
    setValues((current) => ({ ...current, [key]: value }))

  const setFile = (key: string, file: File | null) => {
    setNewFiles((current) => {
      const next = { ...current }
      if (file) next[key as (typeof imageKeys)[number]] = file
      else delete next[key as (typeof imageKeys)[number]]
      return next
    })
    if (file) {
      setRemoveImages((current) => {
        const next = new Set(current)
        next.delete(key)
        return next
      })
    }
  }

  const toggleRemove = (key: string) => {
    setNewFiles((current) => {
      const next = { ...current }
      delete next[key as (typeof imageKeys)[number]]
      return next
    })
    setRemoveImages((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const currentPreview = (key: string): string | null => {
    const file = newFiles[key as (typeof imageKeys)[number]]
    if (file) return URL.createObjectURL(file)
    if (removeImages.has(key)) return null
    const filename = record?.[key as keyof SiteContent] as string | undefined
    return filename ? getSiteContentFileUrl(record as SiteContent, filename, '600x0') : null
  }

  const hasImage = (key: string) => {
    if (newFiles[key as (typeof imageKeys)[number]]) return true
    if (removeImages.has(key)) return false
    return Boolean(record?.[key as keyof SiteContent])
  }

  const submit = async () => {
    setSaving(true)
    try {
      const data = new FormData()
      for (const [key, value] of Object.entries(values)) {
        data.set(key, value)
      }
      for (const key of imageKeys) {
        const file = newFiles[key as (typeof imageKeys)[number]]
        if (file) {
          data.set(key, file)
        } else if (removeImages.has(key)) {
          data.set(key, '')
        }
      }
      if (record) {
        await updateSiteContent(record.id, data)
      } else {
        setRecord(await createSiteContent(data))
      }
      setNewFiles({})
      setRemoveImages(new Set())
      window.dispatchEvent(new Event('site-content-updated'))
      toast({ title: 'Conteúdo salvo', description: 'A landing page já reflete as mudanças.' })
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

  if (loading) return <LoadingState />

  return (
    <div className="page-shell space-y-6">
      <section className="flex flex-col justify-between gap-4 rounded-2xl border bg-card p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl">Conteúdo do site</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Edite os textos e as imagens da página pública (capa, fundos, frases das seções,
            horário, endereço e telefone). Ao salvar, o site atualiza na hora — sem tocar em código.
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => void submit()} disabled={saving} className="shrink-0">
            {saving ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Salvar conteúdo
              </>
            )}
          </Button>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {textGroups.map((group) => (
          <section key={group.title} className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </h2>
            <div className="grid gap-4">
              {group.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={`sc-${field.key}`}>{field.label}</Label>
                  {field.multiline ? (
                    <Textarea
                      id={`sc-${field.key}`}
                      rows={2}
                      value={values[field.key] ?? ''}
                      disabled={!canEdit}
                      onChange={(e) => setValue(field.key, e.target.value)}
                    />
                  ) : (
                    <Input
                      id={`sc-${field.key}`}
                      value={values[field.key] ?? ''}
                      disabled={!canEdit}
                      onChange={(e) => setValue(field.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="rounded-2xl border bg-card p-6 shadow-sm xl:col-span-2">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Imagens (capa e fundos das seções)
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            JPG, PNG ou WebP até 10 MB. Remover a imagem volta a mostrar a foto padrão do site.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {imageFields.map((field) => (
              <article
                key={field.key}
                className="overflow-hidden rounded-2xl border bg-card shadow-sm"
              >
                <div className="relative h-40 bg-muted">
                  {currentPreview(field.key) ? (
                    <img
                      src={currentPreview(field.key) as string}
                      alt={field.label}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-muted-foreground">
                      Sem imagem — usando o padrão
                    </div>
                  )}
                  {hasImage(field.key) && canEdit && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute right-2 top-2 h-8 w-8 bg-black/40 text-white hover:bg-black/60 hover:text-white"
                      onClick={() => toggleRemove(field.key)}
                      aria-label="Remover imagem"
                    >
                      {removeImages.has(field.key) ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <p className="text-sm font-medium">{field.label}</p>
                  <p className="text-xs text-muted-foreground">{field.hint}</p>
                  {canEdit && (
                    <>
                      <label
                        htmlFor={`sc-file-${field.key}`}
                        className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed p-3 text-xs text-muted-foreground hover:bg-muted/40"
                      >
                        <ImagePlus className="h-4 w-4 text-primary" />
                        <span className="truncate">
                          {newFiles[field.key as (typeof imageKeys)[number]]?.name ??
                            'Trocar imagem'}
                        </span>
                      </label>
                      <Input
                        id={`sc-file-${field.key}`}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        ref={(el) => {
                          inputRefs.current[field.key] = el
                        }}
                        onChange={(e) => setFile(field.key, e.target.files?.[0] ?? null)}
                      />
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
