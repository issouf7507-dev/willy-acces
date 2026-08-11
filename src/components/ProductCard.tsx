import { useState } from 'react'
import { formatPrice } from '../lib/utils'
import { Link } from 'react-router-dom'
import { useQuickBuy } from '../context/QuickBuyContext'
import { usePreorder } from '../context/PreorderContext'
import { nameToHandle } from '../data/productDetail'
import ProductRibbon from './ProductRibbon'
import Countdown from './preorder/Countdown'

export interface Product {
  id: number
  name: string
  price: number
  /** Prix normal barré, renseigné par l'API tant qu'un tarif daté s'applique. */
  compareAtPrice?: number
  /** Identifiant produit côté API (cuid), nécessaire pour précommander. */
  productId?: string
  /** Produit en précommande *en ce moment* (calculé par l'API). */
  isPreorder?: boolean
  /** Date de sortie ISO, pour le compte à rebours des cartes en précommande. */
  releaseDate?: string
  rating: number
  reviews: number
  colors: string[]
  badge?: string
  imageUrl?: string
}

const GRADIENTS = [
  'from-zinc-700 to-zinc-500',
  'from-slate-600 to-slate-400',
  'from-stone-700 to-stone-500',
  'from-neutral-600 to-neutral-400',
  'from-gray-700 to-gray-500',
  'from-zinc-800 to-zinc-600',
  'from-sky-700 to-sky-500',
  'from-emerald-800 to-emerald-600',
]

function Stars({ rating }: { rating: number }) {
  const filled = Math.round(rating)
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width="10" height="10"
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

export default function ProductCard({ product }: { product: Product }) {
  const [activeColor, setActiveColor] = useState(0)
  const { open } = useQuickBuy()
  const { open: openPreorder } = usePreorder()
  const grad = GRADIENTS[product.id % GRADIENTS.length]
  const [from, to] = grad.split(' ')

  // L'API ne renvoie `compareAtPrice` que pendant une promotion, mais on vérifie
  // qu'il est bien supérieur : un prix barré plus bas afficherait une remise
  // négative.
  const onPromo = !!product.compareAtPrice && product.compareAtPrice > product.price
  const isPreorder = !!product.isPreorder

  const handleQuickBuy = (e: React.MouseEvent) => {
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
        colors: product.colors.map(hex => ({ name: hex, hex })),
      })
      return
    }

    open({
      id: product.id,
      name: product.name,
      price: product.price,
      compareAtPrice: onPromo ? product.compareAtPrice : undefined,
      rating: product.rating,
      reviews: product.reviews,
      gradientFrom: from,
      gradientTo: to,
      colors: product.colors.map(hex => ({
        name: hex,
        hex,
        available: true,
      })),
    })
  }

  return (
    <div className="group w-auto relative">
      {/* Image */}
      <div className="relative overflow-hidden">
        <div className={`aspect-square bg-gradient-to-br ${grad} flex items-center justify-center`}>
          {product.badge && (
            <span className="absolute top-3 left-3 bg-black text-white text-xs font-bold px-2.5 py-1 uppercase tracking-wide z-10">
              {product.badge}
            </span>
          )}
          <ProductRibbon price={product.price} compareAtPrice={product.compareAtPrice} isPreorder={isPreorder} />
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="0.8" opacity="0.25">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          )}
        </div>

        {/* Quick Add - slides up on hover */}
        <div className="absolute bottom-0 left-0 right-0 z-20 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
          <button
            onClick={handleQuickBuy}
            className="w-full bg-black text-white text-xs font-bold uppercase tracking-widest py-3.5 hover:bg-zinc-800 transition-colors"
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
          className="font-bold text-sm leading-snug group-hover:underline after:absolute after:inset-0 after:z-10 after:content-['']"
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

        <div className="flex items-center gap-2">
          {onPromo && (
            <span className="text-xs text-zinc-400 line-through">{formatPrice(product.compareAtPrice!)}</span>
          )}
          {/* Le rouge signale une promotion. Un tarif de précommande est barré
              de la même façon, mais garde la couleur normale : c'est le ruban
              « Précommande » qui porte le message. */}
          <span className={`text-sm font-semibold ${onPromo && !isPreorder ? 'text-red-600' : ''}`}>
            {formatPrice(product.price)}
          </span>
        </div>

        {/* Color swatches */}
        {product.colors.length > 1 && (
          <div className="relative z-20 flex items-center gap-1.5 pt-1 w-fit">
            {product.colors.slice(0, 4).map((color, i) => (
              <button
                key={i}
                onClick={() => setActiveColor(i)}
                title={color}
                className={`w-4 h-4 rounded-full border-2 transition-all ${i === activeColor ? 'border-black scale-110' : 'border-zinc-200'}`}
                style={{ backgroundColor: color }}
              />
            ))}
            {product.colors.length > 4 && (
              <span className="text-xs text-zinc-400 font-medium">+{product.colors.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
