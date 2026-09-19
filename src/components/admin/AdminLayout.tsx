import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, ADMIN_ROLES, OWNER_ROLES } from '../../context/AuthContext'
import {
  LayoutDashboard, Package, ShoppingBag, Tag, Ticket,
  Settings, Image, HelpCircle, Menu, X, Scissors, ImageIcon, FileText,
  Users as UsersIcon, MessageSquare, PackageCheck, BellRing, Store as StoreIcon,
  UserRound, Truck, ShoppingCart, TrendingUp, Wallet, Scale, Boxes, Target,
  Gauge, Repeat, KeyRound, Receipt, ExternalLink, PanelLeftClose, PanelLeftOpen,
  Palette, Layers,
} from 'lucide-react'
import { useState } from 'react'
import { ToastProvider } from './toast'
import { ThemeProvider, useTheme } from '../../context/ThemeContext'
import { ThemeToggle } from './theme-toggle'
import { SidebarNav, type NavGroupData, type NavItemData } from './sidebar-nav'
import { Avatar } from '@/components/ui/avatar'
import { useSeo } from '../../lib/seo'
import { cn } from '@/lib/utils'

/** Libellés affichés du rôle : les valeurs techniques ne parlent pas à l'équipe. */
const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super admin',
  ADMIN: 'Admin',
  VENDEUR: 'Vendeuse',
}

/**
 * Les deux écrans du quotidien restent à plat, en haut. Les rubriques qu'on
 * ouvre plus rarement passent sous un parent dépliable : les 28 entrées à plat
 * noyaient l'essentiel.
 */
const groups: NavGroupData[] = [
  {
    items: [
      { id: 'dashboard', title: 'Tableau de bord', icon: LayoutDashboard, to: '/admin', exact: true },
      // Le comptoir est le métier de la vendeuse : il vit hors de la Gestion,
      // qui lui est fermée.
      { id: 'caisse', title: 'Caisse', icon: ShoppingCart, to: '/admin/caisse' },
      { id: 'daily-expenses', title: 'Dépenses du jour', icon: Wallet, to: '/admin/depenses' },
    ],
  },
  {
    heading: 'Boutique',
    items: [
      {
        id: 'catalogue', title: 'Catalogue', icon: Package,
        children: [
          { id: 'products', title: 'Produits', icon: Package, to: '/admin/products' },
          { id: 'categories', title: 'Catégories', icon: Tag, to: '/admin/categories' },
        ],
      },
      {
        id: 'commerce', title: 'Commerce', icon: ShoppingBag,
        children: [
          { id: 'orders', title: 'Commandes', icon: ShoppingBag, to: '/admin/orders' },
          { id: 'preorders', title: 'Précommandes', icon: PackageCheck, to: '/admin/preorders' },
          { id: 'coupons', title: 'Coupons', icon: Ticket, to: '/admin/coupons' },
          { id: 'quotes', title: 'Devis salon', icon: FileText, to: '/admin/quotes' },
          { id: 'reviews', title: 'Avis produits', icon: MessageSquare, to: '/admin/reviews' },
          { id: 'subscribers', title: 'Inscrits', icon: BellRing, to: '/admin/subscribers' },
        ],
      },
      {
        id: 'salon', title: 'Salon', icon: Scissors,
        children: [
          { id: 'salon-services', title: 'Prestations', icon: Scissors, to: '/admin/salon/services' },
          { id: 'salon-gallery', title: 'Galerie', icon: ImageIcon, to: '/admin/salon/gallery' },
        ],
      },
      {
        id: 'content', title: 'Contenu', icon: Palette,
        children: [
          { id: 'carousel', title: 'Carousel', icon: Image, to: '/admin/content/carousel' },
          { id: 'faq', title: 'FAQ', icon: HelpCircle, to: '/admin/content/faq' },
        ],
      },
    ],
  },
  {
    // Section entièrement filtrée pour une vendeuse : aucune entrée ne lui
    // reste, la rubrique disparaît donc d'elle-même de son menu.
    heading: 'Gestion',
    items: [
      { id: 'g-dashboard', title: 'Tableau de bord', icon: Gauge, to: '/admin/gestion', exact: true, roles: OWNER_ROLES },
      { id: 'g-sales', title: 'Ventes', icon: Receipt, to: '/admin/gestion/sales', roles: ADMIN_ROLES },
      { id: 'g-revenue', title: 'Recettes', icon: TrendingUp, to: '/admin/gestion/revenue', roles: OWNER_ROLES },
      { id: 'g-balance', title: 'Bilan mensuel', icon: Scale, to: '/admin/gestion/balance', roles: OWNER_ROLES },
      { id: 'g-shipments', title: 'Arrivages', icon: Truck, to: '/admin/gestion/shipments', roles: ADMIN_ROLES },
      { id: 'g-groups', title: 'Groupes', icon: Layers, to: '/admin/gestion/groups', roles: ADMIN_ROLES },
      { id: 'g-stock', title: 'Stock & marges', icon: Boxes, to: '/admin/gestion/stock', roles: ADMIN_ROLES },
      { id: 'g-transfers', title: 'Transferts', icon: Repeat, to: '/admin/gestion/transfers', roles: ADMIN_ROLES },
      { id: 'g-targets', title: 'Objectifs', icon: Target, to: '/admin/gestion/targets', roles: ADMIN_ROLES },
      { id: 'g-expenses', title: 'Dépenses', icon: Wallet, to: '/admin/gestion/expenses', roles: ADMIN_ROLES },
      { id: 'g-stores', title: 'Boutiques', icon: StoreIcon, to: '/admin/gestion/stores', roles: ADMIN_ROLES },
      { id: 'g-customers', title: 'Clients', icon: UserRound, to: '/admin/gestion/customers', roles: ADMIN_ROLES },
    ],
  },
]

