import { useState, useEffect } from 'react'

const slides = [
  {
    eyebrow: 'Slings Built for Match-Day Meetups',
    headline: 'Watch Party\nReady',
    cta: { label: 'Sling It', href: '#' },
    gradient: 'from-zinc-700 via-zinc-800 to-zinc-900',
    btnClass: 'bg-[#FFEA3B] text-zinc-900 hover:bg-yellow-300',
  },
  {
    eyebrow: 'Barrage 18L & 22L Packs',
    headline: 'Built to\nCarry More',
    cta: { label: 'Load it Up', href: '#' },
    gradient: 'from-slate-700 via-slate-800 to-slate-900',
    btnClass: 'bg-[#FFEA3B] text-zinc-900 hover:bg-yellow-300',
  },
  {
    eyebrow: 'Waterproof Gear',
    headline: 'Ride in\nAny Weather',
    cta: { label: 'Shop Waterproof', href: '#' },
    gradient: 'from-sky-800 via-sky-900 to-zinc-900',
    btnClass: 'bg-white text-zinc-900 hover:bg-zinc-100',
  },
]

export default function Hero() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActive(i => (i + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const slide = slides[active]

  return (
    <section
      className={`relative h-[78vh] min-h-[520px] bg-gradient-to-br ${slide.gradient} flex items-end md:items-center transition-all duration-700 overflow-hidden`}
    >
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)' , backgroundSize: '12px 12px' }}
      />

      {/* Content */}
      <div className="relative max-w-[1600px] mx-auto px-5 md:px-12 pb-20 md:pb-0 w-full">
        <p className="text-sm md:text-base font-bold text-white/60 uppercase tracking-widest mb-4 transition-all duration-500">
          {slide.eyebrow}
        </p>
        <h1 className="text-5xl sm:text-6xl md:text-8xl font-black uppercase tracking-tight text-white mb-8 max-w-2xl leading-none whitespace-pre-line">
          {slide.headline}
        </h1>
        <a
          href={slide.cta.href}
          className={`inline-block px-8 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${slide.btnClass}`}
        >
          {slide.cta.label}
        </a>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {slides.map((_, i) => (
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
