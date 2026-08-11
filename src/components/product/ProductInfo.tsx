import { useState } from 'react'
import { formatPrice } from '../../lib/utils'
import { Link } from 'react-router-dom'
import type { ProductDetailData } from '../../data/productDetail'
import { useCart } from '../../context/CartContext'
import { usePreorder } from '../../context/PreorderContext'
import ProductReviews from './ProductReviews'

/**
 * Note du produit. Sans avis approuvé, cinq étoiles grises laissaient croire à
 * une note de 0/5 : on affiche alors un simple lien vers la section d'avis.
 */
function Stars({ rating, count }: { rating: number; count: number }) {
  const filled = Math.round(rating)
  const goToReviews = () =>
    document.getElementById('pdp-reviews')?.scrollIntoView({ behavior: 'smooth' })

  if (count === 0) {
    return (
      <button onClick={goToReviews} className="text-xs text-zinc-400 hover:underline whitespace-nowrap">
        Aucun avis
      </button>
    )
  }

  return (
    <button className="flex items-center gap-1.5 group" onClick={goToReviews}>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <svg key={i} width="11" height="11" viewBox="0 0 15 15" className={i < filled ? 'text-zinc-800' : 'text-zinc-300'} fill="currentColor">
            <path d="M7.5 0L9.586 5.273L15 5.73L10.875 9.445L12.135 15L7.5 12.023L2.865 15L4.125 9.445L0 5.73L5.414 5.273L7.5 0Z" />
          </svg>
        ))}
      </div>
      <span className="text-xs text-zinc-500 group-hover:underline">
        {rating.toFixed(1)} ({count})
      </span>
    </button>
  )
}

interface ProductInfoProps {
  product: ProductDetailData
  selectedVariantIndex: number
  onVariantChange: (i: number) => void
}

