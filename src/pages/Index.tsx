import { useEffect, useState } from 'react'
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
import { getActivePromotions, getFileUrl, getMenuCategories, getPublicMenu } from '@/services/api'
import { getGalleryMedia } from '@/services/gallery'
import type { GalleryMedia } from '@/types'
import { LOCAL_PHOTOS } from '@/lib/assets'
import BrandMark from '@/components/BrandMark'
import LogoEmblem from '@/components/LogoEmblem'
import { isHighlightItem, sortHighlightsFirst } from '@/lib/highlights'
import type { MenuCategoryRecord, MenuItem, Promotion } from '@/types'
import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'

const fallbackCategoryLabels: Record<string, string> = {
  comida: 'Pratos',
  porcao: 'Porções',
  bebida: 'Bebidas',
}

export default function Index() {
  const { settings } = useBusinessSettings()
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<MenuCategoryRecord[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [gallery, setGallery] = useState<GalleryMedia[]>([])
  const [mobileOpen, setMobileOpen] = useState(false)
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('all')
  const [lightbox, setLightbox] = useState<GalleryMedia | null>(null)

  useEffect(() => {
    void Promise.all([getPublicMenu(), getMenuCategories(), getActivePromotions()])
      .then(([menuData, catData, promotionData]) => {
        setMenu(menuData)
        setCategories(catData)
        setPromotions(promotionData)
      })
      .catch(() => undefined)
    void getGalleryMedia()
      .then(setGallery)
      .catch(() => undefined)
  }, [])

  const phoneDigits = settings.contact_phone.replace(/\D/g, '')
  const whatsappDigits = phoneDigits.startsWith('55') ? phoneDigits : `55${phoneDigits}`
  const mapQuery = encodeURIComponent(settings.map_query || 'Pesqueiro e Restaurante, São Paulo')

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
        <section className="relative min-h-[760px] overflow-hidden bg-primary pt-20 sm:min-h-[820px]">
          <img
            src={LOCAL_PHOTOS.lake}
            alt="Vista ampla do lago do pesqueiro"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="lake-overlay absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent" />
          <div className="relative mx-auto flex min-h-[680px] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
            <div className="max-w-3xl animate-rise text-white">
              <Badge className="mb-6 border border-amber-200/20 bg-amber-300/15 px-4 py-2 text-amber-200 hover:bg-amber-300/15">
                <Waves className="mr-2 h-4 w-4" /> Seu refúgio à beira do lago
              </Badge>
              <h1 className="text-5xl leading-[1.02] sm:text-6xl lg:text-7xl xl:text-[5.25rem]">
                Onde a boa pesca encontra a boa mesa.
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/72 sm:text-xl">
                {settings.tagline}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" variant="secondary" asChild className="h-12 px-6">
                  <a href="#cardapio">
                    Conheça nosso cardápio <ChevronRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="h-12 border-white/25 bg-white/5 px-6 text-white hover:bg-white/12 hover:text-white"
                >
                  <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" /> Fale conosco
                  </a>
                </Button>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0">
            <div className="mx-auto grid max-w-7xl gap-px border-t border-white/10 bg-white/10 sm:grid-cols-3">
              {[
                [Clock3, 'Aberto hoje', '07h às 20h'],
                [MapPin, 'Natureza por perto', 'Lago, pesca e descanso'],
                [UtensilsCrossed, 'Cozinha da casa', 'Sabor fresco todos os dias'],
              ].map(([Icon, title, text]) => (
                <div
                  key={String(title)}
                  className="flex items-center gap-4 bg-primary/68 px-5 py-5 text-white backdrop-blur-lg sm:px-7"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10">
                    <Icon className="h-5 w-5 text-amber-300" />
                  </span>
                  <span>
                    <strong className="block text-sm">{String(title)}</strong>
                    <small className="text-white/55">{String(text)}</small>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="experiencia" className="page-shell py-20 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-20">
            <div>
              <p className="eyebrow mb-4">Uma experiência completa</p>
              <h2 className="font-display text-4xl leading-tight sm:text-5xl">
                Pesca, sabores e histórias para guardar.
              </h2>
              <p className="mt-6 text-base leading-7 text-muted-foreground">
                Venha passar o dia cercado pela natureza. Prepare a vara, aproveite o lago e encerre
                o passeio com pratos preparados com cuidado pela nossa cozinha.
              </p>
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <div className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary">
                    <Fish className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-sans text-sm font-bold tracking-normal">
                      Pesca para todos
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Diárias e estrutura para aproveitar o lago.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/12 text-accent">
                    <UtensilsCrossed className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-sans text-sm font-bold tracking-normal">
                      Comida de verdade
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Porções generosas e pratos feitos na hora.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img
                src={LOCAL_PHOTOS.fish}
                alt="Peixe pescado no lago"
                className="h-[430px] w-full rounded-[2rem] object-cover object-center shadow-xl"
              />
              <div className="space-y-4 pt-12">
                <img
                  src={LOCAL_PHOTOS.dish}
                  alt="Porção de peixe crocante"
                  className="h-64 w-full rounded-[2rem] object-cover shadow-xl"
                />
                <div className="rounded-[2rem] bg-primary p-6 text-white">
                  <Quote className="h-7 w-7 text-amber-300" />
                  <p className="mt-4 font-display text-xl">
                    Um dia leve, do jeito que a natureza pede.
                  </p>
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
                <a
                  href="#galeria"
                  className="mt-2 text-sm font-semibold uppercase tracking-widest text-white/70 hover:text-[#e5c158]"
                >
                  → Ver fotos e vídeos do local
                </a>
                <p className="font-condensed text-lg uppercase tracking-[0.25em] text-white/80">
                  Restaurante e Pesqueiro
                </p>
                <div className="mx-auto my-4 h-[2px] w-28 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
                <p className="text-sm sm:text-base text-white/70 max-w-xl mx-auto">
                  Conheça os pratos e porções servidos com o carinho de nossa cozinha. Os valores
                  são informados no atendimento e no acesso restrito do cliente.
                </p>

                {/* Filtros rápidos por categoria caso existam */}
                {categories.length > 0 && (
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCatFilter('all')}
                      className={cn(
                        'rounded-full px-4 py-1.5 text-xs font-condensed uppercase tracking-wider transition border',
                        selectedCatFilter === 'all'
                          ? 'border-[#d4af37] bg-[#d4af37] text-[#0d271e] font-bold'
                          : 'border-white/20 bg-black/20 text-white/80 hover:border-[#d4af37]/60',
                      )}
                    >
                      Todos
                    </button>
                    {categories.map((c) => {
                      const artUrl = c.art_image ? getFileUrl(c, c.art_image, '100x100') : ''
                      return (
                        <button
                          key={c.category_id}
                          type="button"
                          onClick={() => setSelectedCatFilter(c.category_id)}
                          className={cn(
                            'flex items-center gap-2 rounded-full py-1 pl-1 pr-4 text-xs font-condensed uppercase tracking-wider transition border',
                            selectedCatFilter === c.category_id
                              ? 'border-[#d4af37] bg-[#d4af37] text-[#0d271e] font-bold'
                              : 'border-white/20 bg-black/20 text-white/80 hover:border-[#d4af37]/60',
                          )}
                        >
                          {artUrl ? (
                            <img
                              src={artUrl}
                              alt=""
                              className={cn(
                                'h-6 w-6 rounded-full object-cover',
                                selectedCatFilter === c.category_id ? 'grayscale-0' : 'grayscale',
                              )}
                            />
                          ) : null}
                          {c.name}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Itens do cardápio público (sem preços) — destaques primeiro */}
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sortHighlightsFirst(
                  menu.filter((item) =>
                    selectedCatFilter === 'all' ? true : item.categoria_id === selectedCatFilter,
                  ),
                ).map((item, index) => {
                  const fallback =
                    item.category === 'bebida'
                      ? LOCAL_PHOTOS.lake
                      : index % 2
                        ? LOCAL_PHOTOS.fish
                        : LOCAL_PHOTOS.dish
                  const displayCategory =
                    item.category_name || fallbackCategoryLabels[item.category] || 'Restaurante'
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
                        <div className="flex items-center justify-between gap-2 border-b border-[#d4af37]/20 pb-2 mb-2">
                          <span className="font-condensed text-xs uppercase tracking-widest text-[#e5c158]">
                            {displayCategory}
                          </span>
                          {item.subcategoria && (
                            <span className="text-[11px] text-white/50 italic">
                              {item.subcategoria}
                            </span>
                          )}
                        </div>
                        <h3 className="font-condensed text-xl font-bold uppercase tracking-wide text-white group-hover:text-[#e5c158] transition">
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

              <div className="mt-12 text-center border-t border-[#d4af37]/30 pt-8">
                <Button
                  asChild
                  className="bg-[#d4af37] text-[#0d271e] font-condensed text-base font-bold uppercase tracking-wider hover:bg-[#e5c158] px-8 h-12 shadow-lg"
                >
                  <Link to="/cadastro">
                    Acessar cardápio completo e pedir <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* Faixa decorativa xadrez inspirada no rodapé do cartaz */}
              <div className="mt-8 h-3 w-full poster-ribbon rounded-sm opacity-85" />
            </div>
          </div>
        </section>

        <section id="galeria" className="page-shell py-20 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col gap-3 text-center">
              <p className="eyebrow mx-auto">Galeria</p>
              <h2 className="font-display text-4xl leading-tight sm:text-5xl">
                Fotos e vídeos do local
              </h2>
              <p className="mx-auto max-w-2xl text-base text-muted-foreground">
                Um pouco do que espera por você: o lago, a pesca e os pratos da nossa cozinha.
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
                src={LOCAL_PHOTOS.dish}
                alt="Porção especial do dia"
                className="h-full min-h-[300px] w-full object-cover"
              />
              <div className="p-8 sm:p-12 lg:p-16">
                <p className="text-xs font-bold uppercase tracking-[0.23em] text-amber-300">
                  Promoção do dia
                </p>
                <h2 className="mt-4 text-3xl sm:text-4xl">
                  {promotions[0]?.title ?? 'Um convite para voltar'}
                </h2>
                <p className="mt-5 max-w-xl text-base leading-7 text-white/68">
                  {promotions[0]?.text ??
                    'Acompanhe nossas novidades e condições especiais para pesca e restaurante.'}
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
              <p className="eyebrow mb-4">Venha nos visitar</p>
              <h2 className="font-display text-4xl">Seu próximo dia tranquilo começa aqui.</h2>
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
                    <strong className="text-base text-foreground">19 991689268</strong>
                  </span>
                </a>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-primary shadow-sm">
                    <Clock3 className="h-4 w-4" />
                  </span>
                  <span>
                    <small className="block">Funcionamento</small>
                    <strong className="text-base text-foreground">
                      Terça a domingo, 07h às 20h
                    </strong>
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
