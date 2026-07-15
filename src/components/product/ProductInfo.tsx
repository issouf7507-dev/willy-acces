import { useState } from 'react'
import { formatPrice } from '../../lib/utils'
import { Link } from 'react-router-dom'
import type { ProductDetailData } from '../../data/productDetail'
import { useCart } from '../../context/CartContext'

function Stars({ rating, count }: { rating: number; count: number }) {
  const filled = Math.round(rating)
  return (
    <button className="flex items-center gap-1.5 group" onClick={() => {
      document.getElementById('pdp-reviews')?.scrollIntoView({ behavior: 'smooth' })
    }}>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <svg key={i} width="11" height="11" viewBox="0 0 15 15" className={i < filled ? 'text-zinc-800' : 'text-zinc-300'} fill="currentColor">
            <path d="M7.5 0L9.586 5.273L15 5.73L10.875 9.445L12.135 15L7.5 12.023L2.865 15L4.125 9.445L0 5.73L5.414 5.273L7.5 0Z" />
          </svg>
        ))}
      </div>
      <span className="text-xs text-zinc-500 group-hover:underline">({count})</span>
    </button>
  )
}

function TruckIcon() {
  return (
    <svg width="20" height="18" viewBox="0 0 256 200" fill="none" className="flex-shrink-0 text-zinc-500">
      <path d="M232 8H88C83.6 8 80 11.6 80 16V128H16C11.6 128 8 131.6 8 136V176C8 180.4 11.6 184 16 184H48C52.4 200 66.4 208 80 208S107.6 200 112 184H176C180.4 200 194.4 208 208 208S235.6 200 240 184H248C252.4 184 256 180.4 256 176V72L232 8ZM80 192C71.2 192 64 184.8 64 176S71.2 160 80 160 96 167.2 96 176 88.8 192 80 192ZM208 192C199.2 192 192 184.8 192 176S199.2 160 208 160 224 167.2 224 176 216.8 192 208 192ZM240 152C235.6 152 231.6 153.6 228.4 156.4 225.2 158.4 222.8 161.2 221.6 164H178.4C177.2 161.2 174.8 158.4 171.6 156.4 168.4 153.6 164.4 152 160 152H112V32H224L248 96V164H242.4C241.2 161.2 238.8 158.4 235.6 156.4Z" fill="currentColor" fillOpacity="0.5"/>
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="flex-shrink-0 text-zinc-500">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function ShopPayLogo() {
  return (
    <svg width="80" height="20" viewBox="0 0 80 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.5 14.5C5.8 14.5 4 12.8 4 10.2C4 7.6 5.8 5.9 8.5 5.9C10.1 5.9 11.4 6.6 12.1 7.8L10.6 8.7C10.2 8 9.4 7.5 8.5 7.5C6.8 7.5 5.7 8.6 5.7 10.2C5.7 11.8 6.8 12.9 8.5 12.9C9.4 12.9 10.2 12.4 10.6 11.7L12.1 12.6C11.4 13.8 10.1 14.5 8.5 14.5Z" fill="white"/>
      <path d="M17.5 8.1C16.7 8.1 16.1 8.4 15.6 9V5.5H14V14.4H15.6V13.6C16.1 14.2 16.7 14.5 17.5 14.5C19.3 14.5 20.6 13.1 20.6 11.3C20.6 9.5 19.3 8.1 17.5 8.1ZM17.2 13C16.1 13 15.5 12.2 15.5 11.3C15.5 10.4 16.1 9.6 17.2 9.6C18.3 9.6 18.9 10.4 18.9 11.3C18.9 12.2 18.3 13 17.2 13Z" fill="white"/>
      <path d="M26 8.1C24.1 8.1 22.8 9.5 22.8 11.3C22.8 13.1 24.1 14.5 26 14.5C27.9 14.5 29.2 13.1 29.2 11.3C29.2 9.5 27.9 8.1 26 8.1ZM26 13C24.9 13 24.4 12.2 24.4 11.3C24.4 10.4 24.9 9.6 26 9.6C27.1 9.6 27.6 10.4 27.6 11.3C27.6 12.2 27.1 13 26 13Z" fill="white"/>
      <path d="M33.4 8.2H31.8V14.4H33.4V11.2C33.4 10.2 34 9.7 34.8 9.7C35.6 9.7 36.1 10.2 36.1 11.2V14.4H37.7V11C37.7 9.3 36.8 8.1 35.2 8.1C34.4 8.1 33.8 8.5 33.4 9V8.2Z" fill="white"/>
      <path d="M43 8.1C41.1 8.1 40.3 9 40.3 10.1C40.3 12.8 44.2 11.9 44.2 13.1C44.2 13.5 43.8 13.8 43.1 13.8C42.3 13.8 41.5 13.4 41 12.8L40 13.8C40.7 14.5 41.8 14.9 43 14.9C44.7 14.9 45.8 14 45.8 12.8C45.8 10 41.9 11 41.9 9.8C41.9 9.4 42.3 9.1 43 9.1C43.7 9.1 44.4 9.4 44.8 9.9L45.8 9C45.2 8.4 44.2 8.1 43 8.1Z" fill="white"/>
      <path d="M50 11.3L52.8 8.2H51L49 10.5V5.5H47.4V14.4H49V12L51.1 14.4H53L50 11.3Z" fill="white"/>
      <path d="M56.5 5.5L53.5 14.4H55.1L55.8 12.3H58.5L59.2 14.4H60.9L57.9 5.5H56.5ZM56.2 11L57.2 8L58.2 11H56.2Z" fill="white"/>
      <path d="M67.5 8.2H65.9V9C65.4 8.4 64.8 8.1 64 8.1C62.2 8.1 60.9 9.5 60.9 11.3C60.9 13.1 62.2 14.5 64 14.5C64.8 14.5 65.4 14.2 65.9 13.6V14.4C65.9 15.5 65.2 16.1 64.1 16.1C63.2 16.1 62.5 15.7 62.1 15L60.7 15.9C61.4 17 62.6 17.6 64.1 17.6C66.1 17.6 67.5 16.4 67.5 14.4V8.2ZM64.3 13C63.2 13 62.6 12.2 62.6 11.3C62.6 10.4 63.2 9.6 64.3 9.6C65.4 9.6 66 10.4 66 11.3C66 12.2 65.4 13 64.3 13Z" fill="white"/>
    </svg>
  )
}

interface ProductInfoProps {
  product: ProductDetailData
  selectedVariantIndex: number
  onVariantChange: (i: number) => void
}

export default function ProductInfo({ product, selectedVariantIndex, onVariantChange }: ProductInfoProps) {
  const { addItem } = useCart()
  const [featuresExpanded, setFeaturesExpanded] = useState(false)
  const [sizingOpen, setSizingOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  const variant = product.variants[selectedVariantIndex]

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
        <div className="flex items-center gap-2.5">
          {variant.compareAtPrice && variant.compareAtPrice > variant.price && (
            <span className="text-sm text-zinc-400 line-through">{formatPrice(variant.compareAtPrice)}</span>
          )}
          <span className="text-base font-semibold">{formatPrice(variant.price)}</span>
        </div>
      </div>

      {/* Color picker */}
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

      {/* CTA buttons */}
      <div className="space-y-2.5 mb-6">
        <button
          onClick={handleAddToCart}
          disabled={!variant.available || adding}
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
          ) : variant.available ? (
            'Ajouter au panier'
          ) : (
            'Épuisé'
          )}
        </button>

        {variant.available && (
          <button
            onClick={handleAddToCart}
            className="w-full py-3.5 flex items-center justify-center gap-2 rounded-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#5433EB' }}
          >
            <span className="text-xs text-white font-medium">Acheter avec</span>
            <ShopPayLogo />
          </button>
        )}

        {variant.available && (
          <p className="text-center text-xs text-zinc-400">
            Ou 4 paiements sans frais de{' '}
            <span className="font-semibold text-zinc-600">{formatPrice(variant.price / 4)}</span>{' '}
            avec{' '}
            <span className="font-semibold text-zinc-600">Mobile Money</span>
          </p>
        )}
      </div>

      {/* Trust badges */}
      <div className="border-t border-b border-zinc-100 py-4 mb-6 space-y-3">
        <div className="flex items-center gap-3">
          <TruckIcon />
          <p className="text-xs text-zinc-500">Livraison offerte dès 50 000 FCFA et retours sous 30 jours.</p>
        </div>
        <div className="flex items-center gap-3">
          <ShieldIcon />
          <p className="text-xs text-zinc-500">Tous nos sacs sont garantis à vie.</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-zinc-600 leading-relaxed mb-5">{product.description}</p>

      {/* Features */}
      <div className="mb-2">
        <ul className="space-y-2 mb-3">
          {product.features.map((f, i) => (
            <li key={i} className="text-sm text-zinc-600 flex gap-2.5 items-start">
              <span className="mt-1.5 w-1 h-1 bg-zinc-400 rounded-full flex-shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        {featuresExpanded && (
          <>
            <ul className="space-y-2 mb-3">
              {product.extendedFeatures.map((f, i) => (
                <li key={i} className="text-sm text-zinc-600 flex gap-2.5 items-start">
                  <span className="mt-1.5 w-1 h-1 bg-zinc-400 rounded-full flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-zinc-400 mb-2">Référence : {product.sku}</p>
          </>
        )}

        <button
          onClick={() => setFeaturesExpanded(v => !v)}
          className="text-sm text-zinc-500 hover:text-black transition-colors font-medium"
        >
          {featuresExpanded ? '- Voir moins' : '+ Voir plus'}
        </button>
      </div>

      {/* Sizing accordion */}
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
            <li className="text-sm text-zinc-600">Volume : {product.sizing.volume}</li>
            <li className="text-sm text-zinc-600">Dimensions : {product.sizing.dimensions}</li>
            <li className="text-sm text-zinc-600">Poids : {product.sizing.weight}</li>
            {product.sizing.deviceSleeve && (
              <li className="text-sm text-zinc-600">Compartiment ordinateur : {product.sizing.deviceSleeve}</li>
            )}
            {product.sizing.waterBottlePocket && (
              <li className="text-sm text-zinc-600">Poche bouteille : {product.sizing.waterBottlePocket}</li>
            )}
            <li className="text-sm text-zinc-500 pt-1">Nettoyage local, séchage à l’air libre.</li>
          </ul>
        )}
      </div>

      {/* Reviews anchor */}
      <div id="pdp-reviews" />
    </div>
  )
}
