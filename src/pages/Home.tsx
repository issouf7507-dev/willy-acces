import { useState, useEffect } from 'react'
import AnnouncementBar from '../components/AnnouncementBar'
import Header from '../components/Header'
import Hero from '../components/Hero'
import SectionTitle from '../components/SectionTitle'
import CollectionGrid from '../components/CollectionGrid'
import FeaturedProducts from '../components/FeaturedProducts'
import Testimonials from '../components/Testimonials'
import ImageBanner from '../components/ImageBanner'
import Footer from '../components/Footer'
import bannerCollection from '../assets/banner-collection.webp'
import bannerAccessories from '../assets/banner-accessories.webp'
import type { Product } from '../components/ProductCard'
import { fetchFeatured, fetchBagCards, fetchCategories, rootCategories } from '../lib/storefront'

/** Dégradé par catégorie, avec repli cyclique pour toute nouvelle catégorie créée en admin. */
const CATEGORY_GRADIENTS: Record<string, string> = {
  sacs: 'from-zinc-700 to-zinc-900',
  accessoires: 'from-slate-600 to-slate-800',
  'salon-de-beaute': 'from-stone-600 to-stone-900',
}
const FALLBACK_GRADIENTS = [
  'from-zinc-700 to-zinc-900',
  'from-slate-600 to-slate-800',
  'from-stone-600 to-stone-900',
]

const testimonials = [
  { text: "Ce sac est superbe ! Belle taille, fabrication solide, design au top.", author: "Aïcha O.", rating: 5 },
  { text: "La qualité est vraiment au rendez-vous. J'adore ce nouveau sac, il est parfait !", author: "Nadège B.", rating: 4 },
  { text: "J'adore le côté imperméable et la polyvalence de ce sac. Ultra résistant.", author: "Jean H.", rating: 4 },
  { text: "Confort et durabilité incroyables, fonctionnalité parfaite.", author: "Olivier E.", rating: 5 },
  { text: "Je suis impressionné. Livraison rapide et qualité au top. Merci !", author: "Maurice R.", rating: 5 },
]

export default function Home() {
  const [bestsellers, setBestsellers] = useState<Product[]>([])
  const [backpacks, setBackpacks] = useState<Product[]>([])
  const [mainCollections, setMainCollections] = useState<
    { name: string; href: string; gradient: string }[]
  >([])

  useEffect(() => {
    fetchFeatured(8).then(setBestsellers).catch(() => setBestsellers([]))
    fetchBagCards(8).then(setBackpacks).catch(() => setBackpacks([]))
    fetchCategories()
      .then(cats =>
        setMainCollections(
          // Racines seulement : l'API renvoie aussi les sous-catégories à plat.
          rootCategories(cats).slice(0, 3).map((c, i) => ({
            name: c.name,
            href: `/products?category=${encodeURIComponent(c.slug)}`,
            gradient: CATEGORY_GRADIENTS[c.slug] ?? FALLBACK_GRADIENTS[i % FALLBACK_GRADIENTS.length],
          })),
        ),
      )
      .catch(() => setMainCollections([]))
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <AnnouncementBar />
      <Header />

      <main>
        {/* Hero */}
        <Hero />

        {/* Tagline */}
        <div className="py-10 text-center border-b border-zinc-100">
          <p className="text-lg md:text-2xl font-black uppercase tracking-tight text-zinc-900 px-5">
            <strong>Fait pour vos aventures.</strong> Depuis 1995.
          </p>
        </div>

        {/* Main category grid */}
        {mainCollections.length > 0 && (
          <div className="pt-10">
            <CollectionGrid collections={mainCollections} />
          </div>
        )}

        {/* Best sellers */}
        <SectionTitle eyebrow="Les plus portés" subtitle="Nos favoris, adoptés au quotidien." />
        <FeaturedProducts products={bestsellers} />

        {/* Collaboration banner */}
        <ImageBanner
          eyebrow="Toute la boutique"
          title="Portez avec fierté"
          cta={{ label: 'Découvrir la collection', href: '/products' }}
          gradient="from-purple-900 via-zinc-900 to-black"
          image={bannerCollection}
          imageAlt="Randonneur de dos, sac au dos, face à un lac de montagne dans la brume"
        />

        {/* Reviews */}
        <SectionTitle eyebrow="Des milliers d'avis qui confirment la qualité" />
        <Testimonials testimonials={testimonials} />

        {/* Feature collections */}
        {mainCollections.length > 0 && (
          <>
            <SectionTitle eyebrow="Explorer par catégorie" subtitle="Trouvez ce qu'il vous faut, rayon par rayon." />
            <CollectionGrid collections={mainCollections} />
          </>
        )}

        {/* Backpacks */}
        <SectionTitle eyebrow="On assure vos arrières" subtitle="Du bureau au week-end." />
        <FeaturedProducts products={backpacks} />

        {/* Final CTA banner */}
        <ImageBanner
          title="À votre façon"
          subtitle="Le détail qui change tout : nos accessoires pour composer votre style."
          cta={{ label: 'Voir les accessoires', href: '/accessories' }}
          accent
          gradient="from-zinc-700 via-zinc-900 to-black"
          image={bannerAccessories}
          imageAlt="Silhouette en manteau noir dans la rue, sac à main à la main"
        />
      </main>

      <Footer />
    </div>
  )
}
