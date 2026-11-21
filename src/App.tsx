import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/Layout'
import Index from '@/pages/Index'
import AuthPage from '@/pages/AuthPage'
import DashboardPage from '@/pages/DashboardPage'
import TabsPage from '@/pages/TabsPage'
import MenuPage from '@/pages/MenuPage'
import OperationsPage from '@/pages/OperationsPage'
import CustomersPage from '@/pages/CustomersPage'
import FinancePage from '@/pages/FinancePage'
import ExperiencePage from '@/pages/ExperiencePage'
import PromotionsPage from '@/pages/PromotionsPage'
import GalleryAdminPage from '@/pages/GalleryAdminPage'
import SiteContentPage from '@/pages/SiteContentPage'
import NotFound from '@/pages/NotFound'
import type { UserRole } from '@/types'

function homeForRole(role?: UserRole) {
  if (role === 'atendimento') return '/app/comandas'
  if (role === 'cliente') return '/app/cardapio'
  return '/app'
}

function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading)
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  if (!user) return <Navigate to="/entrar" state={{ from: location.pathname }} replace />
  return <Layout />
}

function RoleRoute({ roles, children }: { roles: UserRole[]; children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user || !roles.includes(user.role)) return <Navigate to={homeForRole(user?.role)} replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route
        path="/entrar"
        element={
          user ? <Navigate to={homeForRole(user.role)} replace /> : <AuthPage mode="login" />
        }
      />
      <Route
        path="/cadastro"
        element={
          user ? <Navigate to={homeForRole(user.role)} replace /> : <AuthPage mode="register" />
        }
      />
      <Route path="/app" element={<RequireAuth />}>
        <Route
          index
          element={
            <RoleRoute roles={['gestor']}>
              <DashboardPage />
            </RoleRoute>
          }
        />
        <Route
          path="comandas"
          element={
            <RoleRoute roles={['gestor', 'atendimento', 'cliente']}>
              <TabsPage />
            </RoleRoute>
          }
        />
        <Route
          path="recebimentos"
          element={
            <RoleRoute roles={['gestor', 'atendimento']}>
              <TabsPage paymentMode />
            </RoleRoute>
          }
        />
        <Route
          path="cardapio"
          element={
            <RoleRoute roles={['gestor', 'atendimento', 'cliente']}>
              <MenuPage />
            </RoleRoute>
          }
        />
        <Route
          path="operacoes"
          element={
            <RoleRoute roles={['gestor']}>
              <OperationsPage />
            </RoleRoute>
          }
        />
        <Route
          path="clientes"
          element={
            <RoleRoute roles={['gestor']}>
              <CustomersPage />
            </RoleRoute>
          }
        />
        <Route
          path="financeiro"
          element={
            <RoleRoute roles={['gestor']}>
              <FinancePage />
            </RoleRoute>
          }
        />
        <Route
          path="experiencia"
          element={
            <RoleRoute roles={['cliente']}>
              <ExperiencePage />
            </RoleRoute>
          }
        />
        <Route
          path="galeria"
          element={
            <RoleRoute roles={['gestor', 'atendimento']}>
              <GalleryAdminPage />
            </RoleRoute>
          }
        />
        <Route
          path="promocoes"
          element={
            <RoleRoute roles={['gestor']}>
              <PromotionsPage />
            </RoleRoute>
          }
        />
        <Route
          path="conteudo"
          element={
            <RoleRoute roles={['gestor', 'atendimento']}>
              <SiteContentPage />
            </RoleRoute>
          }
        />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  )
}
