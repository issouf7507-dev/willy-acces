import { useState, useEffect, type FormEvent } from 'react'
import { api } from '../../lib/api'
import { formatPrice } from '../../lib/utils'
import { usePreorder, type PreorderItem } from '../../context/PreorderContext'
import { useSettings } from '../../context/SettingsContext'
import { DEFAULT_WHATSAPP_NUMBER, whatsappHref } from '../../lib/whatsapp'
import { WAVE_PAYMENT_URL } from '../../lib/payment'
import { SERVICE_FEE_LABEL, serviceFee, totalWithServiceFee } from '../../lib/fees'
import Countdown from './Countdown'

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/**
 * Panier de réservation des produits pas encore sortis. Volontairement distinct
 * du tunnel de commande : rien n'est payé ni livré maintenant, on collecte de
 * quoi rappeler le client à la sortie. Plusieurs produits partent en une seule
 * demande, pour que le back-office n'ait qu'un statut à suivre.
 */
export default function PreorderFormModal() {
  const { items, isOpen, close, setColor, setQuantity, remove, clear, total } = usePreorder()
  const { settings } = useSettings()

  const [form, setForm] = useState({ name: '', phone: '', deliveryPlace: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  /** Figé avant le vidage du panier : la confirmation doit survivre à `clear()`. */
  const [receipt, setReceipt] = useState<{ total: number; lastRelease?: string }>({ total: 0 })

  // `total` du panier = montant des articles ; c'est le montant frais compris
  // qui est annoncé au client et réglé par Wave.
  const fee = serviceFee(total)
  const grandTotal = totalWithServiceFee(total)

  // La modale reste montée entre deux ouvertures : sans cette remise à zéro,
  // la rouvrir réafficherait la confirmation précédente.
  useEffect(() => {
    if (!isOpen) return
    setError('')
    setDone(false)
  }, [isOpen])

  if (!isOpen) return null

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const handleClose = () => close()

  /** Date de sortie la plus lointaine : c'est elle qui commande la livraison. */
  const lastRelease = items
    .map((i) => i.releaseDate)
    .filter((d): d is string => Boolean(d))
    .sort()
    .at(-1)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/preorders', {
        name: form.name,
        phone: form.phone,
        deliveryPlace: form.deliveryPlace,
        items: items.map((i) => ({
          productId: i.productId,
          color: i.color || undefined,
          quantity: i.quantity,
        })),
      })
      // Le panier est vidé une fois la demande enregistrée, mais `done` garde la
      // confirmation à l'écran — d'où la lecture du téléphone dans `form`.
      setReceipt({ total: grandTotal, lastRelease })
      clear()
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer la précommande")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4">
      <div className="bg-white w-full md:max-w-lg max-h-[92vh] flex flex-col">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-4 px-5 md:px-6 py-4 border-b border-zinc-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Précommande</p>
            <h2 className="font-black uppercase tracking-tight text-lg leading-tight">
              {done ? 'Confirmation' : items.length > 1 ? `${items.length} articles` : 'Ma réservation'}
            </h2>
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
          <div className="overflow-y-auto px-5 md:px-6 py-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="font-black uppercase tracking-tight mb-2">Précommande enregistrée</h3>
              <p className="text-sm text-zinc-500 max-w-xs mx-auto">
                Nous vous rappelons au {form.phone} pour confirmer.
                {receipt.lastRelease &&
                  ` Livraison prévue dès le ${DATE_FMT.format(new Date(receipt.lastRelease))}.`}
              </p>
            </div>

            {/* Paiement d'avance : facultatif, mais c'est ce qui sécurise la
                réservation. Le lien Wave ne porte pas de montant, d'où le
                rappel du total et l'insistance sur la capture d'écran. */}
            <div className="mt-6 border border-zinc-200">
              <div className="flex items-baseline justify-between gap-3 px-4 py-3 border-b border-zinc-100">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                  Montant à régler
                </span>
                <span className="font-black">{formatPrice(receipt.total)}</span>
              </div>

              <div className="p-4">
                <a
                  href={WAVE_PAYMENT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-4 text-sm font-bold uppercase tracking-widest text-black transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#1DC8F0' }}
                >
                  Payer maintenant avec Wave
                </a>

                <div className="mt-3 bg-amber-50 border border-amber-200 p-3">
                  <p className="text-sm font-bold text-amber-900">
                    Important : envoyez-nous la capture du paiement
                  </p>
                  <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                    Si vous payez maintenant, envoyez la capture d'écran sur WhatsApp.
                    Sans elle, nous ne pouvons pas rattacher votre paiement à cette
                    précommande.
                  </p>
                  <a
                    href={whatsappHref(
                      settings.whatsappNumber || DEFAULT_WHATSAPP_NUMBER,
                      `Bonjour, voici la capture de mon paiement Wave pour ma précommande.\n` +
                        `Nom : ${form.name}\nTéléphone : ${form.phone}\n` +
                        `Montant : ${formatPrice(receipt.total)}`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-2.5 text-sm font-bold text-amber-900 underline underline-offset-4 hover:text-amber-950"
                  >
                    Envoyer ma capture sur WhatsApp
                  </a>
                </div>

                <p className="mt-3 text-xs text-zinc-400 leading-relaxed">
                  Le paiement d'avance n'est pas obligatoire : vous pouvez aussi régler
                  à la livraison.
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="mt-5 w-full py-3 border border-zinc-300 text-xs font-bold uppercase tracking-widest hover:bg-zinc-50 transition-colors"
            >
              Fermer
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 md:px-6 py-12 text-center">
            <h3 className="font-black uppercase tracking-tight mb-2">Aucune réservation</h3>
            <p className="text-sm text-zinc-500">
              Ajoutez un produit à venir pour le réserver avant sa sortie.
            </p>
            <button
              onClick={handleClose}
              className="mt-6 px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
            >
              Continuer
            </button>
          </div>
        ) : (
          <>
            <form id="preorder-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 md:px-6 py-5 space-y-5">
              {/* Les articles réservés : coloris et quantité restent modifiables ici */}
              <div className="divide-y divide-zinc-100 border-y border-zinc-100">
                {items.map((item) => (
                  <Line
                    key={item.productId}
                    item={item}
                    onColor={(c) => setColor(item.productId, c)}
                    onQuantity={(q) => setQuantity(item.productId, q)}
                    onRemove={() => remove(item.productId)}
                  />
                ))}
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

              <Field label="Lieu de livraison *">
                <input required value={form.deliveryPlace} onChange={(e) => set('deliveryPlace', e.target.value)}
                  className={input} placeholder="Abidjan, Cocody Riviera 3" autoComplete="street-address" />
              </Field>

              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
              )}

              <p className="text-xs text-zinc-400">
                Aucun débit à la réservation. Nous vous rappelons pour confirmer : vous pourrez
                payer d'avance par Wave ou régler à la livraison.
              </p>
            </form>

            {/* Pied figé : le total reste visible pendant la saisie */}
            <div className="border-t border-zinc-100 px-5 md:px-6 py-4">
              <div className="flex items-baseline justify-between text-sm text-zinc-500">
                <span>Sous-total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex items-baseline justify-between text-sm text-zinc-500 mt-1">
                <span>{SERVICE_FEE_LABEL}</span>
                <span>{formatPrice(fee)}</span>
              </div>
              <div className="flex items-baseline justify-between mt-2 mb-3 pt-2 border-t border-zinc-100">
                <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">Total</span>
                <span className="font-black text-lg">{formatPrice(grandTotal)}</span>
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

function Line({
  item, onColor, onQuantity, onRemove,
}: {
  item: PreorderItem
  onColor: (color: string) => void
  onQuantity: (quantity: number) => void
  onRemove: () => void
}) {
  return (
    <div className="flex gap-3 py-3">
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover shrink-0" />
      ) : (
        <div className="w-16 h-16 bg-zinc-100 shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-tight truncate">{item.name}</p>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Retirer ${item.name}`}
            className="text-zinc-300 hover:text-black transition-colors shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex items-baseline gap-2 mt-0.5">
          {item.compareAtPrice && item.compareAtPrice > item.price && (
            <span className="text-xs text-zinc-400 line-through">{formatPrice(item.compareAtPrice)}</span>
          )}
          <span className="text-sm">{formatPrice(item.price)}</span>
        </div>

        {item.releaseDate && (
          <div className="mt-1">
            <Countdown releaseDate={item.releaseDate} size="inline" />
          </div>
        )}

        <div className="flex items-center gap-2 mt-2">
          {item.colors && item.colors.length > 0 && (
            <select
              value={item.color}
              onChange={(e) => onColor(e.target.value)}
              aria-label={`Coloris pour ${item.name}`}
              className="flex-1 min-w-0 px-2 py-1.5 border border-zinc-200 text-xs focus:outline-none focus:border-black transition"
            >
              <option value="">— Indifférent —</option>
              {item.colors.map((c) => (
                <option key={c.hex} value={c.name}>{c.name}</option>
              ))}
            </select>
          )}
          <div className="flex items-center border border-zinc-200 shrink-0">
            <button
              type="button" onClick={() => onQuantity(item.quantity - 1)}
              aria-label="Diminuer la quantité"
              className="w-7 h-7 text-sm hover:bg-zinc-50 transition-colors"
            >−</button>
            <span className="w-7 text-center text-xs font-semibold">{item.quantity}</span>
            <button
              type="button" onClick={() => onQuantity(item.quantity + 1)}
              aria-label="Augmenter la quantité"
              className="w-7 h-7 text-sm hover:bg-zinc-50 transition-colors"
            >+</button>
          </div>
        </div>
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
