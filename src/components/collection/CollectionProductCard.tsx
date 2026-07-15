import { useState } from 'react'
import { formatPrice } from '../../lib/utils'
import { Link } from 'react-router-dom'
import type { BagProduct } from '../../data/bags'
import { useQuickBuy } from '../../context/QuickBuyContext'
import { nameToHandle } from '../../data/productDetail'

function Stars({ rating }: { rating: number }) {
  const filled = Math.round(rating)
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width="10" height="10" viewBox="0 0 15 15"
          className={i < filled ? 'text-zinc-800' : 'text-zinc-300'}
          fill="currentColor"
        >
          <path d="M7.5 0L9.586 5.273L15 5.73L10.875 9.445L12.135 15L7.5 12.023L2.865 15L4.125 9.445L0 5.73L5.414 5.273L7.5 0Z" />
        </svg>
      ))}
    </div>
  )
}

export default function CollectionProductCard({ product }: { product: BagProduct }) {
  const [activeColor, setActiveColor] = useState(0)
  const [hovered, setHovered] = useState(false)
  const { open } = useQuickBuy()

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    open({
      id: product.id,
      name: product.name,
      price: product.price,
      rating: product.rating,
      reviews: product.reviews,
      gradientFrom: product.gradientFrom,
      gradientTo: product.gradientTo,
      colors: product.colors.map(c => ({
        name: c.name,
        hex: c.hex,
        isPattern: c.isPattern,
        available: true,
      })),
    })
  }

  const maxSwatches = 4

  return (
    <div
      className="group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <div className={`aspect-square bg-gradient-to-br ${product.gradientFrom} ${product.gradientTo} flex items-center justify-center`}>
          {product.badge && (
            <span className="absolute top-3 left-3 bg-black text-white text-xs font-bold px-2.5 py-1 uppercase tracking-wide z-10">
              {product.badge}
            </span>
          )}
          {product.soldOut && (
            <span className="absolute top-3 left-3 bg-black text-white text-xs font-bold px-2.5 py-1 uppercase tracking-wide z-10">
              Épuisé
            </span>
          )}

          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="0.6" opacity="0.2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          )}

          <div className={`absolute inset-0 bg-black/10 transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'}`} />
        </div>

        {/* Quick Add button */}
        <div className={`absolute bottom-0 left-0 right-0 transition-transform duration-200 ${hovered ? 'translate-y-0' : 'translate-y-full'}`}>
          <button
            onClick={handleQuickBuy}
            className="w-full bg-black text-white text-xs font-bold uppercase tracking-widest py-3 hover:bg-zinc-800 transition-colors"
          >
            + Ajout rapide
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 space-y-1">
        <Link to={`/products/${nameToHandle(product.name)}`} className="font-bold text-sm leading-snug hover:underline">
          {product.name}
        </Link>

        <div className="flex items-center gap-2">
          <Stars rating={product.rating} />
          <span className="text-xs text-zinc-400">({product.reviews})</span>
        </div>

        <div className="flex items-center gap-2">
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-xs text-zinc-400 line-through">{formatPrice(product.compareAtPrice)}</span>
          )}
          <span className="text-sm font-semibold">{formatPrice(product.price)}</span>
        </div>

        {/* Swatches */}
        {product.colors.length > 1 && (
          <div className="flex items-center gap-1.5 pt-1">
            {product.colors.slice(0, maxSwatches).map((c, i) => (
              <button
                key={i}
                title={c.name}
                onClick={() => setActiveColor(i)}
                className={`w-4 h-4 rounded-full border-2 transition-all ${i === activeColor ? 'border-black scale-110' : 'border-zinc-200'}`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
            {product.colors.length > maxSwatches && (
              <span className="text-xs text-zinc-400 font-medium">+{product.colors.length - maxSwatches}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
