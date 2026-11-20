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
import { getActivePromotions, getPublicMenu } from '@/services/api'
import { LOCAL_PHOTOS } from '@/lib/assets'
import BrandMark from '@/components/BrandMark'
import type { MenuItem, Promotion } from '@/types'
import { cn } from '@/lib/utils'

const categoryLabels = { comida: 'Pratos', porcao: 'Porções', bebida: 'Bebidas' }

export default function Index() {
  const { settings } = useBusinessSettings()
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    void Promise.all([getPublicMenu(), getActivePromotions()])
      .then(([menuData, promotionData]) => {
        setMenu(menuData)
        setPromotions(promotionData)
      })
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

        <section id="cardapio" className="warm-grid bg-secondary/55 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="eyebrow mb-4">Sabores do recanto</p>
              <h2 className="font-display text-4xl sm:text-5xl">Nosso cardápio</h2>
              <p className="mt-4 text-muted-foreground">
                Conheça algumas das opções preparadas pela nossa cozinha. Os valores ficam
                disponíveis no atendimento e no acesso do cliente.
              </p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {menu.map((item, index) => {
                const fallback =
                  item.category === 'bebida'
                    ? LOCAL_PHOTOS.lake
                    : index % 2
                      ? LOCAL_PHOTOS.fish
                      : LOCAL_PHOTOS.dish
                return (
                  <article
                    key={item.id}
                    className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_14px_45px_-30px_rgba(24,67,51,0.45)]"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={item.image_url || fallback}
                        alt={item.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <Badge className="absolute left-4 top-4 bg-primary/90 text-white">
                        {categoryLabels[item.category]}
                      </Badge>
                    </div>
                    <div className="p-5">
                      <h3 className="text-xl">{item.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </article>
                )
              })}
            </div>
            <div className="mt-10 text-center">
              <Button asChild>
                <Link to="/cadastro">
                  Acessar cardápio completo e pedir <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
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
