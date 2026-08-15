import { useMemo, useState, useEffect } from 'react'
import AnnouncementBar from '../components/AnnouncementBar'
import Header from '../components/Header'
import Footer from '../components/Footer'
import PreorderCard from '../components/preorder/PreorderCard'
import { fetchPreorders } from '../lib/storefront'
import type { PreorderProduct } from '../data/preorders'
import { useSeo } from '../lib/seo'

export default function Preorders() {
  useSeo({
    title: 'Précommandes',
    description:
      'Réservez les produits à venir sans payer maintenant : livraison le jour de la sortie.',
    canonicalPath: '/collections/produits-a-venir',
  })
  const [products, setProducts] = useState<PreorderProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPreorders()
      .then(setProducts)
      .catch(() => setError('Impossible de charger les précommandes.'))
      .finally(() => setLoading(false))
  }, [])

  // Trier par date de sortie (le plus proche en premier)
  const sorted = useMemo(
    () => [...products].sort((a, b) => +new Date(a.releaseDate) - +new Date(b.releaseDate)),
    [products]
  )

  return (
    <div className="min-h-screen bg-white">
      <AnnouncementBar />
      <Header />

      {/* Hero */}
      <section className="bg-black text-white overflow-hidden relative">
        <div className="max-w-[1600px] mx-auto px-5 md:px-12 py-16 md:py-24">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-400 mb-4">Bientôt disponible</p>
          <h1 className="text-5xl md:text-7xl font-black uppercase leading-none mb-4">
            Précommandes
          </h1>
          <p className="text-sm text-zinc-400 max-w-md mt-6">
            {products.length} produits à venir. Réservez le vôtre dès maintenant et soyez livré dès sa sortie.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-zinc-800 rounded-full blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-zinc-700 rounded-full blur-3xl opacity-30 translate-y-1/2 pointer-events-none" />
      </section>

      {/* États de chargement / erreur / vide */}
      {loading && (
        <div className="max-w-[1600px] mx-auto px-5 md:px-12 py-24 text-center text-sm text-zinc-400">
          Chargement des précommandes…
        </div>
      )}
      {!loading && error && (
        <div className="max-w-[1600px] mx-auto px-5 md:px-12 py-24 text-center text-sm text-red-600">
          {error}
        </div>
      )}
      {!loading && !error && products.length === 0 && (
        <div className="max-w-[1600px] mx-auto px-5 md:px-12 py-24 text-center text-sm text-zinc-400">
          Aucune précommande pour le moment.
        </div>
      )}

      {/* Grille de toutes les précommandes */}
      {sorted.length > 0 && (
        <section className="max-w-[1600px] mx-auto px-5 md:px-12 py-10 md:py-14">
          <h2 className="text-xl font-black uppercase tracking-tight mb-8">Toutes les précommandes</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-12">
            {sorted.map(product => (
              <PreorderCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Bandeau bas */}
      <section className="bg-zinc-50 border-t border-zinc-100">
        <div className="max-w-[1600px] mx-auto px-5 md:px-12 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1">Comment ça marche ?</p>
            <h3 className="text-2xl font-black uppercase">Réservez, on vous livre à la sortie</h3>
          </div>
          <p className="text-sm text-zinc-500 max-w-sm">
            Aucun débit avant l'expédition. Vous êtes prévenu par email dès que votre précommande est disponible.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