const bottomItems: NavItemData[] = [
  { id: 'account', title: 'Mon compte', icon: KeyRound, to: '/admin/account' },
  // Créer un compte ou changer un rôle : le super administrateur seul.
  { id: 'users', title: 'Utilisateurs', icon: UsersIcon, to: '/admin/users', roles: OWNER_ROLES },
  { id: 'settings', title: 'Paramètres', icon: Settings, to: '/admin/settings' },
]

/** Toutes les entrées à plat, pour retrouver le titre de la page ouverte. */
function flatten(items: NavItemData[]): NavItemData[] {
  return items.flatMap((i) => [i, ...(i.children ? flatten(i.children) : [])])
}
const allItems = flatten([...groups.flatMap((g) => g.items), ...bottomItems])

function currentTitle(pathname: string): string {
  // Le chemin le plus long l'emporte : « /admin/gestion/sales » doit gagner
  // contre « /admin », qui en est un préfixe.
  const match = allItems
    .filter((i) => i.to && (i.exact ? pathname === i.to : pathname.startsWith(i.to)))
    .sort((a, b) => (b.to?.length ?? 0) - (a.to?.length ?? 0))[0]
  return match?.title ?? 'Back-office'
}

export default function AdminLayout() {
  // Le fournisseur enveloppe la coquille : c'est elle qui pose la classe de
  // thème, et elle doit donc être *sous* le fournisseur pour le lire.
  return (
    <ThemeProvider>
      <AdminShell />
    </ThemeProvider>
  )
}

function AdminShell() {
  // Back-office : hors index, en plus du Disallow de robots.txt.
  useSeo({ title: 'Back-office', noindex: true })
  const { user, logout } = useAuth()
  const { resolved } = useTheme()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const [drawer, setDrawer] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  function handleLogout() {
    logout()
    navigate('/admin/login')
  }

  /** En-tête de la barre : l'identité de la boutique et le rôle connecté. */
  const header = (
    <div className="mb-4 flex items-center gap-3 rounded-lg px-2 py-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-primary text-[13px] font-semibold text-primary-foreground shadow-sm">
        W
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="mb-1 truncate text-[13px] font-medium leading-none">Willy Accessoire</span>
        <span className="text-[11px] leading-none text-muted-foreground">
          {ROLE_LABEL[user?.role ?? ''] ?? 'Back-office'}
        </span>
      </div>
    </div>
  )

  // Le fond de la barre est semi-transparent : posé dans la coquille il se
  // fond dans la carte, mais le tiroir mobile flotte au-dessus de la page et
  // doit donc être opaque, sinon le contenu transparaît derrière le menu.
  const renderSidebar = (className?: string) => (
    <SidebarNav
      groups={groups}
      bottom={bottomItems}
      role={user?.role}
      header={header}
      onNavigate={() => setDrawer(false)}
      onLogout={handleLogout}
      className={className}
    />
  )

  return (
    // La classe est posée ici et nulle part ailleurs : tout le back-office
    // bascule, la vitrine garde son thème puisqu'elle ne passe pas par ce
    // conteneur. `color-scheme` fait suivre les contrôles natifs — menus
    // déroulants, ascenseurs, sélecteurs de date.
    <div
      className={cn(
        resolved === 'dark' && 'dark',
        'h-screen overflow-hidden bg-background p-0 text-foreground sm:p-2',
      )}
      style={{ colorScheme: resolved }}
    >
      {/*
        La coquille est une carte posée sur le fond plutôt qu'un plein écran
        bord à bord : la gouttière et les coins arrondis détachent l'espace de
        travail, et `overflow-hidden` fait suivre la barre et le contenu.
      */}
      <div className="flex h-full overflow-hidden border-border bg-card ring-1 ring-foreground/5 sm:rounded-xl sm:border sm:shadow-sm">
        {/* Desktop : la barre se réduit à zéro plutôt que de disparaître d'un coup. */}
        <div
          className={cn(
            'hidden h-full shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out lg:block',
            collapsed ? 'w-0' : 'w-[260px]',
          )}
        >
          {renderSidebar()}
        </div>

        {/* Mobile : tiroir */}
        {drawer && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <div className="shrink-0">{renderSidebar('bg-card shadow-xl')}</div>
            <div className="flex-1 bg-black/50" onClick={() => setDrawer(false)} />
          </div>
        )}

        {/* Fond très légèrement teinté : il met les cartes en relief sans
            ajouter de trait. */}
        <div className="flex flex-1 flex-col overflow-hidden bg-foreground/[0.02]">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
            <button
              onClick={() => setDrawer((v) => !v)}
              aria-label={drawer ? 'Fermer le menu' : 'Ouvrir le menu'}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground lg:hidden"
            >
              {drawer ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
            </button>

            <button
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? 'Afficher le menu' : 'Masquer le menu'}
              className="hidden rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground lg:block"
            >
              {collapsed
                ? <PanelLeftOpen className="h-[18px] w-[18px]" strokeWidth={1.5} />
                : <PanelLeftClose className="h-[18px] w-[18px]" strokeWidth={1.5} />}
            </button>

            {/* Fil d'Ariane : où l'on est, en deux niveaux. */}
            <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
              <span className="truncate">Willy Accessoire</span>
              <span aria-hidden>/</span>
              <span className="truncate font-medium text-foreground">{currentTitle(pathname)}</span>
            </div>

            <div className="ml-auto flex items-center gap-1">
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="hidden sm:inline">Voir le site</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <ThemeToggle />
              <Avatar name={user?.name} size="sm" />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            {/* Les retours d'action des écrans s'affichent au même endroit. */}
            <ToastProvider>
              <Outlet />
            </ToastProvider>
          </main>
        </div>
      </div>
    </div>
  )
}
