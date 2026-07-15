import { Navigate } from 'react-router-dom'
import { useAuth, STAFF_ROLES } from '../../context/AuthContext'

interface Props {
  children: React.ReactNode
  /** Rôles autorisés. Par défaut : tout le personnel du back-office. */
  roles?: readonly string[]
}

export default function ProtectedRoute({ children, roles = STAFF_ROLES }: Props) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/admin/login" replace />

  // Vérifier le rôle et pas seulement la présence d'un compte : un CUSTOMER
  // peut obtenir un token via /auth/register, qui est une route publique.
  if (!roles.includes(user.role)) {
    // Membre du back-office mais rôle insuffisant (ex. STAFF sur /admin/users) :
    // on le renvoie au tableau de bord. Le sortir vers /login n'aurait pas de
    // sens puisqu'il est déjà connecté.
    const isStaff = STAFF_ROLES.includes(user.role as (typeof STAFF_ROLES)[number])
    return <Navigate to={isStaff ? '/admin' : '/admin/login'} replace />
  }

  return <>{children}</>
}
