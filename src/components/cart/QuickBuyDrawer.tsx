import { useState, useEffect } from 'react'
import { formatPrice } from '../../lib/utils'
import { useQuickBuy } from '../../context/QuickBuyContext'
import { useCart } from '../../context/CartContext'

function Stars({ rating, count }: { rating: number; count: number }) {
  const filled = Math.round(rating)
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <svg key={i} width="11" height="11" viewBox="0 0 15 15"
            className={i < filled ? 'text-zinc-800' : 'text-zinc-300'}
            fill="currentColor"
          >
            <path d="M7.5 0L9.586 5.273L15 5.73L10.875 9.445L12.135 15L7.5 12.023L2.865 15L4.125 9.445L0 5.73L5.414 5.273L7.5 0Z" />
          </svg>
        ))}
      </div>
      <span className="text-xs text-zinc-500">({count})</span>
    </div>
  )
}

export default function QuickBuyDrawer() {
  const { product, isOpen, close } = useQuickBuy()
  const { addItem, openCart } = useCart()
  const [selectedColor, setSelectedColor] = useState(0)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      const firstAvailable = product.colors.findIndex(c => c.available !== false)
      setSelectedColor(firstAvailable >= 0 ? firstAvailable : 0)
      setAdded(false)
    }
  }, [product])

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, close])

  const handleAddToCart = () => {
    if (!product) return
    const color = product.colors[selectedColor]
    if (color?.available === false) return

    setAdding(true)
    setTimeout(() => {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        color: color?.name ?? 'Standard',
        gradientFrom: product.gradientFrom,
        gradientTo: product.gradientTo,
      })
      setAdding(false)
      setAdded(true)
      setTimeout(() => {
        close()
        openCart()
        setAdded(false)
      }, 600)
    }, 500)
  }

  const activeColor = product?.colors[selectedColor]
  const activeAvailable = activeColor?.available !== false

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={close}
        />
      )}

      {/* Drawer — slides from bottom */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Achat rapide"
        className={`fixed left-0 right-0 bottom-0 bg-white z-50 rounded-t-2xl shadow-2xl transition-transform duration-300 max-h-[90vh] overflow-y-auto ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {product && (
          <>
            {/* ── HEADER ── */}
            <div className="sticky top-0 bg-white border-b border-zinc-100 px-5 py-4 flex items-center justify-between gap-4 z-10">
              <div className="flex items-center gap-4 min-w-0">
                {/* Product image placeholder */}
                <div className={`w-16 h-16 flex-shrink-0 rounded-sm bg-gradient-to-br ${product.gradientFrom} ${product.gradientTo} flex items-center justify-center`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="0.8" opacity="0.35">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                </div>

                {/* Name + price */}
                <div className="min-w-0">
                  <p className="font-bold text-sm leading-snug truncate">{product.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <span className="text-xs text-zinc-400 line-through">{formatPrice(product.compareAtPrice)}</span>
                    )}
                    <span className="text-sm text-zinc-600">{formatPrice(product.price)}</span>
                  </div>
                </div>
              </div>

              {/* Close */}
              <button
                onClick={close}
                aria-label="Fermer"
                className="flex-shrink-0 p-1.5 hover:opacity-60 transition-opacity"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ── BODY ── */}
            <div className="px-5 py-5 space-y-6">
              {/* Rating */}
              <Stars rating={product.rating} count={product.reviews} />

              {/* Color picker */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-zinc-500">Couleur :</span>
                  <span className="text-sm font-semibold text-zinc-900">
                    {activeColor?.name}
                    {activeColor?.available === false && (
                      <span className="ml-2 text-xs font-normal text-zinc-400">(Épuisé)</span>
                    )}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((color, i) => {
                    const isSelected = i === selectedColor
                    const isUnavailable = color.available === false

                    return (
                      <button
                        key={i}
                        title={color.name}
                        onClick={() => setSelectedColor(i)}
                        disabled={isUnavailable}
                        className={`relative w-7 h-7 rounded-full border-2 transition-all ${
                          isSelected && !isUnavailable
                            ? 'border-black scale-110'
                            : isUnavailable
                            ? 'border-zinc-200 opacity-40 cursor-not-allowed'
                            : 'border-zinc-200 hover:border-zinc-500'
                        }`}
                        style={{
                          backgroundColor: color.isPattern ? undefined : color.hex,
                          backgroundImage: color.isPattern ? `url(${color.hex})` : undefined,
                          backgroundSize: 'cover',
                        }}
                      >
                        {/* Disabled diagonal line */}
                        {isUnavailable && (
                          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span
                              className="absolute w-[130%] h-px bg-zinc-400 rotate-45"
                              style={{ transformOrigin: 'center' }}
                            />
                          </span>
                        )}
                        <span className="sr-only">{color.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-3 pb-safe">
                {/* Add to cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={!activeAvailable || adding}
                  className={`w-full py-4 text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                    added
                      ? 'bg-green-600 text-white'
                      : activeAvailable
                      ? 'bg-zinc-800 text-white hover:bg-black'
                      : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                  }`}
                >
                  {adding ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Ajout…
                    </>
                  ) : added ? (
                    <>
                      <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
                        <path d="M1 7l4.5 4.5L15 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Ajouté !
                    </>
                  ) : activeAvailable ? (
                    'Ajouter au panier'
                  ) : (
                    'Épuisé'
                  )}
                </button>

                {/* Shop Pay shortcut */}
                {activeAvailable && (
                  <button
                    onClick={() => {
                      handleAddToCart()
                    }}
                    className="w-full py-3.5 text-sm font-bold text-white rounded-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#5433EB' }}
                  >
                    <svg width="52" height="14" viewBox="0 0 52 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.84 10.16C3.34 10.16 2.9 10.04 2.52 9.8C2.14 9.56 1.84 9.22 1.64 8.78C1.44 8.34 1.34 7.82 1.34 7.22C1.34 6.62 1.44 6.1 1.64 5.66C1.84 5.22 2.14 4.88 2.52 4.64C2.9 4.4 3.34 4.28 3.84 4.28C4.34 4.28 4.78 4.4 5.16 4.64C5.54 4.88 5.84 5.22 6.04 5.66C6.24 6.1 6.34 6.62 6.34 7.22C6.34 7.82 6.24 8.34 6.04 8.78C5.84 9.22 5.54 9.56 5.16 9.8C4.78 10.04 4.34 10.16 3.84 10.16ZM3.84 9.14C4.18 9.14 4.48 9.06 4.72 8.9C4.96 8.74 5.14 8.52 5.26 8.24C5.38 7.96 5.44 7.62 5.44 7.22C5.44 6.82 5.38 6.48 5.26 6.2C5.14 5.92 4.96 5.7 4.72 5.54C4.48 5.38 4.18 5.3 3.84 5.3C3.5 5.3 3.2 5.38 2.96 5.54C2.72 5.7 2.54 5.92 2.42 6.2C2.3 6.48 2.24 6.82 2.24 7.22C2.24 7.62 2.3 7.96 2.42 8.24C2.54 8.52 2.72 8.74 2.96 8.9C3.2 9.06 3.5 9.14 3.84 9.14Z" fill="white"/>
                      <path d="M7.14 10V4.44H8V5.3H8.06C8.18 5.02 8.36 4.8 8.6 4.64C8.84 4.48 9.14 4.4 9.5 4.4C9.86 4.4 10.16 4.48 10.4 4.64C10.64 4.8 10.82 5.02 10.94 5.3H11C11.12 5.04 11.32 4.82 11.58 4.66C11.84 4.5 12.16 4.4 12.54 4.4C13.02 4.4 13.4 4.56 13.68 4.86C13.96 5.16 14.1 5.6 14.1 6.18V10H13.22V6.22C13.22 5.88 13.14 5.62 12.96 5.44C12.78 5.26 12.54 5.18 12.24 5.18C11.9 5.18 11.64 5.28 11.46 5.48C11.28 5.68 11.18 5.94 11.18 6.26V10H10.3V6.14C10.3 5.84 10.2 5.6 10.02 5.42C9.84 5.24 9.6 5.18 9.3 5.18C9.1 5.18 8.9 5.22 8.72 5.34C8.54 5.46 8.4 5.62 8.3 5.82C8.2 6.02 8.14 6.26 8.14 6.52V10H7.14Z" fill="white"/>
                    </svg>
                    <span className="text-xs">Acheter avec</span>
                  </button>
                )}

                {/* More payment options */}
                {activeAvailable && (
                  <div className="text-center">
                    <button className="text-xs text-zinc-500 underline hover:text-black transition-colors">
                      Plus d’options de paiement
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
