import { useState } from 'react'
import { formatPrice } from '../../lib/utils'
import type { PreorderProduct } from '../../data/preorders'
import Countdown from './Countdown'

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export default function PreorderCard({ product }: { product: PreorderProduct }) {
  const [hovered, setHovered] = useState(false)
  const released = new Date(product.releaseDate).getTime() <= Date.now()

  return (
    <div
      className="group flex flex-col h-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <div className={`aspect-square bg-gradient-to-br ${product.gradientFrom} ${product.gradientTo} flex items-center justify-center`}>
          <span className="absolute top-3 left-3 bg-white text-black text-xs font-bold px-2.5 py-1 uppercase tracking-wide z-10">
            {released ? 'Disponible' : 'Précommande'}
          </span>

          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="0.6" opacity="0.2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          )}

          {/* Countdown overlay */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur px-3 py-2 rounded shadow-sm">
            <Countdown releaseDate={product.releaseDate} size="sm" />
          </div>

          <div className={`absolute inset-0 bg-black/10 transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'}`} />
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 space-y-1 flex flex-col flex-1">
        <h3 className="font-bold text-sm leading-snug line-clamp-1">{product.name}</h3>
        <p className="text-xs text-zinc-500 leading-snug line-clamp-2 min-h-[2rem]">{product.tagline}</p>

        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-sm font-semibold">{formatPrice(product.price)}</span>
        </div>

        <p className="text-xs text-zinc-400">
          Disponible le {DATE_FMT.format(new Date(product.releaseDate))}
        </p>

        {/* Swatches */}
        {product.colors.length > 1 && (
          <div className="flex items-center gap-1.5 pt-1">
            {product.colors.map((c, i) => (
              <span
                key={i}
                title={c.name}
                className="w-4 h-4 rounded-full border-2 border-zinc-200"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        )}

        {/* Spacer pour aligner le bouton en bas (cartes symétriques) */}
        <div className="flex-1" />

        <button
          className="w-full bg-black text-white text-xs font-bold uppercase tracking-widest py-3 hover:bg-zinc-800 transition-colors"
        >
          {released ? 'Acheter' : 'Précommander'}
        </button>
      </div>
    </div>
  )
}
