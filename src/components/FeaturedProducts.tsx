import { useRef } from 'react'
import ProductCard, { type Product } from './ProductCard'

interface Props {
  products: Product[]
}

export default function FeaturedProducts({ products }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -440 : 440, behavior: 'smooth' })
  }

  return (
    <div className="max-w-[1600px] mx-auto px-5 md:px-12 pb-10">
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible"
      >
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Scroll buttons */}
      <div className="flex items-center justify-end gap-2 mt-5 lg:hidden">
        <button
          onClick={() => scroll('left')}
          className="w-10 h-10 rounded-full border border-zinc-300 flex items-center justify-center hover:border-black transition-colors"
          aria-label="Previous"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <button
          onClick={() => scroll('right')}
          className="w-10 h-10 rounded-full border border-zinc-300 flex items-center justify-center hover:border-black transition-colors"
          aria-label="Next"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
