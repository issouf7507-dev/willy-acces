import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api } from '../lib/api'

/** Rôles autorisés à entrer dans le back-office. CUSTOMER en est exclu. */
export const STAFF_ROLES = ['ADMIN', 'MANAGER', 'STAFF'] as const

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

const isStaff = (u: { role: string }) => (STAFF_ROLES as readonly string[]).includes(u.role)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const tk = localStorage.getItem('admin_token')
    if (!tk) { setLoading(false); return }
    api.get<AdminUser>('/auth/me')
      .then(me => {
        // Un token de client (obtenu via /auth/register, route publique) ne doit
        // pas ouvrir le back-office : on le jette au lieu de garder la session.
        if (!isStaff(me)) { localStorage.removeItem('admin_token'); return }
        setUser(me)
      })
      .catch(() => localStorage.removeItem('admin_token'))
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const res = await api.post<{ user: AdminUser; accessToken: string }>('/auth/login', { email, password })
    if (!isStaff(res.user)) {
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
