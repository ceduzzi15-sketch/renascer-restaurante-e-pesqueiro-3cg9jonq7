import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  BadgeDollarSign,
  BookOpen,
  ChevronLeft,
  ClipboardList,
  Fish,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  Megaphone,
  ReceiptText,
  UsersRound,
  FileText,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { lazy, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/contexts/AuthContext'
import { useBusinessSettings } from '@/hooks/use-business-settings'
import BrandMark from '@/components/BrandMark'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'

const GalleryAdminPage = lazy(() => import('@/pages/GalleryAdminPage'))

interface NavItem {
  label: string
  href: string
  icon: typeof LayoutDashboard
  roles: UserRole[]
  end?: boolean
}

const navItems: NavItem[] = [
  { label: 'Visão geral', href: '/app', icon: LayoutDashboard, roles: ['gestor'], end: true },
  {
    label: 'Comandas',
    href: '/app/comandas',
    icon: ClipboardList,
    roles: ['gestor', 'atendimento', 'cliente'],
  },
  {
    label: 'Recebimentos',
    href: '/app/recebimentos',
    icon: ReceiptText,
    roles: ['gestor', 'atendimento'],
  },
  {
    label: 'Cardápio',
    href: '/app/cardapio',
    icon: BookOpen,
    roles: ['gestor', 'atendimento', 'cliente'],
  },
  { label: 'Pesca & locações', href: '/app/operacoes', icon: Fish, roles: ['gestor'] },
  { label: 'Clientes', href: '/app/clientes', icon: UsersRound, roles: ['gestor'] },
  { label: 'Financeiro', href: '/app/financeiro', icon: BadgeDollarSign, roles: ['gestor'] },
  { label: 'Promoções', href: '/app/promocoes', icon: Megaphone, roles: ['gestor'] },
  {
    label: 'Galeria do site',
    href: '/app/galeria',
    icon: Images,
    roles: ['gestor', 'atendimento'],
  },
  {
    label: 'Conteúdo do site',
    href: '/app/conteudo',
    icon: FileText,
    roles: ['gestor', 'atendimento'],
  },
  { label: 'Fotos & avaliação', href: '/app/experiencia', icon: Images, roles: ['cliente'] },
]

const roleLabels: Record<UserRole, string> = {
  gestor: 'Gestor',
  atendimento: 'Atendimento',
  cliente: 'Cliente',
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth()
  if (!user) return null
  return (
    <nav className="space-y-1 px-3 py-5">
      {navItems
        .filter((item) => item.roles.includes(user.role))
        .map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )
            }
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
          </NavLink>
        ))}
    </nav>
  )
}

function SidebarContent({ mobile, close }: { mobile?: boolean; close?: () => void }) {
  const { user, logout } = useAuth()
  const { settings } = useBusinessSettings()
  if (!user) return null
  const initials =
    user.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-20 items-center justify-between border-b border-sidebar-border px-5">
        <BrandMark name={settings.business_name} light />
        {mobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            className="text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      <div className="scrollbar-subtle flex-1 overflow-y-auto">
        <div className="px-6 pb-1 pt-6 text-[10px] font-bold uppercase tracking-[0.22em] text-sidebar-foreground/35">
          Navegação
        </div>
        <Navigation onNavigate={close} />
      </div>
      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/[0.045] p-3">
          <Avatar className="h-9 w-9 border border-white/10">
            <AvatarFallback className="bg-accent text-xs font-bold text-accent-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="text-xs text-white/45">{roleLabels[user.role]}</p>
          </div>
          <Button
            onClick={logout}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/50 hover:bg-white/10 hover:text-white"
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <NavLink
          to="/"
          onClick={close}
          className="flex items-center justify-center gap-2 py-1 text-xs font-medium text-white/45 hover:text-white/80"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Ver site público
        </NavLink>
      </div>
    </div>
  )
}

export default function Layout() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { user } = useAuth()
  const { settings } = useBusinessSettings()

  useEffect(() => setOpen(false), [location.pathname])

  const current = navItems.find(
    (item) =>
      item.href === location.pathname || (!item.end && location.pathname.startsWith(item.href)),
  )

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 lg:block">
        <SidebarContent />
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/80 bg-background/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[310px] border-0 p-0 [&>button]:hidden">
                <SidebarContent mobile close={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <div>
              <p className="text-xs text-muted-foreground">{settings.business_name}</p>
              <h2 className="font-sans text-sm font-semibold tracking-normal sm:text-base">
                {current?.label ?? 'Painel'}
              </h2>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground sm:flex">
            <span className="status-dot bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" />{' '}
            Sistema online
          </div>
        </header>
        <main className="min-h-[calc(100vh-4rem)]">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  )
}
