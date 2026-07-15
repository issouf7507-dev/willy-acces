import { useEffect, useState } from 'react'
import { formatPrice } from '../lib/utils'
import { Link, useNavigate } from 'react-router-dom'
import AnnouncementBar from '../components/AnnouncementBar'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'
import { api } from '../lib/api'
import { fetchSettings, resolveCartToOrder } from '../lib/storefront'

const inputClass =
  'w-full px-3.5 py-2.5 text-sm border border-zinc-300 focus:border-black focus:outline-none bg-white transition-colors'
const labelClass = 'block text-xs font-bold uppercase tracking-wide text-zinc-700 mb-1.5'

interface OrderResponse {
  id: string
  orderNumber: string
  subtotal: string | number
  discountAmount: string | number
  total: string | number
  customerName?: string | null
  items: { name: string; quantity: number; price: string | number; total: string | number }[]
}

interface FormState {
  name: string
  phone: string
  email: string
  address: string
  city: string
  couponCode: string
  notes: string
}

const EMPTY: FormState = {
  name: '', phone: '', email: '', address: '', city: '', couponCode: '', notes: '',
}

const money = (n: number) => formatPrice(n)

function whatsappHref(number: string, message: string): string {
  const digits = number.replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export default function Checkout() {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart()
  const navigate = useNavigate()

  const [form, setForm] = useState<FormState>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(f => ({ ...f, [key]: value }))

  useEffect(() => {
    fetchSettings()
      .then(s => {
        const raw = s.whatsappNumber
        if (typeof raw === 'string') setWhatsappNumber(raw)
        else if (typeof raw === 'number') setWhatsappNumber(String(raw))
      })
      .catch(() => { /* réglages indisponibles : bouton WhatsApp masqué */ })
  }, [])

  const buildWhatsappMessage = () => {
    const lines = [
      'Bonjour, je souhaite passer commande :',
      ...items.map(i => `• ${i.quantity} x ${i.name}${i.color ? ` (${i.color})` : ''} — ${money(i.price * i.quantity)}`),
      `Total : ${money(total)}`,
    ]
    if (form.name) lines.push(`Nom : ${form.name}`)
    if (form.phone) lines.push(`Téléphone : ${form.phone}`)
    if (form.address || form.city) lines.push(`Adresse : ${[form.address, form.city].filter(Boolean).join(', ')}`)
    return lines.join('\n')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (items.length === 0) return
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError('Merci de renseigner au moins votre nom, votre téléphone et votre adresse de livraison.')
      return
    }

    setSubmitting(true)
    try {
      const { orderItems, unresolved } = await resolveCartToOrder(items)

      if (orderItems.length === 0) {
        setError(
          "Aucun de ces articles n'est disponible à la commande en ligne pour le moment. " +
          'Vous pouvez finaliser via WhatsApp.',
        )
        return
      }

      const noteParts = [
        `Adresse : ${[form.address, form.city].filter(Boolean).join(', ')}`,
        form.notes.trim() && `Note : ${form.notes.trim()}`,
        unresolved.length > 0 && `Articles à confirmer (hors commande en ligne) : ${unresolved.join(', ')}`,
      ].filter(Boolean)

      const order = await api.post<OrderResponse>('/orders', {
        items: orderItems,
        customerName: form.name.trim(),
        customerPhone: form.phone.trim(),
        customerEmail: form.email.trim() || undefined,
        couponCode: form.couponCode.trim() || undefined,
        notes: noteParts.join(' — '),
      })

      clearCart()
      navigate('/order-confirmation', { state: { order, unresolved } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessayez.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <AnnouncementBar />
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tight mb-1">Commande</h1>
        <p className="text-sm text-zinc-500 mb-8">
          Renseignez vos coordonnées ou commandez directement sur WhatsApp.
        </p>

        {items.length === 0 ? (
          <div className="bg-white border border-zinc-200 p-10 text-center">
            <p className="text-zinc-500 mb-6">Votre panier est vide.</p>
            <Link
              to="/collections/bags"
              className="inline-block px-6 py-3 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
            >
              Continuer mes achats
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
            {/* ── Formulaire ── */}
            <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 p-6 md:p-8 space-y-6 order-2 lg:order-1">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} htmlFor="c-name">Nom complet *</label>
                  <input id="c-name" className={inputClass} value={form.name} onChange={e => set('name', e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass} htmlFor="c-phone">Téléphone / WhatsApp *</label>
                  <input id="c-phone" type="tel" className={inputClass} value={form.phone} onChange={e => set('phone', e.target.value)} required />
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="c-email">E-mail</label>
                <input id="c-email" type="email" className={inputClass} value={form.email} onChange={e => set('email', e.target.value)} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} htmlFor="c-address">Adresse de livraison *</label>
                  <input id="c-address" className={inputClass} value={form.address} onChange={e => set('address', e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass} htmlFor="c-city">Ville / Quartier</label>
                  <input id="c-city" className={inputClass} value={form.city} onChange={e => set('city', e.target.value)} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} htmlFor="c-coupon">Code promo</label>
                  <input id="c-coupon" className={inputClass} value={form.couponCode} onChange={e => set('couponCode', e.target.value)} />
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="c-notes">Note (facultatif)</label>
                <textarea id="c-notes" rows={3} className={inputClass} value={form.notes} onChange={e => set('notes', e.target.value)} />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2">{error}</p>
              )}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Envoi en cours…
                    </>
                  ) : (
                    `Passer la commande — ${money(total)}`
                  )}
                </button>

                {whatsappNumber && (
                  <a
                    href={whatsappHref(whatsappNumber, buildWhatsappMessage())}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#25D366' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Commander sur WhatsApp
                  </a>
                )}
              </div>

              <p className="text-xs text-zinc-400 text-center">
                Paiement à la livraison ou à convenir. Nous vous recontactons pour confirmer.
              </p>
            </form>

            {/* ── Récapitulatif ── */}
            <aside className="bg-white border border-zinc-200 p-6 order-1 lg:order-2 lg:sticky lg:top-6">
              <h2 className="font-bold text-sm uppercase tracking-wide mb-4">Récapitulatif</h2>
              <div className="space-y-4 mb-5">
                {items.map(item => (
                  <div key={`${item.id}-${item.color}`} className="flex gap-3">
                    <div className={`w-16 h-16 flex-shrink-0 bg-gradient-to-br ${item.gradientFrom} ${item.gradientTo} rounded-sm`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm leading-snug truncate">{item.name}</p>
                      <p className="text-xs text-zinc-400">{item.color}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center border border-zinc-300">
                          <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 text-zinc-600 hover:bg-zinc-100 leading-none" aria-label="Diminuer">−</button>
                          <span className="w-7 text-center text-xs">{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 text-zinc-600 hover:bg-zinc-100 leading-none" aria-label="Augmenter">+</button>
                        </div>
                        <button type="button" onClick={() => removeItem(item.id)} className="text-xs text-zinc-400 underline hover:text-black">Retirer</button>
                      </div>
                    </div>
                    <span className="text-sm font-semibold whitespace-nowrap">{money(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-zinc-200 pt-4 flex items-center justify-between">
                <span className="font-bold text-sm">Total</span>
                <span className="font-bold text-sm">{money(total)}</span>
              </div>
              <p className="text-xs text-zinc-400 mt-2">Frais de livraison calculés à la confirmation.</p>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
