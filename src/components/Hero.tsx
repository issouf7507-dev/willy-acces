import { useState, useEffect } from 'react'
import { fetchCarousel, type CarouselSlideApi } from '../lib/storefront'

const staticSlides = [
  {
    eyebrow: 'Des sacoches pour toutes vos sorties',
    headline: 'Prêt pour\nla sortie',
    cta: { label: 'Voir les sacoches', href: '#' },
    gradient: 'from-zinc-700 via-zinc-800 to-zinc-900',
    btnClass: 'bg-[#FFEA3B] text-zinc-900 hover:bg-yellow-300',
  },
  {
    eyebrow: 'Sacs à dos 18L & 22L',
    headline: 'Conçu pour\nen porter plus',
    cta: { label: 'Découvrir', href: '#' },
    gradient: 'from-slate-700 via-slate-800 to-slate-900',
    btnClass: 'bg-[#FFEA3B] text-zinc-900 hover:bg-yellow-300',
  },
  {
    eyebrow: 'Équipement imperméable',
    headline: 'Par tous\nles temps',
    cta: { label: 'Voir l’imperméable', href: '#' },
    gradient: 'from-sky-800 via-sky-900 to-zinc-900',
    btnClass: 'bg-white text-zinc-900 hover:bg-zinc-100',
  },
]

export default function Hero() {
  const [active, setActive] = useState(0)
  const [dbSlides, setDbSlides] = useState<CarouselSlideApi[] | null>(null)

  useEffect(() => {
    fetchCarousel()
      .then((s) => setDbSlides(s.length > 0 ? s : []))
      .catch(() => setDbSlides([]))
  }, [])

  // Slides du back-office s'il y en a, sinon les slides statiques de secours.
  const useDb = dbSlides !== null && dbSlides.length > 0
  const count = useDb ? dbSlides!.length : staticSlides.length

  useEffect(() => {
    setActive(0)
    if (count <= 1) return
    const timer = setInterval(() => setActive(i => (i + 1) % count), 5000)
    return () => clearInterval(timer)
  }, [count])

  const dbSlide = useDb ? dbSlides![active % count] : null
  const staticSlide = staticSlides[active % staticSlides.length]

  return (
    <section
      className={`relative h-[78vh] min-h-[520px] flex items-end md:items-center transition-all duration-700 overflow-hidden ${
        useDb ? 'bg-zinc-900' : `bg-gradient-to-br ${staticSlide.gradient}`
      }`}
    >
      {/* Image de fond (slides du back-office) */}
      {dbSlide && (
        <>
          <img src={dbSlide.imageUrl} alt={dbSlide.altText ?? dbSlide.title ?? ''}
            className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40" />
        </>
      )}

      {/* Subtle texture overlay (fallback statique) */}
      {!useDb && (
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)' , backgroundSize: '12px 12px' }}
        />
      )}

      {/* Content */}
      <div className="relative max-w-[1600px] mx-auto px-5 md:px-12 pb-20 md:pb-0 w-full">
        <p className="text-sm md:text-base font-bold text-white/60 uppercase tracking-widest mb-4 transition-all duration-500">
          {dbSlide ? dbSlide.subtitle : staticSlide.eyebrow}
        </p>
        <h1 className="text-5xl sm:text-6xl md:text-8xl font-black uppercase tracking-tight text-white mb-8 max-w-2xl leading-none whitespace-pre-line">
          {dbSlide ? dbSlide.title : staticSlide.headline}
        </h1>
        {(dbSlide ? dbSlide.linkUrl : true) && (
          <a
            href={dbSlide ? (dbSlide.linkUrl ?? '#') : staticSlide.cta.href}
            className={`inline-block px-8 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${
              useDb ? 'bg-white text-zinc-900 hover:bg-zinc-100' : staticSlide.btnClass
            }`}
          >
            {dbSlide ? 'Découvrir' : staticSlide.cta.label}
          </a>
        )}
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`h-1 rounded-full transition-all duration-300 ${i === active ? 'w-10 bg-white' : 'w-4 bg-white/40'}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 right-8 hidden md:flex flex-col items-center gap-2 text-white/40">
        <span className="text-xs uppercase tracking-widest rotate-90 origin-center translate-y-4">Scroll</span>
      </div>
    </section>
  )
}
