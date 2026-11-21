import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { LOCAL_PHOTOS } from '@/lib/assets'
import BrandMark from '@/components/BrandMark'
import { useBusinessSettings } from '@/hooks/use-business-settings'
import { useRequiredFields } from '@/hooks/use-required-fields'
import { normalizeCpf, normalizePhone } from '@/services/api'
import { cn } from '@/lib/utils'

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register'
  const { login, register } = useAuth()
  const { settings } = useBusinessSettings()
  const { required: requiredFields } = useRequiredFields()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', cpf: '', password: '' })

  const update = (field: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [field]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (isRegister) {
      const missing: string[] = []
      if (requiredFields.name && !form.name.trim()) missing.push('nome')
      if (requiredFields.email && !form.email.trim()) missing.push('e-mail')
      if (requiredFields.phone && !form.phone.trim()) missing.push('telefone')
      if (requiredFields.cpf && form.cpf.replace(/\D/g, '').length !== 11) missing.push('CPF')
      if (missing.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Campos obrigatórios',
          description: `Preencha: ${missing.join(', ')}.`,
        })
        return
      }
    }
    setLoading(true)
    try {
      const user = isRegister ? await register(form) : await login(form.email, form.password)
      toast({
        title: isRegister ? 'Cadastro concluído!' : 'Bem-vindo de volta!',
        description: `${user.name}, seu acesso está pronto.`,
      })
      const requested = (location.state as { from?: string } | null)?.from
      navigate(
        requested ||
          (user.role === 'gestor'
            ? '/app'
            : user.role === 'atendimento'
              ? '/app/comandas'
              : '/app/cardapio'),
        { replace: true },
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Confira os dados informados e tente novamente.'
      toast({ variant: 'destructive', title: 'Não foi possível continuar', description: message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-primary lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden min-h-screen overflow-hidden lg:block">
        <img
          src={LOCAL_PHOTOS.lake}
          alt="Lago do pesqueiro"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="lake-overlay absolute inset-0" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white xl:p-16">
          <BrandMark name={settings.business_name} light />
          <div className="max-w-xl animate-rise">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-amber-300">
              Gestão integrada
            </p>
            <h1 className="text-5xl leading-[1.08] xl:text-6xl">
              Tudo do seu dia à beira do lago, em um só lugar.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/70">
              Comandas, pesca, locações e finanças organizadas para sua equipe — e uma experiência
              simples para o cliente.
            </p>
          </div>
          <p className="text-xs text-white/45">
            © {new Date().getFullYear()} {settings.business_name}
          </p>
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center bg-background px-5 py-12 sm:px-10">
        <Link
          to="/"
          className="absolute left-5 top-5 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary sm:left-8 sm:top-8"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao site
        </Link>
        <div className="w-full max-w-md animate-rise">
          <div className="mb-8 lg:hidden">
            <BrandMark name={settings.business_name} />
          </div>
          <p className="eyebrow mb-3">{isRegister ? 'Novo por aqui?' : 'Área reservada'}</p>
          <h2 className="page-heading text-3xl sm:text-4xl">
            {isRegister ? 'Crie seu acesso' : 'Acesse sua conta'}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {isRegister
              ? 'Cadastre-se para fazer pedidos pela sua comanda e compartilhar sua experiência.'
              : 'Entre com o e-mail e a senha do seu perfil.'}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    className="h-11 pl-10"
                    placeholder="Como devemos chamar você?"
                    required={requiredFields.name}
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  className="h-11 pl-10"
                  placeholder="voce@email.com"
                  required={requiredFields.email || !isRegister}
                />
              </div>
            </div>
            {isRegister && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => update('phone', normalizePhone(e.target.value))}
                      className="h-11 pl-10"
                      placeholder="(19) 99999-9999"
                      required={requiredFields.phone}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={form.cpf}
                    onChange={(e) => update('cpf', normalizeCpf(e.target.value))}
                    className="h-11"
                    placeholder="000.000.000-00"
                    required={requiredFields.cpf}
                    minLength={requiredFields.cpf ? 14 : undefined}
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  className="h-11 px-10"
                  placeholder="Mínimo de 8 caracteres"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading ? 'Aguarde...' : isRegister ? 'Criar minha conta' : 'Entrar no sistema'}
            </Button>
          </form>

          <div
            className={cn(
              'mt-7 rounded-xl border p-4 text-center text-sm',
              isRegister ? 'bg-muted/30' : 'bg-secondary/50',
            )}
          >
            {isRegister ? 'Já possui cadastro?' : 'É cliente e ainda não tem acesso?'}{' '}
            <Link
              to={isRegister ? '/entrar' : '/cadastro'}
              className="font-bold text-primary hover:underline"
            >
              {isRegister ? 'Entrar agora' : 'Cadastre-se pelo celular'}
            </Link>
          </div>
          {!isRegister && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              A equipe recebe o acesso diretamente do gestor.
            </p>
          )}
        </div>
      </section>
    </main>
  )
}
