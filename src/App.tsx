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
import CartDrawer from './components/cart/CartDrawer'
import QuickBuyDrawer from './components/cart/QuickBuyDrawer'

// Auth & Admin
import { EdgeStoreProvider } from './lib/edgestore'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/admin/ProtectedRoute'
import AdminLayout from './components/admin/AdminLayout'
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import AdminProducts from './pages/admin/Products'
import AdminOrders from './pages/admin/Orders'
import AdminCategories from './pages/admin/Categories'

export default function App() {
  return (
    <EdgeStoreProvider>
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

        {/* ── Admin ───────────────────────────────────── */}
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="categories" element={<AdminCategories />} />
        </Route>
      </Routes>

      {/* Drawers boutique (hors admin) */}
      <CartDrawer />
      <QuickBuyDrawer />
    </AuthProvider>
    </EdgeStoreProvider>
  )
}
