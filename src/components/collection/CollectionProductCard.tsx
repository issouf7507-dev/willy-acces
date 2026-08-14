import { useState } from 'react'
import { formatPrice } from '../../lib/utils'
import { Link } from 'react-router-dom'
import type { BagProduct } from '../../data/bags'
import { useQuickBuy } from '../../context/QuickBuyContext'
import { usePreorder } from '../../context/PreorderContext'
import { nameToHandle } from '../../data/productDetail'
import ProductRibbon from '../ProductRibbon'
import Countdown from '../preorder/Countdown'
import PreorderPrice from '../preorder/PreorderPrice'

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
  const { open: openPreorder } = usePreorder()

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Un produit pas encore sorti ne s'ajoute pas au panier : il passe par le
    // formulaire de réservation, sans paiement.
    if (isPreorder && product.productId) {
      openPreorder({
        productId: product.productId,
        name: product.name,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        releaseDate: product.releaseDate,
        imageUrl: product.imageUrl,
        colors: product.colors.map(c => ({ name: c.name, hex: c.hex })),
      })
      return
    }

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

  const isPreorder = !!product.isPreorder

  const maxSwatches = 4

  return (
    <div
      className="group relative"
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
          <ProductRibbon price={product.price} compareAtPrice={product.compareAtPrice} isPreorder={isPreorder} />

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
        <div className={`absolute bottom-0 left-0 right-0 z-20 transition-transform duration-200 ${hovered ? 'translate-y-0' : 'translate-y-full'}`}>
          <button
            onClick={handleQuickBuy}
            className="w-full bg-black text-white text-xs font-bold uppercase tracking-widest py-3 hover:bg-zinc-800 transition-colors"
          >
            {isPreorder ? 'Précommander' : '+ Ajout rapide'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 space-y-1">
        {/* Le lien s'étend sur toute la carte (pseudo-élément) : image + infos cliquables */}
        <Link
          to={`/products/${nameToHandle(product.name)}`}
          className="font-bold uppercase text-sm leading-snug group-hover:underline after:absolute after:inset-0 after:z-10 after:content-['']"
        >
          {product.name}
        </Link>

        {/* Sur un produit pas encore sorti, la date de disponibilité prime sur
            la note : le compte à rebours prend la place des étoiles. */}
        {isPreorder && product.releaseDate ? (
          <div className="flex items-center">
            <Countdown releaseDate={product.releaseDate} size="inline" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Stars rating={product.rating} />
            <span className="text-xs text-zinc-400">({product.reviews})</span>
          </div>
        )}

        {/* Une précommande annonce ses deux tarifs étiquetés (ce qu'on paie
            maintenant / ce que ça coûtera à la sortie). Un prix barré donnerait
            à tort le prix normal pour une ancienne offre annulée. */}
        {isPreorder ? (
          <PreorderPrice price={product.price} basePrice={product.basePrice} />
        ) : (
          <div className="flex items-center gap-2">
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-zinc-400 line-through">{formatPrice(product.compareAtPrice)}</span>
            )}
            <span className="text-sm font-semibold">{formatPrice(product.price)}</span>
          </div>
        )}

        {/* Swatches */}
        {product.colors.length > 1 && (
          <div className="relative z-20 flex items-center gap-1.5 pt-1 w-fit">
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
