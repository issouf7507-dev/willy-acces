import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

// Boutique
import Home from './pages/Home'
import Bags from './pages/Bags'
import NewArrivals from './pages/NewArrivals'
import Preorders from './pages/Preorders'
import Accessories from './pages/Accessories'
import SalonDeBeaute from './pages/SalonDeBeaute'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Checkout from './pages/Checkout'
import OrderConfirmation from './pages/OrderConfirmation'
import CartDrawer from './components/cart/CartDrawer'
import QuickBuyDrawer from './components/cart/QuickBuyDrawer'

// Auth & Admin
import { EdgeStoreProvider } from './lib/edgestore'
import { API_ORIGIN } from './lib/api'
import { AuthProvider } from './context/AuthContext'
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
const AdminSettings = lazy(() => import('./pages/admin/Settings'))
const AdminUsers = lazy(() => import('./pages/admin/Users'))

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
      <Routes>
        {/* ── Boutique ────────────────────────────────── */}
        <Route path="/" element={<Home />} />
        <Route path="/collections/bags" element={<Bags />} />
        <Route path="/collections/new-arrivals" element={<NewArrivals />} />
        <Route path="/collections/produits-a-venir" element={<Preorders />} />
        <Route path="/accessories" element={<Accessories />} />
        <Route path="/salon-de-beaute" element={<SalonDeBeaute />} />
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
          <Route path="settings" element={<AdminSettings />} />
          {/* Gestion des comptes : ADMIN uniquement. */}
          <Route
            path="users"
            element={<ProtectedRoute roles={['ADMIN']}><AdminUsers /></ProtectedRoute>}
          />
        </Route>
      </Routes>

      {/* Drawers boutique (hors admin) */}
      <CartDrawer />
      <QuickBuyDrawer />
    </AuthProvider>
    </EdgeStoreProvider>
  )
}
