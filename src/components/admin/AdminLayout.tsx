import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Package, ShoppingBag, Tag, Ticket,
  Settings, LogOut, ChevronRight, Store, Image, HelpCircle,
  Menu, X,
} from 'lucide-react'
import { useState } from 'react'

const nav = [
  {
    label: 'Principal',
    items: [
      { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { to: '/admin/products', icon: Package, label: 'Produits' },
      { to: '/admin/categories', icon: Tag, label: 'Catégories' },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { to: '/admin/orders', icon: ShoppingBag, label: 'Commandes' },
      { to: '/admin/coupons', icon: Ticket, label: 'Coupons' },
    ],
  },
  {
    label: 'Contenu',
    items: [
      { to: '/admin/content/carousel', icon: Image, label: 'Carousel' },
      { to: '/admin/content/faq', icon: HelpCircle, label: 'FAQ' },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { to: '/admin/settings', icon: Settings, label: 'Paramètres' },
    ],
  },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/admin/login')
  }

  const Sidebar = () => (
    <aside className="flex flex-col h-full w-64 bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
          <Store className="w-5 h-5 text-gray-900" />
        </div>
        <div>
          <p className="font-semibold text-sm leading-none">Willy Accessoire</p>
          <p className="text-xs text-gray-400 mt-0.5">Backoffice</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {nav.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ to, icon: Icon, label, exact }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={exact}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-white text-gray-900 font-medium'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                  <ChevronRight className="w-3 h-3 ml-auto opacity-40" />
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.role}</p>
          </div>
          <button onClick={handleLogout} title="Déconnexion" className="text-gray-400 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="flex-shrink-0">
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-semibold text-gray-900">Willy Accessoire</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
