import { useState } from 'react'

export interface Testimonial {
  text: string
  author: string
  rating: number
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex justify-center gap-1 mb-6">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width="16" height="16"
          viewBox="0 0 15 15"
          fill={i < count ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-zinc-800"
        >
          <path d="M7.5 0L9.586 5.273L15 5.73L10.875 9.445L12.135 15L7.5 12.023L2.865 15L4.125 9.445L0 5.73L5.414 5.273L7.5 0Z" />
        </svg>
      ))}
    </div>
  )
}

export default function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  const [active, setActive] = useState(0)

  const prev = () => setActive(i => (i - 1 + testimonials.length) % testimonials.length)
  const next = () => setActive(i => (i + 1) % testimonials.length)

  const t = testimonials[active]

  return (
    <div className="max-w-[900px] mx-auto px-5 md:px-12 py-10 text-center">
      <Stars count={t.rating} />

      <blockquote className="text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-900 mb-5 transition-all duration-300">
        "{t.text}"
      </blockquote>

      <p className="text-sm text-zinc-400 mb-10">— {t.author}</p>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={prev}
          className="w-10 h-10 rounded-full border border-zinc-300 flex items-center justify-center hover:border-black transition-colors"
          aria-label="Previous"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <div className="flex gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? 'w-8 bg-black' : 'w-2 bg-zinc-300'}`}
              aria-label={`Avis ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={next}
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
