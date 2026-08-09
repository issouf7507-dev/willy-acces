import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchCarousel, type CarouselSlideApi } from '../lib/storefront'

/**
 * Bandeau d'accueil. 100 % piloté par le back-office (/admin/content/carousel) :
 * aucune slide n'est codée en dur. Tant qu'aucune slide n'est publiée, on affiche
 * une accroche neutre qui invite à la boutique plutôt qu'un contenu inventé.
 */
export default function Hero() {
  const [active, setActive] = useState(0)
  const [slides, setSlides] = useState<CarouselSlideApi[] | null>(null)

  useEffect(() => {
    fetchCarousel()
      .then(setSlides)
      .catch(() => setSlides([]))
  }, [])

  const count = slides?.length ?? 0

  useEffect(() => {
    setActive(0)
    if (count <= 1) return
    const timer = setInterval(() => setActive((i) => (i + 1) % count), 5000)
    return () => clearInterval(timer)
  }, [count])

  // Chargement en cours : bloc sombre de la bonne hauteur, pour éviter que la
  // page ne saute quand les slides arrivent.
  if (slides === null) {
    return <section className="h-[78vh] min-h-[520px] bg-zinc-900 animate-pulse" />
  }

  if (count === 0) return <HeroEmpty />

  const slide = slides[active % count]!

  return (
    <section className="relative h-[78vh] min-h-[520px] flex items-end md:items-center overflow-hidden bg-zinc-900">
      <img
        src={slide.imageUrl}
        alt={slide.altText ?? slide.title ?? ''}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative max-w-[1600px] mx-auto px-5 md:px-12 pb-20 md:pb-0 w-full">
        {slide.subtitle && (
          <p className="text-sm md:text-base font-bold text-white/60 uppercase tracking-widest mb-4 transition-all duration-500">
            {slide.subtitle}
          </p>
        )}
        {slide.title && (
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black uppercase tracking-tight text-white mb-8 max-w-2xl leading-none whitespace-pre-line">
            {slide.title}
          </h1>
        )}
        {slide.linkUrl && (
          <a
            href={slide.linkUrl}
            className="inline-block px-8 py-4 text-sm font-bold uppercase tracking-widest transition-colors bg-white text-zinc-900 hover:bg-zinc-100"
          >
            Découvrir
          </a>
        )}
      </div>

      {count > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActive(i)}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === active ? 'w-10 bg-white' : 'w-4 bg-white/40'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      <div className="absolute bottom-8 right-8 hidden md:flex flex-col items-center gap-2 text-white/40">
        <span className="text-xs uppercase tracking-widest rotate-90 origin-center translate-y-4">
          Scroll
        </span>
      </div>
    </section>
  )
}

/** Aucune slide publiée : accroche sobre, sans contenu marketing inventé. */
function HeroEmpty() {
  return (
    <section className="relative h-[78vh] min-h-[520px] flex items-center overflow-hidden bg-zinc-900">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)',
          backgroundSize: '12px 12px',
        }}
      />
      <div className="relative max-w-[1600px] mx-auto px-5 md:px-12 w-full">
        <p className="text-sm md:text-base font-bold text-white/60 uppercase tracking-widest mb-4">
          Willy Accessoire
        </p>
        <h1 className="text-5xl sm:text-6xl md:text-8xl font-black uppercase tracking-tight text-white mb-8 max-w-2xl leading-none">
          La boutique
        </h1>
        <Link
          to="/products"
          className="inline-block px-8 py-4 text-sm font-bold uppercase tracking-widest transition-colors bg-[#FFEA3B] text-zinc-900 hover:bg-yellow-300"
        >
          Voir le catalogue
        </Link>
      </div>
    </section>
  )
}
