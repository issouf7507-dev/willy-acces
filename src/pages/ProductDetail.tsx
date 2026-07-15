import { useState, useEffect } from 'react'
import { formatPrice } from '../lib/utils'
import { useParams, Link } from 'react-router-dom'
import AnnouncementBar from '../components/AnnouncementBar'
import Header from '../components/Header'
import ProductGallery from '../components/product/ProductGallery'
import ProductInfo from '../components/product/ProductInfo'
import type { ProductDetailData } from '../data/productDetail'
import { fetchProductDetail } from '../lib/storefront'

function Stars({ rating, count }: { rating: number; count: number }) {
  const filled = Math.round(rating)
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <svg key={i} width="10" height="10" viewBox="0 0 15 15" className={i < filled ? 'text-zinc-800' : 'text-zinc-300'} fill="currentColor">
            <path d="M7.5 0L9.586 5.273L15 5.73L10.875 9.445L12.135 15L7.5 12.023L2.865 15L4.125 9.445L0 5.73L5.414 5.273L7.5 0Z" />
          </svg>
        ))}
      </div>
      <span className="text-xs text-zinc-400">({count})</span>
    </div>
  )
}

export default function ProductDetail() {
  const { handle } = useParams<{ handle: string }>()
  const [product, setProduct] = useState<ProductDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setSelectedVariantIndex(0)
    fetchProductDetail(handle ?? '')
      .then(p => { if (active) setProduct(p) })
      .catch(() => { if (active) setProduct(null) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [handle])

  if (loading) {
    return (
      <>
        <AnnouncementBar />
        <Header />
        <div className="min-h-[60vh] flex items-center justify-center px-5">
          <p className="text-sm text-zinc-400">Chargement du produit…</p>
        </div>
      </>
    )
  }

  if (!product) {
    return (
      <>
        <AnnouncementBar />
        <Header />
        <div className="min-h-[60vh] flex items-center justify-center px-5">
          <div className="text-center">
            <h1 className="text-xl font-bold mb-3">Produit introuvable</h1>
            <p className="text-sm text-zinc-500 mb-6">Le produit que vous cherchez n’existe pas.</p>
            <Link to="/collections/bags" className="inline-block bg-black text-white text-sm font-bold uppercase tracking-widest px-6 py-3 hover:bg-zinc-800 transition-colors">
              Voir les sacs
            </Link>
          </div>
        </div>
      </>
    )
  }

  const selectedVariant = product.variants[selectedVariantIndex]
  const activeGradient = { from: selectedVariant.gradientFrom, to: selectedVariant.gradientTo }

  return (
    <>
      <AnnouncementBar />
      <Header />

      {/* Mobile breadcrumb */}
      <div className="lg:hidden px-5 py-3 border-b border-zinc-100">
        <nav className="flex items-center gap-1.5 text-xs text-zinc-500 flex-wrap">
          <Link to="/" className="hover:text-black transition-colors">Accueil</Link>
          <span>/</span>
          <Link to={`/collections/${product.collectionHandle}`} className="hover:text-black transition-colors capitalize">
            {product.collectionName}
          </Link>
          <span>/</span>
          <span className="text-black truncate max-w-[160px]">{product.name}</span>
        </nav>
      </div>

      {/* Main product layout */}
      <div className="lg:grid lg:grid-cols-2">
        {/* LEFT: Gallery column */}
        <div>
          {/* Mobile: title / stars / price shown above gallery */}
          <div className="lg:hidden px-5 py-4 border-b border-zinc-100">
            <h1 className="text-base font-bold uppercase mb-1">{product.name}</h1>
            <div className="flex items-center justify-between">
              <Stars rating={product.rating} count={product.reviews} />
              <div className="flex items-center gap-2">
                {selectedVariant.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price && (
                  <span className="text-xs text-zinc-400 line-through">{formatPrice(selectedVariant.compareAtPrice)}</span>
                )}
                <span className="text-sm font-semibold">{formatPrice(selectedVariant.price)}</span>
              </div>
            </div>
          </div>

          <ProductGallery product={product} activeGradient={activeGradient} />
        </div>

        {/* RIGHT: Info column — sticky on desktop */}
        <div className="lg:sticky lg:top-[70px] lg:self-start lg:max-h-[calc(100vh-70px)] lg:overflow-y-auto scrollbar-hide lg:border-l lg:border-zinc-100">
          <ProductInfo
            product={product}
            selectedVariantIndex={selectedVariantIndex}
            onVariantChange={setSelectedVariantIndex}
          />
        </div>
      </div>

      {/* Mobile sticky ATC bar */}
      <div className="lg:hidden sticky bottom-0 z-30 bg-white border-t border-zinc-100 px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase truncate">{product.name}</p>
          <p className="text-xs text-zinc-500">{formatPrice(selectedVariant.price)} — {selectedVariant.name}</p>
        </div>
        <button
          onClick={() => {
            // Scroll to add to cart button
            document.querySelector<HTMLButtonElement>('[data-pdp-atc]')?.click()
          }}
          className="flex-shrink-0 px-5 py-2.5 text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-zinc-800 transition-colors"
        >
          Ajouter au panier
        </button>
      </div>
    </>
  )
}
