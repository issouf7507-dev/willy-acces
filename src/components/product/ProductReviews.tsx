import { useEffect, useState } from 'react'
import {
  fetchProductReviews,
  submitProductReview,
  type ProductReviewApi,
} from '../../lib/storefront'

function StarRow({ rating, size = 11 }: { rating: number; size?: number }) {
  const filled = Math.round(rating)
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 15 15"
          className={i < filled ? 'text-zinc-800' : 'text-zinc-300'}
          fill="currentColor"
        >
          <path d="M7.5 0L9.586 5.273L15 5.73L10.875 9.445L12.135 15L7.5 12.023L2.865 15L4.125 9.445L0 5.73L5.414 5.273L7.5 0Z" />
        </svg>
      ))}
    </div>
  )
}

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

/** Sélecteur de note : cinq étoiles cliquables. */
function RatingPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0)
  const shown = hovered || value
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
      {Array.from({ length: 5 }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1)}
          onMouseEnter={() => setHovered(i + 1)}
          aria-label={`${i + 1} étoile${i > 0 ? 's' : ''}`}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <svg
            width="20" height="20" viewBox="0 0 15 15"
            className={i < shown ? 'text-amber-500' : 'text-zinc-300'}
            fill="currentColor"
          >
            <path d="M7.5 0L9.586 5.273L15 5.73L10.875 9.445L12.135 15L7.5 12.023L2.865 15L4.125 9.445L0 5.73L5.414 5.273L7.5 0Z" />
          </svg>
        </button>
      ))}
      {value > 0 && <span className="ml-1 text-xs text-zinc-500">{value}/5</span>}
    </div>
  )
}

const inputClass =
  'w-full px-3 py-2 border border-zinc-300 text-sm focus:outline-none focus:border-black transition-colors'

/** Formulaire de dépôt d'avis — sans compte, modéré avant publication. */
function ReviewForm({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [authorName, setAuthorName] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  if (sent) {
    return (
      <div className="mt-5 border border-zinc-200 bg-zinc-50 px-4 py-3">
        <p className="text-sm text-zinc-700">
          Merci ! Votre avis a été envoyé et sera publié après validation.
        </p>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-5 text-sm font-bold uppercase tracking-widest border border-black px-5 py-3 hover:bg-black hover:text-white transition-colors"
      >
        Donner mon avis
      </button>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating < 1) { setError('Choisissez une note de 1 à 5 étoiles.'); return }
    if (authorName.trim().length < 2) { setError('Indiquez votre nom.'); return }

    setError('')
    setSending(true)
    try {
      await submitProductReview({
        productId,
        rating,
        authorName: authorName.trim(),
        title: title.trim() || undefined,
        body: body.trim() || undefined,
      })
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Envoi impossible. Réessayez.')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 border border-zinc-200 p-4 space-y-3">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Votre note *</label>
        <RatingPicker value={rating} onChange={setRating} />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" htmlFor="review-name">
          Votre nom *
        </label>
        <input
          id="review-name" value={authorName} onChange={e => setAuthorName(e.target.value)}
          maxLength={60} className={inputClass} placeholder="Aïcha K."
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" htmlFor="review-title">
          Titre
        </label>
        <input
          id="review-title" value={title} onChange={e => setTitle(e.target.value)}
          maxLength={120} className={inputClass} placeholder="Très bonne qualité"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" htmlFor="review-body">
          Votre avis
        </label>
        <textarea
          id="review-body" value={body} onChange={e => setBody(e.target.value)}
          rows={4} maxLength={2000} className={`${inputClass} resize-none`}
          placeholder="Ce que vous avez aimé, ce qui peut être amélioré…"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <p className="text-xs text-zinc-400">
        Votre avis est relu avant publication. Seule l’initiale de votre nom de famille sera affichée.
      </p>

      <div className="flex items-center gap-3">
        <button
          type="submit" disabled={sending}
          className="text-sm font-bold uppercase tracking-widest bg-black text-white px-5 py-3 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
        >
          {sending ? 'Envoi…' : 'Envoyer'}
        </button>
        <button
          type="button" onClick={() => setOpen(false)}
          className="text-sm text-zinc-500 hover:text-black transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}

/**
 * Avis approuvés du produit. C'est la cible de l'ancre `#pdp-reviews` sur
 * laquelle les étoiles du titre renvoient — avant, elles scrollaient vers un
 * conteneur vide.
 */
export default function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<ProductReviewApi[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    fetchProductReviews(productId)
      .then(r => { if (active) setReviews(r) })
      .catch(() => { if (active) setFailed(true) })
    return () => { active = false }
  }, [productId])

  if (failed) return null

  const average = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  return (
    <div id="pdp-reviews" className="border-t border-zinc-100 pt-6 mt-2 scroll-mt-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider">Avis clients</h2>
        {reviews && reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <StarRow rating={average} />
            <span className="text-xs text-zinc-500">
              {average.toFixed(1)} / 5 · {reviews.length} avis
            </span>
          </div>
        )}
      </div>

      {reviews === null ? (
        <p className="text-sm text-zinc-400">Chargement des avis…</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Ce produit n’a pas encore d’avis.
        </p>
      ) : (
        <ul className="space-y-5">
          {reviews.map(r => (
            <li key={r.id} className="border-b border-zinc-100 last:border-0 pb-5 last:pb-0">
              <div className="flex items-center gap-2 mb-1.5">
                <StarRow rating={r.rating} />
                <span className="text-xs font-semibold">{r.author}</span>
                <span className="text-xs text-zinc-400">
                  {dateFmt.format(new Date(r.createdAt))}
                </span>
              </div>
              {r.title && <p className="text-sm font-semibold mb-1">{r.title}</p>}
              {r.body && (
                <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">{r.body}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <ReviewForm productId={productId} />
    </div>
  )
}
