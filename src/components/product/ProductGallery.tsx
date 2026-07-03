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

  const prev = () => setActiveIndex(i => Math.max(0, i - 1))
  const next = () => setActiveIndex(i => Math.min(images.length - 1, i + 1))

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
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {images.map(img => (
              <div key={img.id} className="flex-shrink-0 w-full aspect-square">
                <div className={`w-full h-full bg-gradient-to-br ${img.gradientFrom} ${img.gradientTo} flex items-center justify-center`}>
                  <BagIcon />
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
              className={`h-1 rounded-full transition-all duration-200 ${i === activeIndex ? 'bg-white w-5' : 'bg-white/50 w-1.5'}`}
            />
          ))}
        </div>
      </div>

      {/* ── DESKTOP: 2-column image grid ── */}
      <div className="hidden lg:block">
        {/* Thumbnail strip */}
        <div className="flex gap-1.5 mb-1.5 overflow-x-auto scrollbar-hide px-2 pt-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              className={`flex-shrink-0 w-14 h-14 rounded-sm overflow-hidden border-2 transition-all ${i === activeIndex ? 'border-black' : 'border-transparent opacity-60 hover:opacity-100'}`}
            >
              <div className={`w-full h-full bg-gradient-to-br ${img.gradientFrom} ${img.gradientTo} flex items-center justify-center`}>
                <BagIcon size={20} />
              </div>
            </button>
          ))}
        </div>

        {/* 2-col image grid */}
        <div className="grid grid-cols-2 gap-0.5">
          {images.map((img, i) => (
            <div
              key={img.id}
              onClick={() => setActiveIndex(i)}
              className={`aspect-square cursor-zoom-in relative overflow-hidden group ${i === 0 ? 'col-span-2' : ''}`}
            >
              <div className={`w-full h-full bg-gradient-to-br ${img.gradientFrom} ${img.gradientTo} flex items-center justify-center transition-transform duration-500 group-hover:scale-[1.02]`}>
                <BagIcon size={i === 0 ? 100 : 64} />
              </div>
              {i === activeIndex && (
                <div className="absolute inset-0 ring-2 ring-inset ring-black/10 pointer-events-none" />
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
