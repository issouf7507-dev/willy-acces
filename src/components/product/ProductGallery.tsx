import { useState, useRef } from 'react'
import type { ProductDetailData } from '../../data/productDetail'

function BagIcon({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="0.6" opacity="0.2">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  )
}

interface ProductGalleryProps {
  product: ProductDetailData
  activeGradient: { from: string; to: string }
}

export default function ProductGallery({ product, activeGradient }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const startXRef = useRef<number | null>(null)

  // Apply active color to first image; rest keep their own gradient
  const images = product.galleryImages.map((img, i) =>
    i === 0
      ? { ...img, gradientFrom: activeGradient.from, gradientTo: activeGradient.to }
      : img
  )

  // Filet de sécurité si le produit change sous nos pieds : un index hérité du
  // produit précédent pointerait dans le vide. Le remontage est assuré par la
  // `key={product.handle}` posée par ProductDetail.
  const safeIndex = Math.min(activeIndex, Math.max(0, images.length - 1))
  const activeImage = images[safeIndex]

  const prev = () => setActiveIndex(Math.max(0, safeIndex - 1))
  const next = () => setActiveIndex(Math.min(images.length - 1, safeIndex + 1))

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startXRef.current === null) return
    const diff = startXRef.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) {
      if (diff > 0) next()
      else prev()
    }
    startXRef.current = null
  }

  return (
    <>
      {/* ── MOBILE: carousel ── */}
      <div
        className="lg:hidden relative select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${safeIndex * 100}%)` }}
          >
            {images.map(img => (
              <div key={img.id} className="flex-shrink-0 w-full aspect-square">
                <div className={`w-full h-full bg-gradient-to-br ${img.gradientFrom} ${img.gradientTo} flex items-center justify-center`}>
                  {img.url ? <img src={img.url} alt={img.alt} className="w-full h-full object-cover" /> : <BagIcon />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dot indicators */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`h-1 rounded-full transition-all duration-200 ${i === safeIndex ? 'bg-white w-5' : 'bg-white/50 w-1.5'}`}
            />
          ))}
        </div>
      </div>

      {/* ── DESKTOP: vignettes + image principale ── */}
      <div className="hidden lg:block">
        {/* Thumbnail strip */}
        <div className="flex gap-1.5 mb-1.5 overflow-x-auto scrollbar-hide px-2 pt-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              className={`flex-shrink-0 w-14 h-14 rounded-sm overflow-hidden border-2 transition-all ${i === safeIndex ? 'border-black' : 'border-transparent opacity-60 hover:opacity-100'}`}
            >
              <div className={`w-full h-full bg-gradient-to-br ${img.gradientFrom} ${img.gradientTo} flex items-center justify-center`}>
                {img.url ? <img src={img.url} alt={img.alt} className="w-full h-full object-cover" /> : <BagIcon size={20} />}
              </div>
            </button>
          ))}
        </div>

        {/* Image principale : c'est elle que les vignettes pilotent. Une grille
            affichant toutes les images donnait l'impression que le clic sur une
            vignette ne faisait rien, faute d'image à changer. */}
        {activeImage && (
          <div className="relative aspect-square overflow-hidden group">
            <div className={`w-full h-full bg-gradient-to-br ${activeImage.gradientFrom} ${activeImage.gradientTo} flex items-center justify-center transition-transform duration-500 group-hover:scale-[1.02]`}>
              {activeImage.url
                ? <img src={activeImage.url} alt={activeImage.alt} className="w-full h-full object-cover" />
                : <BagIcon size={100} />}
            </div>

            {images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  disabled={safeIndex === 0}
                  aria-label="Image précédente"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/85 text-black opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-opacity"
                >
                  ‹
                </button>
                <button
                  onClick={next}
                  disabled={safeIndex === images.length - 1}
                  aria-label="Image suivante"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/85 text-black opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-opacity"
                >
                  ›
                </button>
                <span className="absolute bottom-3 right-3 px-2 py-0.5 text-[11px] tracking-wider bg-black/60 text-white">
                  {safeIndex + 1}/{images.length}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}
