import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCatalog } from '../lib/storefront'
import { nameToHandle } from '../data/productDetail'
import { formatPrice } from '../lib/utils'
import type { BagProduct } from '../data/bags'

/** Nombre de suggestions affichées ; au-delà on renvoie vers la page boutique. */
const MAX_RESULTS = 6

interface Props {
  open: boolean
  onClose: () => void
}

/**
 * Recherche du header. Le catalogue complet est déjà servi en un appel par
 * `fetchCatalog` (même source que /products), donc on filtre côté client :
 * les suggestions restent instantanées à la frappe, sans requête par caractère.
 * Le catalogue n'est chargé qu'à la première ouverture, puis gardé en mémoire.
 */
export default function SearchOverlay({ open, onClose }: Props) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  // `null` = catalogue pas encore chargé, ce qui sert aussi d'état « chargement ».
  const [products, setProducts] = useState<BagProduct[] | null>(null)

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    if (products) return
    fetchCatalog()
      .then(setProducts)
      .catch(() => setProducts([]))
  }, [open, products])

  // Échap ferme le panneau, et le fond de page ne défile pas derrière lui.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  const trimmed = query.trim()

  const matches = useMemo(() => {
    if (!products || trimmed.length < 2) return []
    const q = trimmed.toLowerCase()
    return products.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)),
    )
  }, [products, trimmed])

  function close() {
    setQuery('')
    onClose()
  }

  function goToResults() {
    if (!trimmed) return
    navigate(`/products?q=${encodeURIComponent(trimmed)}`)
    close()
  }

  function goToProduct(product: BagProduct) {
    navigate(`/products/${nameToHandle(product.name)}`)
    close()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Voile : un clic à côté ferme la recherche. */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={close}
        aria-hidden="true"
      />

      <div className="relative bg-white border-b border-zinc-200 shadow-lg">
        <div className="max-w-[1600px] mx-auto px-5 md:px-12 py-5">
          <form
            onSubmit={e => {
              e.preventDefault()
              goToResults()
            }}
            className="flex items-center gap-3"
            role="search"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="shrink-0 text-zinc-400"
              aria-hidden="true"
            >
              <circle cx="11" cy="10" r="7" />
              <path d="m16 15 3 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher un produit…"
              aria-label="Rechercher un produit"
              className="flex-1 text-lg md:text-2xl font-bold py-2 focus:outline-none placeholder:text-zinc-300 placeholder:font-normal"
            />
            <button
              type="button"
              onClick={close}
              className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors px-2"
            >
              Fermer
            </button>
          </form>

          {/* Résultats */}
          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            {trimmed.length < 2 ? (
              <p className="text-sm text-zinc-400 py-2">
                Tapez au moins 2 caractères — nom du produit ou mot-clé.
              </p>
            ) : products === null ? (
              <p className="text-sm text-zinc-400 py-2">Recherche…</p>
            ) : matches.length === 0 ? (
              <p className="text-sm text-zinc-500 py-2">
                Aucun produit ne correspond à «&nbsp;{trimmed}&nbsp;».
              </p>
            ) : (
              <>
                <ul className="divide-y divide-zinc-100 border-t border-zinc-100">
                  {matches.slice(0, MAX_RESULTS).map(product => (
                    <li key={product.productId ?? product.id}>
                      <button
                        type="button"
                        onClick={() => goToProduct(product)}
                        className="w-full flex items-center gap-4 py-3 text-left hover:bg-zinc-50 transition-colors px-2 -mx-2"
                      >
                        <div className="w-14 h-14 shrink-0 bg-zinc-100 overflow-hidden">
                          {product.imageUrl && (
                            <img
                              src={product.imageUrl}
                              alt=""
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <span className="flex-1 min-w-0">
                          <span className="block font-bold uppercase text-sm truncate">{product.name}</span>
                          <span className="block text-xs text-zinc-500 mt-0.5">
                            {formatPrice(product.price)}
                            {!product.inStock && ' — épuisé'}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={goToResults}
                  className="mt-4 w-full py-3 border-2 border-black text-sm font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                >
                  {matches.length > 1
                    ? `Voir les ${matches.length} résultats`
                    : 'Voir le résultat'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
