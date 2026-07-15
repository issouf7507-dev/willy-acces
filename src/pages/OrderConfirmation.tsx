import { Link, Navigate, useLocation } from 'react-router-dom'
import { formatPrice } from '../lib/utils'
import AnnouncementBar from '../components/AnnouncementBar'
import Header from '../components/Header'
import Footer from '../components/Footer'

interface OrderResponse {
  id: string
  orderNumber: string
  subtotal: string | number
  discountAmount: string | number
  total: string | number
  customerName?: string | null
  items: { name: string; quantity: number; price: string | number; total: string | number }[]
}

const money = (n: number) => formatPrice(n)
const toNum = (v: string | number) => Number(v)

export default function OrderConfirmation() {
  const location = useLocation()
  const state = location.state as { order?: OrderResponse; unresolved?: string[] } | null

  // Accès direct sans commande : on renvoie à l'accueil.
  if (!state?.order) return <Navigate to="/" replace />

  const { order, unresolved } = state
  const discount = toNum(order.discountAmount)

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <AnnouncementBar />
      <Header />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="bg-white border border-zinc-200 p-8 md:p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>

          <h1 className="text-2xl font-black uppercase mb-2">Commande confirmée !</h1>
          <p className="text-sm text-zinc-500 mb-1">
            Merci{order.customerName ? `, ${order.customerName}` : ''}. Nous vous recontactons rapidement pour finaliser.
          </p>
          <p className="text-sm text-zinc-800 font-semibold mb-8">
            N° de commande : <span className="font-mono">{order.orderNumber}</span>
          </p>

          <div className="text-left border border-zinc-200 divide-y divide-zinc-100 mb-6">
            {order.items.map((it, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm">
                  <span className="font-semibold">{it.quantity}×</span> {it.name}
                </span>
                <span className="text-sm font-semibold whitespace-nowrap">{money(toNum(it.total))}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-zinc-500">Sous-total</span>
              <span>{money(toNum(order.subtotal))}</span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 text-sm text-emerald-700">
                <span>Réduction</span>
                <span>−{money(discount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3 font-bold">
              <span>Total</span>
              <span>{money(toNum(order.total))}</span>
            </div>
          </div>

          {unresolved && unresolved.length > 0 && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 px-3 py-2 mb-6 text-left">
              Certains articles n'ont pas pu être ajoutés à la commande en ligne et devront être
              confirmés séparément : {unresolved.join(', ')}.
            </p>
          )}

          <Link
            to="/collections/bags"
            className="inline-block px-6 py-3 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
          >
            Continuer mes achats
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
