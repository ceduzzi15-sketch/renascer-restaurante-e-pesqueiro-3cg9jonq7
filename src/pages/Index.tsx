import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ChevronRight,
  Clock3,
  Facebook,
  Fish,
  Instagram,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Quote,
  Star,
  UtensilsCrossed,
  Waves,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useBusinessSettings } from '@/hooks/use-business-settings'
import { useSiteContent } from '@/hooks/use-site-content'
import { getActivePromotions, getFileUrl, getMenuCategories, getPublicMenu } from '@/services/api'
import { fetchMenuFolders, groupCategoriesByFolder, itemsOfCategory } from '@/services/menu'
import { getGalleryMedia } from '@/services/gallery'
import type { GalleryMedia } from '@/types'
import { LOCAL_PHOTOS } from '@/lib/assets'
import BrandMark from '@/components/BrandMark'
import LogoEmblem from '@/components/LogoEmblem'
import { isHighlightItem, sortHighlightsFirst } from '@/lib/highlights'
import type { MenuCategoryRecord, MenuFolder, MenuItem, Promotion } from '@/types'
import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'

type SiteImageField =
  | 'cover_image'
  | 'about_image_1'
  | 'about_image_2'
  | 'gallery_background'
  | 'promo_image'

export default function Index() {
  const { settings } = useBusinessSettings()
  const { content, record: contentRecord } = useSiteContent()
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<MenuCategoryRecord[]>([])
  const [folders, setFolders] = useState<MenuFolder[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [gallery, setGallery] = useState<GalleryMedia[]>([])
  const [mobileOpen, setMobileOpen] = useState(false)
  const [lightbox, setLightbox] = useState<GalleryMedia | null>(null)
  /** Pastas do cardápio expandidas na landing — fechado por padrão. */
  const [openMenuFolders, setOpenMenuFolders] = useState<Set<string>>(new Set())

  useEffect(() => {
    void Promise.all([
      getPublicMenu(),
      getMenuCategories(),
      getActivePromotions(),
      fetchMenuFolders(),
    ])
      .then(([menuData, catData, promotionData, folderData]) => {
        setMenu(menuData)
        setCategories(catData)
        setPromotions(promotionData)
        setFolders(folderData)
      })
      .catch(() => undefined)
    void getGalleryMedia()
      .then(setGallery)
      .catch(() => undefined)
  }, [])

  const menuSections = useMemo(
    () => groupCategoriesByFolder(categories, folders),
    [categories, folders],
  )

  /** Botões da seção cardápio: cada um abre o grupo correspondente. */
  const menuFolderButtons = [
    {
      key: 'pesca-barco',
      label: 'Pesca e Barco',
      icon: Fish,
      match: (name: string) => /pesca|barco|caiaque/i.test(name),
    },
    {
      key: 'almoco-porcoes',
      label: 'Almoço e Porções',
      icon: UtensilsCrossed,
      match: (name: string) => /almo|por|prato|cozinha/i.test(name),
    },
    {
      key: 'bebidas',
      label: 'Bebidas',
      icon: MessageCircle,
      match: (name: string) => /bebida|drink/i.test(name),
    },
  ]

  const toggleMenuFolder = (key: string) => {
    setOpenMenuFolders((current) => {
      const next = new Set(current)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const phoneDigits = content.contact_phone.replace(/\D/g, '')
  const whatsappDigits = phoneDigits.startsWith('55') ? phoneDigits : `55${phoneDigits}`
  const mapQuery = encodeURIComponent(content.map_query || 'Pesqueiro e Restaurante, São Paulo')
  const siteImage = (field: SiteImageField, fallback: string) =>
    contentRecord && contentRecord[field]
      ? getFileUrl(contentRecord, contentRecord[field] as string)
      : fallback

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-primary/90 text-primary-foreground backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandMark name={settings.business_name} light />
          <nav className="hidden items-center gap-7 lg:flex">
            {['Experiência', 'Cardápio', 'Promoções', 'Localização'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace('ç', 'c').replace('õ', 'o').replace('ã', 'a')}`}
                className="text-sm font-medium text-white/70 transition hover:text-white"
              >
                {item}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-2 sm:flex">
            <Button
              variant="ghost"
              asChild
              className="text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/entrar">Entrar</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/cadastro">
                Cadastre-se <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen((value) => !value)}
            className="text-white hover:bg-white/10 sm:hidden"
          >
            {mobileOpen ? <X /> : <Menu />}
          </Button>
        </div>
        {mobileOpen && (
          <div className="border-t border-white/10 px-4 py-4 sm:hidden">
            <nav className="grid gap-1">
              {['Experiência', 'Cardápio', 'Promoções', 'Localização'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace('ç', 'c').replace('õ', 'o').replace('ã', 'a')}`}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-white/10"
                >
                  {item}
                </a>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  asChild
                  className="border-white/20 bg-transparent text-white"
                >
                  <Link to="/entrar">Entrar</Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link to="/cadastro">Cadastre-se</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* Capa limpa: a foto aparece sem nenhum overlay, fade ou gradiente por cima */}
        <section className="pt-20">
          <img
            src={siteImage('cover_image', LOCAL_PHOTOS.lake)}
            alt="Vista ampla do lago do pesqueiro"
            className="h-[62vh] min-h-[380px] w-full object-cover sm:h-[74vh]"
          />
        </section>

        <section className="bg-primary text-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
            <div className="max-w-3xl">
              <Badge className="mb-6 border border-amber-200/20 bg-amber-300/15 px-4 py-2 text-amber-200 hover:bg-amber-300/15">
                <Waves className="mr-2 h-4 w-4" /> {content.hero_badge}
              </Badge>
              <h1 className="text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
                {content.hero_title}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85 sm:text-xl">
                {content.hero_subtitle}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" variant="secondary" asChild className="h-12 px-6">
                  <a href="#cardapio">
                    {content.hero_cta_primary} <ChevronRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="h-12 border-white/25 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
                >
                  <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" /> {content.hero_cta_secondary}
                  </a>
                </Button>
              </div>
            </div>
          </div>
          <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                [Clock3, content.strip_1_title, content.strip_1_text],
                [MapPin, content.strip_2_title, content.strip_2_text],
                [UtensilsCrossed, content.strip_3_title, content.strip_3_text],
              ].map(([Icon, title, text]) => (
                <div
                  key={String(title)}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-5"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10">
                    <Icon className="h-5 w-5 text-amber-300" />
                  </span>
                  <span>
                    <strong className="block text-sm">{String(title)}</strong>
                    <small className="text-white/70">{String(text)}</small>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="experiencia" className="page-shell py-20 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-20">
            <div>
              <p className="eyebrow mb-4">{content.about_eyebrow}</p>
              <h2 className="font-display text-4xl leading-tight sm:text-5xl">
                {content.about_title}
              </h2>
              <p className="mt-6 text-base leading-7 text-muted-foreground">{content.about_text}</p>
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <div className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary">
                    <Fish className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-sans text-sm font-bold tracking-normal">
                      {content.feature_1_title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{content.feature_1_text}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/12 text-accent">
                    <UtensilsCrossed className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-sans text-sm font-bold tracking-normal">
                      {content.feature_2_title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{content.feature_2_text}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img
                src={siteImage('about_image_1', LOCAL_PHOTOS.fish)}
                alt="Peixe pescado no lago"
                className="h-[430px] w-full rounded-[2rem] object-cover object-center shadow-xl"
              />
              <div className="space-y-4 pt-12">
                <img
                  src={siteImage('about_image_2', LOCAL_PHOTOS.dish)}
                  alt="Porção de peixe crocante"
                  className="h-64 w-full rounded-[2rem] object-cover shadow-xl"
                />
                <div className="rounded-[2rem] bg-primary p-6 text-white">
                  <Quote className="h-7 w-7 text-amber-300" />
                  <p className="mt-4 font-display text-xl">{content.about_quote}</p>
                  <div className="mt-4 flex text-amber-300">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="cardapio" className="py-20 lg:py-28 bg-[#0b241b]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Visual do Cartaz com Verde-escuro, moldura dourada e RENASCER */}
            <div className="poster-container poster-double-border rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden">
              <div className="mx-auto max-w-3xl text-center">
                <LogoEmblem className="mx-auto mb-5 h-28 w-28 drop-shadow-lg" />
                <div className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d4af37]/40 bg-[#0c241b]/80 px-4 py-1.5 text-xs font-semibold tracking-widest text-[#e5c158] uppercase">
                  ✦ Tradição & Sabor ✦
                </div>
                <h2 className="mt-4 font-cinzel text-3xl font-extrabold uppercase tracking-wider text-[#e5c158] sm:text-5xl drop-shadow-md">
                  RENASCER
                </h2>
                <p className="font-condensed text-lg uppercase tracking-[0.25em] text-white/80">
                  {content.menu_tagline}
                </p>
                <div className="mx-auto my-4 h-[2px] w-28 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
                <p className="text-sm sm:text-base text-white/70 max-w-xl mx-auto">
                  {content.menu_description}
                </p>
              </div>

              {/* Botões do cardápio — fechado por padrão, cada botão abre seu grupo */}
              <div className="mt-10 flex flex-wrap items-stretch justify-center gap-4">
                {menuFolderButtons.map((button) => (
                  <button
                    key={button.key}
                    onClick={() => toggleMenuFolder(button.key)}
                    className={cn(
                      'flex min-w-56 flex-1 max-w-xs items-center justify-center gap-2 rounded-2xl border px-6 py-5 text-base font-condensed font-bold uppercase tracking-widest transition',
                      openMenuFolders.has(button.key)
                        ? 'border-[#d4af37] bg-[#d4af37] text-[#0d271e]'
                        : 'border-[#d4af37]/40 bg-[#0d271e]/85 text-[#e5c158] hover:border-[#d4af37] hover:bg-[#12362a]',
                    )}
                  >
                    <button.icon className="h-5 w-5" />
                    {button.label}
                  </button>
                ))}
              </div>

              {/* Cardápio público agrupado pelas pastas/setores (sem valores).
                  Só aparece o grupo cujo botão está aberto. */}
              {menuSections
                .filter((section) => {
                  const folderName = (section.folder?.name ?? 'Cardápio').toLowerCase()
                  return menuFolderButtons.some(
                    (button) => openMenuFolders.has(button.key) && button.match(folderName),
                  )
                })
                .map((section) => (
                  <div key={section.folder?.id ?? 'geral'} className="mt-10">
                    <div className="mb-5 flex flex-col items-center gap-2 text-center">
                      <h3 className="font-cinzel text-2xl font-bold uppercase tracking-wide text-[#e5c158] sm:text-3xl">
                        {section.folder?.name ?? 'Cardápio'}
                      </h3>
                      <div className="h-[2px] w-16 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
                    </div>
                    {section.categories.map((category) => {
                      const catItems = sortHighlightsFirst(itemsOfCategory(menu, category.id))
                      if (catItems.length === 0) return null
                      return (
                        <div key={category.id} className="mt-8">
                          <h4 className="mb-4 flex items-center justify-center gap-3 font-condensed text-base font-bold uppercase tracking-[0.2em] text-white">
                            {category.art_image ? (
                              <img
                                src={getFileUrl(category, category.art_image, '100x100')}
                                alt=""
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : null}
                            {category.name}
                          </h4>
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {catItems.map((item) => {
                              const highlight = isHighlightItem(item)
                              return (
                                <article
                                  key={item.id}
                                  className={cn(
                                    'group relative flex flex-col justify-between rounded-xl border border-[#d4af37]/30 bg-[#0d271e]/85 p-4 transition duration-300 hover:border-[#d4af37] hover:bg-[#12362a]',
                                    highlight && 'border-[#d4af37] bg-[#12362a]/90',
                                  )}
                                >
                                  {highlight && (
                                    <Badge className="absolute -top-2.5 right-3 z-10 border border-[#d4af37] bg-[#d4af37] font-condensed text-[10px] font-bold uppercase tracking-widest text-[#0d271e]">
                                      <Sparkles className="mr-1 h-3 w-3" /> Destaque
                                    </Badge>
                                  )}
                                  <div>
                                    {item.subcategoria && (
                                      <p className="mb-2 text-[11px] text-white/50 italic">
                                        {item.subcategoria}
                                      </p>
                                    )}
                                    <h3 className="font-condensed text-xl font-bold uppercase tracking-wide text-white transition group-hover:text-[#e5c158]">
                                      {item.name}
                                    </h3>
                                    {(item.observacao || item.description) && (
                                      <p className="mt-1.5 text-xs leading-relaxed text-white/70">
                                        {item.observacao || item.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="mt-3 pt-2 text-right">
                                    <span className="text-[11px] font-condensed uppercase tracking-wider text-white/40">
                                      Disponível no pesqueiro
                                    </span>
                                  </div>
                                </article>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}

              <div className="mt-12 text-center border-t border-[#d4af37]/30 pt-8">
                <p className="font-condensed text-sm uppercase tracking-[0.2em] text-white/60">
                  {content.menu_cta}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="galeria" className="page-shell py-20 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col gap-3 text-center">
              <p className="eyebrow mx-auto">{content.gallery_eyebrow}</p>
              <h2 className="font-display text-4xl leading-tight sm:text-5xl">
                {content.gallery_title}
              </h2>
              <p className="mx-auto max-w-2xl text-base text-muted-foreground">
                {content.gallery_text}
              </p>
            </div>

            {gallery.length === 0 ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <figure className="group relative h-72 overflow-hidden rounded-[2rem] shadow-lg sm:h-80">
                  <img
                    src={LOCAL_PHOTOS.dish}
                    alt="Porção de peixe crocante servida no restaurante"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-sm font-medium text-white">
                    Sabor que sai da cozinha para a mesa
                  </figcaption>
                </figure>
                <figure className="group relative h-72 overflow-hidden rounded-[2rem] shadow-lg sm:h-80">
                  <img
                    src={LOCAL_PHOTOS.fish}
                    alt="Peixe pescado no lago do pesqueiro"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-sm font-medium text-white">
                    Pesca garantida no nosso lago
                  </figcaption>
                </figure>
                <figure className="group relative h-72 overflow-hidden rounded-[2rem] shadow-lg sm:h-80">
                  <img
                    src={LOCAL_PHOTOS.lake}
                    alt="Vista ampla do lago do pesqueiro"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-sm font-medium text-white">
                    Natureza e tranquilidade à beira do lago
                  </figcaption>
                </figure>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {gallery.map((item) => {
                  const url = getFileUrl(item, item.file)
                  return (
                    <figure
                      key={item.id}
                      className="group relative h-72 cursor-pointer overflow-hidden rounded-[2rem] bg-muted shadow-lg sm:h-80"
                      onClick={() => item.type === 'foto' && setLightbox(item)}
                    >
                      {item.type === 'foto' ? (
                        <img
                          src={url}
                          alt={item.caption || 'Foto do pesqueiro'}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <video
                          src={url}
                          className="h-full w-full object-cover"
                          controls
                          playsInline
                          preload="metadata"
                        />
                      )}
                      {item.caption && item.type === 'foto' && (
                        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-sm font-medium text-white">
                          {item.caption}
                        </figcaption>
                      )}
                    </figure>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <section id="promocoes" className="page-shell py-20 lg:py-24">
          <div className="overflow-hidden rounded-[2rem] bg-primary text-white shadow-2xl">
            <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
              <img
                src={siteImage('promo_image', LOCAL_PHOTOS.dish)}
                alt="Porção especial do dia"
                className="h-full min-h-[300px] w-full object-cover"
              />
              <div className="p-8 sm:p-12 lg:p-16">
                <p className="text-xs font-bold uppercase tracking-[0.23em] text-amber-300">
                  {content.promo_eyebrow}
                </p>
                <h2 className="mt-4 text-3xl sm:text-4xl">
                  {promotions[0]?.title ?? content.promo_fallback_title}
                </h2>
                <p className="mt-5 max-w-xl text-base leading-7 text-white/68">
                  {promotions[0]?.text ?? content.promo_fallback_text}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button variant="secondary" asChild>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`${promotions[0]?.title ?? 'Promoção'} — ${promotions[0]?.text ?? ''}`)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    asChild
                    className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">
                      <Instagram className="mr-2 h-4 w-4" /> Instagram
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    asChild
                    className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Facebook className="mr-2 h-4 w-4" /> Facebook
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="localizacao" className="bg-secondary/45 py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
            <div>
              <p className="eyebrow mb-4">{content.location_eyebrow}</p>
              <h2 className="font-display text-4xl">{content.location_title}</h2>
              <div className="mt-7 space-y-4 text-sm text-muted-foreground">
                <a
                  href={`tel:${phoneDigits}`}
                  className="flex items-center gap-3 hover:text-primary"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-primary shadow-sm">
                    <Phone className="h-4 w-4" />
                  </span>
                  <span>
                    <small className="block">Contato e reservas</small>
                    <strong className="text-base text-foreground">{content.contact_phone}</strong>
                  </span>
                </a>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-primary shadow-sm">
                    <Clock3 className="h-4 w-4" />
                  </span>
                  <span>
                    <small className="block">Funcionamento</small>
                    <strong className="text-base text-foreground">{content.opening_hours}</strong>
                  </span>
                </div>
              </div>
              <Button className="mt-8" asChild>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MapPin className="mr-2 h-4 w-4" /> Traçar rota no Google Maps
                </a>
              </Button>
            </div>
            <div className="overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-xl">
              <iframe
                title="Mapa e rota do pesqueiro"
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                className="h-[420px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
          <BrandMark name={settings.business_name} light />
          <p className="text-xs text-white/45">
            © {new Date().getFullYear()} {settings.business_name}. Todos os direitos reservados.
          </p>
          <div className="flex gap-2">
            <a
              href={`https://wa.me/${whatsappDigits}`}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
              aria-label="WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noreferrer"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noreferrer"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
              aria-label="Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
