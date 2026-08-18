import { useState } from 'react'
import { formatPrice } from '../../lib/utils'
import PreorderPrice from '../preorder/PreorderPrice'
import Countdown from '../preorder/Countdown'
import { Link } from 'react-router-dom'
import type { ProductDetailData } from '../../data/productDetail'
import { useCart } from '../../context/CartContext'
import { usePreorder } from '../../context/PreorderContext'
import ProductReviews from './ProductReviews'
import TikTokEmbed from './TikTokEmbed'

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

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
  const { open: openPreorder, add: addPreorder } = usePreorder()
  const [featuresExpanded, setFeaturesExpanded] = useState(false)
  const [sizingOpen, setSizingOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [preorderAdded, setPreorderAdded] = useState(false)

  const variant = product.variants[selectedVariantIndex]

  // Un produit pas encore sorti ne s'ajoute pas au panier : il passe par le
  // formulaire de réservation, sans paiement.
  const preorderTarget = () => ({
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

  /** Réserve tout de suite : le panier s'ouvre sur le formulaire. */
  const handlePreorder = () => openPreorder(preorderTarget())

  /** Met de côté sans ouvrir le panier, pour continuer à parcourir le catalogue. */
  const handleAddPreorder = () => {
    addPreorder(preorderTarget())
    setPreorderAdded(true)
    setTimeout(() => setPreorderAdded(false), 2000)
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
        <span className="text-black uppercase truncate">{product.name}</span>
      </nav>

      {/* Title + Stars + Price — desktop */}
      <div className="hidden lg:block mb-5">
        <div className="flex items-start justify-between gap-4 mb-1">
          <h1 className="text-lg font-bold uppercase leading-tight flex-1">{product.name}</h1>
          <Stars rating={product.rating} count={product.reviews} />
        </div>
        {/* Sur une précommande, les deux tarifs sont étiquetés : ce qu'on paie
            maintenant, et le prix normal qui reprend la main à la sortie. */}
        {product.isPreorder ? (
          <PreorderPrice price={variant.price} basePrice={product.basePrice} size="lg" />
        ) : (
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold tracking-tight">{formatPrice(variant.price)}</span>
            {variant.compareAtPrice && variant.compareAtPrice > variant.price && (
              <span className="text-base text-zinc-400 line-through">{formatPrice(variant.compareAtPrice)}</span>
            )}
          </div>
        )}
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

      {/* Vidéo TikTok du produit, quand un lien est renseigné en back-office.
          La vidéo se joue sur place quand l'URL porte son identifiant ; le lien
          sortant reste affiché dessous (et sert seul pour les liens courts,
          vm.tiktok.com, qui ne permettent pas de reconstruire le lecteur). */}
      {product.tiktokUrl && (
        <div className="mb-4">
          <TikTokEmbed url={product.tiktokUrl} />
          <a
            href={product.tiktokUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-black text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 0 1 0-5.18c.27 0 .53.04.78.12v-3.2a5.8 5.8 0 0 0-.78-.05 5.75 5.75 0 1 0 5.75 5.75V9.01a7.36 7.36 0 0 0 4.3 1.38V7.3a4.29 4.29 0 0 1-3.31-1.48z" />
            </svg>
            Voir sur TikTok
          </a>
        </div>
      )}

      {/* Référence : le SKU réel du produit, généré ou saisi au back-office */}
      {product.sku && (
        <p className="text-xs text-zinc-400 mb-2">Référence : {product.sku}</p>
      )}

      {/* Précommande : le décompte est posé juste au-dessus du bouton, là où se
          prend la décision, et non en marge de la note comme sur les cartes du
          catalogue — la fiche a la place de l'afficher en clair. */}
      {product.isPreorder && product.releaseDate && (
        <div className="mt-5 border border-zinc-200 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-3">
            <span className="text-xs font-bold uppercase tracking-widest">Précommande</span>
            <span className="text-xs text-zinc-500">
              Sortie le {DATE_FMT.format(new Date(product.releaseDate))}
            </span>
          </div>
          <Countdown releaseDate={product.releaseDate} size="sm" />
          <p className="mt-3 text-xs text-zinc-500 leading-relaxed">
            Réservation sans paiement : le produit est expédié à sa sortie.
          </p>
        </div>
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

        {/* Sur une précommande, on peut aussi empiler plusieurs articles avant
            de remplir ses coordonnées une seule fois. */}
        {product.isPreorder && variant.available && (
          <button
            onClick={handleAddPreorder}
            className={`mt-2.5 w-full py-4 text-sm font-bold uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
              preorderAdded
                ? 'border-green-600 text-green-700'
                : 'border-black text-black hover:bg-black hover:text-white'
            }`}
          >
            {preorderAdded ? (
              <>
                <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
                  <path d="M1 6l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Ajouté à la précommande !
              </>
            ) : (
              'Ajouter à la précommande'
            )}
          </button>
        )}
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
