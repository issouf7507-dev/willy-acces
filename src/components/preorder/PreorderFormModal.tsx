import { useState, useEffect, type FormEvent } from 'react'
import { api } from '../../lib/api'
import { formatPrice } from '../../lib/utils'
import { usePreorder } from '../../context/PreorderContext'
import Countdown from './Countdown'

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/**
 * Formulaire de réservation d'un produit pas encore sorti. Volontairement
 * distinct du tunnel de commande : rien n'est payé ni livré maintenant, on
 * collecte de quoi rappeler le client à la sortie.
 */
export default function PreorderFormModal() {
  const { target, isOpen, close } = usePreorder()

  const [form, setForm] = useState({ name: '', phone: '', email: '', color: '', quantity: '1', message: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // La modale reste montée entre deux ouvertures : sans cette remise à zéro,
  // rouvrir sur un autre produit réafficherait la confirmation précédente et les
  // champs déjà remplis. Le coloris choisi sur la fiche sert de valeur initiale.
  const targetId = target?.productId
  const defaultColor = target?.defaultColor ?? ''
  useEffect(() => {
    if (!isOpen) return
    setForm({ name: '', phone: '', email: '', color: defaultColor, quantity: '1', message: '' })
    setError('')
    setDone(false)
  }, [isOpen, targetId, defaultColor])

  if (!isOpen || !target) return null

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const handleClose = () => close()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/preorders', {
        productId: target!.productId,
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        color: form.color || undefined,
        quantity: Number(form.quantity) || 1,
        message: form.message || undefined,
      })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer la précommande")
    } finally {
      setLoading(false)
    }
  }

  const quantity = Number(form.quantity) || 1
  const total = target.price * quantity

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4">
      <div className="bg-white w-full md:max-w-lg max-h-[92vh] flex flex-col">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-4 px-5 md:px-6 py-4 border-b border-zinc-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Précommande</p>
            <h2 className="font-black uppercase tracking-tight text-lg leading-tight">{target.name}</h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="Fermer"
            className="p-1.5 -mr-1.5 text-zinc-400 hover:text-black transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {done ? (
          <div className="px-5 md:px-6 py-10 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="font-black uppercase tracking-tight mb-2">Précommande enregistrée</h3>
            <p className="text-sm text-zinc-500 max-w-xs mx-auto">
              Nous vous rappelons au {form.phone} pour confirmer.
              {target.releaseDate && ` Livraison prévue dès le ${DATE_FMT.format(new Date(target.releaseDate))}.`}
            </p>
            <button
              onClick={handleClose}
              className="mt-6 px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            <form id="preorder-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 md:px-6 py-5 space-y-4">
              {/* Rappel de l'offre : ce qu'on paiera, et quand on sera livré */}
              <div className="flex items-center gap-4 p-3 bg-zinc-50">
                {target.imageUrl && (
                  <img src={target.imageUrl} alt={target.name} className="w-16 h-16 object-cover shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    {target.compareAtPrice && target.compareAtPrice > target.price && (
                      <span className="text-xs text-zinc-400 line-through">{formatPrice(target.compareAtPrice)}</span>
                    )}
                    <span className="font-semibold">{formatPrice(target.price)}</span>
                  </div>
                  {target.releaseDate && (
                    <div className="mt-1.5">
                      <Countdown releaseDate={target.releaseDate} size="inline" />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Nom complet *">
                  <input required value={form.name} onChange={(e) => set('name', e.target.value)}
                    className={input} placeholder="Awa Koné" autoComplete="name" />
                </Field>
                <Field label="Téléphone *">
                  <input required type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)}
                    className={input} placeholder="07 00 00 00 00" autoComplete="tel" />
                </Field>
              </div>

              <Field label="Email">
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                  className={input} placeholder="pour recevoir la confirmation" autoComplete="email" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                {target.colors && target.colors.length > 0 && (
                  <Field label="Coloris">
                    <select value={form.color} onChange={(e) => set('color', e.target.value)} className={input}>
                      <option value="">— Indifférent —</option>
                      {target.colors.map((c) => (
                        <option key={c.hex} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </Field>
                )}
                <Field label="Quantité">
                  <input type="number" min="1" max="50" value={form.quantity}
                    onChange={(e) => set('quantity', e.target.value)} className={input} />
                </Field>
              </div>

              <Field label="Message">
                <textarea rows={2} value={form.message} onChange={(e) => set('message', e.target.value)}
                  className={`${input} resize-none`} placeholder="Une précision sur votre commande ?" />
              </Field>

              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
              )}

              <p className="text-xs text-zinc-400">
                Aucun débit maintenant. Nous vous rappelons pour confirmer, et le règlement se fait
                à la livraison.
              </p>
            </form>

            {/* Pied figé : le total reste visible pendant la saisie */}
            <div className="border-t border-zinc-100 px-5 md:px-6 py-4">
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                  Total {quantity > 1 && `(${quantity} × ${formatPrice(target.price)})`}
                </span>
                <span className="font-black text-lg">{formatPrice(total)}</span>
              </div>
              <button
                type="submit"
                form="preorder-form"
                disabled={loading}
                className="w-full bg-black text-white text-xs font-bold uppercase tracking-widest py-4 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Envoi…' : 'Envoyer ma précommande'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wide text-zinc-500 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const input =
  'w-full px-3.5 py-2.5 border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-black transition'