export default function ProductInfo({ product, selectedVariantIndex, onVariantChange }: ProductInfoProps) {
  const { addItem } = useCart()
  const { open: openPreorder } = usePreorder()
  const [featuresExpanded, setFeaturesExpanded] = useState(false)
  const [sizingOpen, setSizingOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  const variant = product.variants[selectedVariantIndex]

  // Un produit pas encore sorti ne s'ajoute pas au panier : il passe par le
  // formulaire de réservation, sans paiement.
  const handlePreorder = () => {
    openPreorder({
      productId: product.productId,
      name: product.name,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      releaseDate: product.releaseDate,
      imageUrl: product.imageUrl,
      colors: product.hasColorVariants
        ? product.variants.map(v => ({ name: v.name, hex: v.hex }))
        : undefined,
      defaultColor: product.hasColorVariants ? variant.name : undefined,
    })
  }

  const handleAddToCart = () => {
    if (!variant.available || adding) return
    setAdding(true)
    setTimeout(() => {
      addItem({
        id: product.id,
        name: product.name,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        color: variant.name,
        gradientFrom: variant.gradientFrom,
        gradientTo: variant.gradientTo,
      })
      setAdding(false)
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    }, 500)
  }

  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8">
      {/* Breadcrumb — desktop only */}
      <nav className="hidden lg:flex items-center gap-1.5 text-xs text-zinc-500 mb-5 flex-wrap">
        <Link to="/" className="hover:text-black transition-colors">Accueil</Link>
        <span>/</span>
        <Link to={`/collections/${product.collectionHandle}`} className="hover:text-black transition-colors capitalize">
          {product.collectionName}
        </Link>
        <span>/</span>
        <span className="text-black truncate">{product.name}</span>
      </nav>

      {/* Title + Stars + Price — desktop */}
      <div className="hidden lg:block mb-5">
        <div className="flex items-start justify-between gap-4 mb-1">
          <h1 className="text-lg font-bold uppercase leading-tight flex-1">{product.name}</h1>
          <Stars rating={product.rating} count={product.reviews} />
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold tracking-tight">{formatPrice(variant.price)}</span>
          {variant.compareAtPrice && variant.compareAtPrice > variant.price && (
            <span className="text-base text-zinc-400 line-through">{formatPrice(variant.compareAtPrice)}</span>
          )}
        </div>
      </div>

      {/* Color picker — seulement si le produit déclare de vrais coloris.
          Sinon on affichait « Couleur : One Color » avec une pastille inventée. */}
      {product.hasColorVariants ? (
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-sm text-zinc-500">Couleur :</span>
          <span className="text-sm font-semibold">{variant.name}</span>
          {!variant.available && (
            <span className="text-xs text-zinc-400">(Épuisé)</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {product.variants.map((v, i) => {
            const selected = i === selectedVariantIndex
            const unavailable = !v.available
            return (
              <button
                key={v.id}
                onClick={() => !unavailable && onVariantChange(i)}
                title={v.name}
                className={`relative w-8 h-8 rounded-full border-2 transition-all ${
                  selected && !unavailable
                    ? 'border-black scale-110'
                    : unavailable
                    ? 'border-zinc-200 opacity-40 cursor-not-allowed'
                    : 'border-zinc-300 hover:border-zinc-600'
                }`}
                style={{ backgroundColor: v.hex }}
              >
                {unavailable && (
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-full">
                    <span className="absolute w-[130%] h-px bg-zinc-400 rotate-45" />
                  </span>
                )}
                <span className="sr-only">{v.name}</span>
              </button>
            )
          })}
        </div>
      </div>
      ) : null}

      {/* Related sizes */}
      {product.relatedSizes && product.relatedSizes.length > 0 && (
        <div className="flex items-center gap-4 mb-6">
          <span className="text-sm text-zinc-500">Taille :</span>
          <div className="flex gap-3">
            {product.relatedSizes.map(s => (
              <Link
                key={s.handle}
                to={`/products/${s.handle}`}
                className={`text-sm font-medium pb-0.5 border-b-2 transition-colors ${
                  s.handle === product.handle
                    ? 'border-black text-black'
                    : 'border-transparent text-zinc-400 hover:text-black hover:border-zinc-300'
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Description — celle saisie dans le back-office, rien d'autre */}
      {product.description && (
        <p className="text-sm text-zinc-600 leading-relaxed mb-5 whitespace-pre-line">
          {product.description}
        </p>
      )}

      {/* Caractéristiques (facultatives, via metadata du produit) */}
      {product.features.length > 0 && (
        <div className="mb-2">
          <ul className="space-y-2 mb-3">
            {product.features.map((f, i) => (
              <li key={i} className="text-sm text-zinc-600 flex gap-2.5 items-start">
                <span className="mt-1.5 w-1 h-1 bg-zinc-400 rounded-full flex-shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          {featuresExpanded && product.extendedFeatures.length > 0 && (
            <ul className="space-y-2 mb-3">
              {product.extendedFeatures.map((f, i) => (
                <li key={i} className="text-sm text-zinc-600 flex gap-2.5 items-start">
                  <span className="mt-1.5 w-1 h-1 bg-zinc-400 rounded-full flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}

          {product.extendedFeatures.length > 0 && (
            <button
              onClick={() => setFeaturesExpanded(v => !v)}
              className="text-sm text-zinc-500 hover:text-black transition-colors font-medium"
            >
              {featuresExpanded ? '- Voir moins' : '+ Voir plus'}
            </button>
          )}
        </div>
      )}

      {/* Référence : le SKU réel du produit, généré ou saisi au back-office */}
      {product.sku && (
        <p className="text-xs text-zinc-400 mb-2">Référence : {product.sku}</p>
      )}

      {/* Ajout au panier — placé après la description et la référence */}
      <div className="mt-5 mb-6">
        <button
          onClick={product.isPreorder ? handlePreorder : handleAddToCart}
          disabled={!variant.available || adding}
          data-pdp-atc
          className={`w-full py-4 text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            added
              ? 'bg-green-600 text-white'
              : !variant.available
              ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
              : ''
          }`}
          style={
            variant.available && !added
              ? { backgroundColor: '#FEEAB9', color: '#111' }
              : undefined
          }
        >
          {adding ? (
            <>
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Ajout…
            </>
          ) : added ? (
            <>
              <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
                <path d="M1 6l4 4 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Ajouté au panier !
            </>
          ) : !variant.available ? (
            'Épuisé'
          ) : product.isPreorder ? (
            'Précommander'
          ) : (
            'Ajouter au panier'
          )}
        </button>
      </div>

      {/* Dimensions & matériaux — uniquement si renseignés */}
      {product.sizing && (
        <div className="border-t border-zinc-100 mt-5">
          <button
            onClick={() => setSizingOpen(v => !v)}
            className="w-full py-4 flex items-center justify-between text-sm font-semibold hover:opacity-70 transition-opacity"
          >
            <span>Dimensions & Matériaux</span>
            <svg
              width="10" height="6" viewBox="0 0 10 6" fill="none"
              className={`transition-transform duration-200 ${sizingOpen ? 'rotate-180' : ''}`}
            >
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {sizingOpen && (
            <ul className="pb-5 space-y-1.5">
              {product.sizing.volume && (
                <li className="text-sm text-zinc-600">Volume : {product.sizing.volume}</li>
              )}
              {product.sizing.dimensions && (
                <li className="text-sm text-zinc-600">Dimensions : {product.sizing.dimensions}</li>
              )}
              {product.sizing.weight && (
                <li className="text-sm text-zinc-600">Poids : {product.sizing.weight}</li>
              )}
              {product.sizing.deviceSleeve && (
                <li className="text-sm text-zinc-600">Compartiment ordinateur : {product.sizing.deviceSleeve}</li>
              )}
              {product.sizing.waterBottlePocket && (
                <li className="text-sm text-zinc-600">Poche bouteille : {product.sizing.waterBottlePocket}</li>
              )}
            </ul>
          )}
        </div>
      )}

      {/* Avis clients — cible de l'ancre #pdp-reviews */}
      <ProductReviews productId={product.productId} />
    </div>
  )
}
