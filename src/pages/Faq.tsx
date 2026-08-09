import { useEffect, useState } from 'react'
import AnnouncementBar from '../components/AnnouncementBar'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useSettings } from '../context/SettingsContext'
import { fetchAccordion, type AccordionItemApi } from '../lib/storefront'

/**
 * Foire aux questions — alimentée par /admin/content/faq (table `accordion_items`).
 * Rien n'est codé en dur : sans question publiée, la page renvoie vers le contact.
 */
export default function Faq() {
  const [items, setItems] = useState<AccordionItemApi[] | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const { settings } = useSettings()

  useEffect(() => {
    fetchAccordion()
      .then(setItems)
      .catch(() => setItems([]))
  }, [])

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AnnouncementBar />
      <Header />

      <main className="flex-1">
        <section className="bg-black text-white">
          <div className="max-w-[900px] mx-auto px-5 md:px-12 py-16 md:py-24">
            <p className="text-xs font-bold uppercase tracking-widest text-[#FFEA3B] mb-4">
              Besoin d'aide ?
            </p>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-none">
              Questions
              <br />
              fréquentes
            </h1>
          </div>
        </section>

        <div className="max-w-[900px] mx-auto px-5 md:px-12 py-12 md:py-16">
          {items === null ? (
            <div className="space-y-3" aria-busy="true">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-16 bg-zinc-100 animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-zinc-500 text-center py-10">
              Aucune question publiée pour le moment.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-200 border-y border-zinc-200">
              {items.map((item) => {
                const isOpen = open === item.id
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setOpen(isOpen ? null : item.id)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between gap-6 py-5 text-left group"
                    >
                      <span className="font-black uppercase tracking-tight text-zinc-900 group-hover:text-zinc-600 transition-colors">
                        {item.question}
                      </span>
                      <span
                        className={`shrink-0 text-2xl leading-none text-zinc-400 transition-transform duration-300 ${
                          isOpen ? 'rotate-45' : ''
                        }`}
                        aria-hidden="true"
                      >
                        +
                      </span>
                    </button>
                    <div
                      className={`grid transition-all duration-300 ${
                        isOpen ? 'grid-rows-[1fr] pb-6' : 'grid-rows-[0fr]'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="text-zinc-600 leading-relaxed whitespace-pre-line">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Contact : affiché seulement si un moyen de contact est réglé en back-office. */}
          {(settings.contactEmail || settings.contactPhone) && (
            <div className="mt-14 border border-zinc-200 p-8 text-center">
              <h2 className="font-black uppercase tracking-tight text-zinc-900 mb-2">
                Vous ne trouvez pas votre réponse ?
              </h2>
              <p className="text-sm text-zinc-500 mb-5">Notre équipe vous répond directement.</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {settings.contactEmail && (
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="px-6 py-3 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                  >
                    {settings.contactEmail}
                  </a>
                )}
                {settings.contactPhone && (
                  <a
                    href={`tel:${settings.contactPhone.replace(/\s+/g, '')}`}
                    className="px-6 py-3 border border-zinc-300 text-sm font-bold uppercase tracking-widest hover:border-black transition-colors"
                  >
                    {settings.contactPhone}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
