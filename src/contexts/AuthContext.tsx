import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import type { AuthUser, UserRole } from '@/types'

interface RegistrationData {
  name: string
  email: string
  phone: string
  cpf: string
  password: string
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  register: (data: RegistrationData) => Promise<AuthUser>
  logout: () => void
  isRole: (...roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapUser(record: unknown): AuthUser | null {
  if (!record || typeof record !== 'object') return null
  return record as AuthUser
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => mapUser(pb.authStore.record))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => setUser(mapUser(record)), true)
    setLoading(false)
    return unsubscribe
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        const result = await pb
          .collection('users')
          .authWithPassword(email.trim().toLowerCase(), password)
        const authenticatedUser = mapUser(result.record)
        if (!authenticatedUser) throw new Error('Não foi possível carregar o perfil do usuário.')
        setUser(authenticatedUser)
        return authenticatedUser
      },
      register: async (data) => {
        await pb.collection('users').create({
          email: data.email.trim().toLowerCase(),
          password: data.password,
          passwordConfirm: data.password,
          name: data.name.trim(),
          phone: data.phone,
          cpf: data.cpf,
          role: 'cliente',
        })
        const result = await pb
          .collection('users')
          .authWithPassword(data.email.trim().toLowerCase(), data.password)
        const registeredUser = mapUser(result.record)
        if (!registeredUser) throw new Error('Não foi possível concluir o cadastro.')
        await pb.collection('customers').create({
          user: registeredUser.id,
          name: data.name.trim(),
          phone: data.phone,
          cpf: data.cpf,
          total_spent: 0,
        })
        setUser(registeredUser)
        return registeredUser
      },
      logout: () => {
        pb.authStore.clear()
        setUser(null)
      },
      isRole: (...roles) => Boolean(user && roles.includes(user.role)),
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}
