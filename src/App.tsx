import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Boutique
import Home from './pages/Home'
import Bags from './pages/Bags'
import NewArrivals from './pages/NewArrivals'
import Preorders from './pages/Preorders'
import Accessories from './pages/Accessories'
import SalonDeBeaute from './pages/SalonDeBeaute'
import Faq from './pages/Faq'
import Inscription from './pages/Inscription'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Checkout from './pages/Checkout'
import OrderConfirmation from './pages/OrderConfirmation'
import CartDrawer from './components/cart/CartDrawer'
import QuickBuyDrawer from './components/cart/QuickBuyDrawer'
import PreorderFormModal from './components/preorder/PreorderFormModal'

// Auth & Admin
import { EdgeStoreProvider } from './lib/edgestore'
import { API_ORIGIN } from './lib/api'
import { AuthProvider, ADMIN_ROLES, OWNER_ROLES } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import ProtectedRoute from './components/admin/ProtectedRoute'

// Admin : chargé à la demande (code-splitting — sort recharts/formulaires du bundle vitrine)
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const Login = lazy(() => import('./pages/admin/Login'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminProducts = lazy(() => import('./pages/admin/Products'))
const AdminOrders = lazy(() => import('./pages/admin/Orders'))
const AdminCategories = lazy(() => import('./pages/admin/Categories'))
const AdminCoupons = lazy(() => import('./pages/admin/Coupons'))
const AdminCarousel = lazy(() => import('./pages/admin/content/Carousel'))
const AdminFaq = lazy(() => import('./pages/admin/content/Faq'))
const AdminSalonServices = lazy(() => import('./pages/admin/content/SalonServices'))
const AdminSalonGallery = lazy(() => import('./pages/admin/content/SalonGallery'))
const AdminQuotes = lazy(() => import('./pages/admin/Quotes'))
const AdminPreorders = lazy(() => import('./pages/admin/Preorders'))
const AdminSubscribers = lazy(() => import('./pages/admin/Subscribers'))
const AdminReviews = lazy(() => import('./pages/admin/Reviews'))
const AdminSettings = lazy(() => import('./pages/admin/Settings'))
const AdminUsers = lazy(() => import('./pages/admin/Users'))
const AdminAccount = lazy(() => import('./pages/admin/Account'))
const AdminStores = lazy(() => import('./pages/admin/gestion/Stores'))
const AdminCaisse = lazy(() => import('./pages/admin/gestion/Caisse'))
const AdminDailyExpenses = lazy(() => import('./pages/admin/gestion/DailyExpenses'))
const AdminExpenses = lazy(() => import('./pages/admin/gestion/Expenses'))
const AdminBalance = lazy(() => import('./pages/admin/gestion/Balance'))
const AdminGestionDashboard = lazy(() => import('./pages/admin/gestion/Dashboard'))
const AdminStock = lazy(() => import('./pages/admin/gestion/Stock'))
const AdminTargets = lazy(() => import('./pages/admin/gestion/Targets'))
const AdminRevenue = lazy(() => import('./pages/admin/gestion/Revenue'))
const AdminSales = lazy(() => import('./pages/admin/gestion/Sales'))
const AdminShipments = lazy(() => import('./pages/admin/gestion/Shipments'))
const AdminShipmentGroups = lazy(() => import('./pages/admin/gestion/ShipmentGroups'))
const AdminTransfers = lazy(() => import('./pages/admin/gestion/Transfers'))
const AdminCustomers = lazy(() => import('./pages/admin/gestion/Customers'))

function AdminFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="w-6 h-6 border-2 border-zinc-300 border-t-black rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <EdgeStoreProvider basePath={`${API_ORIGIN}/edgestore`}>
    <AuthProvider>
    <SettingsProvider>
      <Routes>
        {/* ── Boutique ────────────────────────────────── */}
        <Route path="/" element={<Home />} />
        <Route path="/collections/bags" element={<Bags />} />
        <Route path="/collections/new-arrivals" element={<NewArrivals />} />
        <Route path="/collections/produits-a-venir" element={<Preorders />} />
        <Route path="/accessories" element={<Accessories />} />
        <Route path="/salon-de-beaute" element={<SalonDeBeaute />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/inscription" element={<Inscription />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:handle" element={<ProductDetail />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-confirmation" element={<OrderConfirmation />} />

        {/* ── Admin (lazy) ────────────────────────────── */}
        <Route
          path="/admin/login"
          element={<Suspense fallback={<AdminFallback />}><Login /></Suspense>}
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Suspense fallback={<AdminFallback />}>
                <AdminLayout />
              </Suspense>
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="content/carousel" element={<AdminCarousel />} />
          <Route path="content/faq" element={<AdminFaq />} />
          <Route path="salon/services" element={<AdminSalonServices />} />
          <Route path="salon/gallery" element={<AdminSalonGallery />} />
          <Route path="quotes" element={<AdminQuotes />} />
          <Route path="preorders" element={<AdminPreorders />} />
          {/* Comptoir : ouvert à la vendeuse, hors de la section Gestion. */}
          <Route path="caisse" element={<AdminCaisse />} />
          {/* Les sorties de caisse du jour se notent au comptoir ; le mois
              entier reste dans Gestion, réservé au bureau. */}
          <Route path="depenses" element={<AdminDailyExpenses />} />
          {/* L'ancienne adresse de la caisse reste valide (favoris, liens). */}
          <Route path="gestion/caisse" element={<Navigate to="/admin/caisse" replace />} />

          {/* Ce que l'entreprise gagne : super administrateur uniquement. */}
          <Route path="gestion" element={<ProtectedRoute roles={OWNER_ROLES}><AdminGestionDashboard /></ProtectedRoute>} />
          <Route path="gestion/sales" element={<ProtectedRoute roles={ADMIN_ROLES}><AdminSales /></ProtectedRoute>} />
          <Route path="gestion/revenue" element={<ProtectedRoute roles={OWNER_ROLES}><AdminRevenue /></ProtectedRoute>} />
          <Route path="gestion/balance" element={<ProtectedRoute roles={OWNER_ROLES}><AdminBalance /></ProtectedRoute>} />

          {/* Le reste de la gestion : les deux niveaux d'administration. */}
          <Route path="gestion/shipments" element={<ProtectedRoute roles={ADMIN_ROLES}><AdminShipments /></ProtectedRoute>} />
          <Route path="gestion/groups" element={<ProtectedRoute roles={ADMIN_ROLES}><AdminShipmentGroups /></ProtectedRoute>} />
          <Route path="gestion/expenses" element={<ProtectedRoute roles={ADMIN_ROLES}><AdminExpenses /></ProtectedRoute>} />
          <Route path="gestion/stock" element={<ProtectedRoute roles={ADMIN_ROLES}><AdminStock /></ProtectedRoute>} />
          <Route path="gestion/transfers" element={<ProtectedRoute roles={ADMIN_ROLES}><AdminTransfers /></ProtectedRoute>} />
          <Route path="gestion/targets" element={<ProtectedRoute roles={ADMIN_ROLES}><AdminTargets /></ProtectedRoute>} />
          <Route path="gestion/stores" element={<ProtectedRoute roles={ADMIN_ROLES}><AdminStores /></ProtectedRoute>} />
          <Route path="gestion/customers" element={<ProtectedRoute roles={ADMIN_ROLES}><AdminCustomers /></ProtectedRoute>} />
          <Route path="subscribers" element={<AdminSubscribers />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="settings" element={<AdminSettings />} />
          {/* Chacun gère son propre mot de passe, quel que soit son rôle. */}
          <Route path="account" element={<AdminAccount />} />
          {/* Créer, modifier ou supprimer un compte : super administrateur seul. */}
          <Route
            path="users"
            element={<ProtectedRoute roles={OWNER_ROLES}><AdminUsers /></ProtectedRoute>}
          />
        </Route>
      </Routes>

      {/* Drawers boutique (hors admin) */}
      <CartDrawer />
      <QuickBuyDrawer />
      <PreorderFormModal />
    </SettingsProvider>
    </AuthProvider>
    </EdgeStoreProvider>
  )
}
