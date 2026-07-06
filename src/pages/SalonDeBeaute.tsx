import { useState, useMemo } from 'react'
import AnnouncementBar from '../components/AnnouncementBar'
import Header from '../components/Header'
import Footer from '../components/Footer'
import QuoteForm from '../components/salon/QuoteForm'
import { SALON_SERVICES, GALLERY_ITEMS, GALLERY_FILTERS } from '../data/salon'

const XOF = new Intl.NumberFormat('fr-FR')

export default function SalonDeBeaute() {
  const [filter, setFilter] = useState('all')

  const gallery = useMemo(
    () => filter === 'all' ? GALLERY_ITEMS : GALLERY_ITEMS.filter(g => g.category === filter),
    [filter]
  )

  return (
    <div className="min-h-screen bg-white">
      <AnnouncementBar />
      <Header />

      {/* Hero */}
      <section className="bg-black text-white overflow-hidden relative">
        <div className="max-w-[1600px] mx-auto px-5 md:px-12 py-16 md:py-28">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-400 mb-4">Notre savoir-faire</p>
          <h1 className="text-5xl md:text-7xl font-black uppercase leading-none mb-6">
            Salon de<br /><span className="text-zinc-400">beauté</span>
          </h1>
          <p className="text-sm text-zinc-300 max-w-md">
            Coiffure, maquillage, onglerie et soins. Découvrez nos réalisations et demandez un
            devis personnalisé pour votre prochaine prestation.
          </p>
          <a
            href="#devis"
            className="inline-block mt-8 px-8 py-4 bg-white text-black text-sm font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
          >
            Demander un devis
          </a>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-900 rounded-full blur-3xl opacity-30 translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-rose-800 rounded-full blur-3xl opacity-20 translate-y-1/2 pointer-events-none" />
      </section>

      {/* Services */}
      <section className="max-w-[1600px] mx-auto px-5 md:px-12 py-14 md:py-20">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Prestations</p>
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">Ce que nous faisons</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SALON_SERVICES.map(s => (
            <div key={s.id} className="group border border-zinc-200 overflow-hidden flex flex-col">
              <div className={`aspect-[16/10] bg-gradient-to-br ${s.gradientFrom} ${s.gradientTo} flex items-center justify-center`}>
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="0.6" opacity="0.25">
                  <circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18" />
                </svg>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-black uppercase text-lg tracking-tight mb-1">{s.name}</h3>
                <p className="text-sm text-zinc-500 leading-snug mb-4 flex-1">{s.description}</p>
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-700">
                  À partir de {XOF.format(s.priceFrom)} F
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Galerie */}
      <section className="bg-zinc-50 border-y border-zinc-100">
        <div className="max-w-[1600px] mx-auto px-5 md:px-12 py-14 md:py-20">
          <div className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Portfolio</p>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">Nos réalisations</h2>
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {GALLERY_FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`text-xs font-bold uppercase tracking-wide px-4 py-2 border transition-colors ${
                  filter === f.id
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-zinc-600 border-zinc-300 hover:border-black'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {gallery.map(item => (
              <div key={item.id} className="group relative aspect-square overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradientFrom} ${item.gradientTo} transition-transform duration-500 group-hover:scale-105`} />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />
                <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <p className="text-white text-xs font-bold uppercase tracking-wide">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Devis */}
      <section id="devis" className="max-w-[1600px] mx-auto px-5 md:px-12 py-14 md:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Intro */}
          <div className="lg:sticky lg:top-24">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Sur mesure</p>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-4">
              Demande de devis
            </h2>
            <p className="text-sm text-zinc-500 max-w-md mb-8">
              Chaque prestation est unique. Répondez à quelques questions et nous préparons un devis
              adapté à votre projet, votre occasion et votre budget.
            </p>
            <ul className="space-y-3">
              {[
                'Réponse personnalisée sous 24 h',
                'Prestation au salon ou à domicile',
                'Devis gratuit et sans engagement',
              ].map(t => (
                <li key={t} className="flex items-start gap-3 text-sm text-zinc-700">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-black mt-0.5 flex-shrink-0">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Form */}
          <QuoteForm />
        </div>
      </section>

      <Footer />
    </div>
  )
}
