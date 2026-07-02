import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api } from '../lib/api'

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
}

interface AuthContextValue {
  user: AdminUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const tk = localStorage.getItem('admin_token')
    if (!tk) { setLoading(false); return }
    api.get<AdminUser>('/auth/me')
      .then(setUser)
      .catch(() => localStorage.removeItem('admin_token'))
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const res = await api.post<{ user: AdminUser; accessToken: string }>('/auth/login', { email, password })
    if (!['ADMIN', 'MANAGER', 'STAFF'].includes(res.user.role)) {
      throw new Error('Accès réservé au backoffice')
    }
    localStorage.setItem('admin_token', res.accessToken)
    setUser(res.user)
  }

  function logout() {
    api.post('/auth/logout', {}).catch(() => null)
    localStorage.removeItem('admin_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
