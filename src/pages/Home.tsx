import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AnnouncementBar from "../components/AnnouncementBar";
import Header from "../components/Header";
import Hero from "../components/Hero";
import SectionTitle from "../components/SectionTitle";
import CollectionGrid from "../components/CollectionGrid";
import FeaturedProducts from "../components/FeaturedProducts";
import Testimonials, { type Testimonial } from "../components/Testimonials";
import ImageBanner from "../components/ImageBanner";
import Footer from "../components/Footer";
import type { Product } from "../components/ProductCard";
import {
  fetchFeatured,
  fetchBagCards,
  fetchCategories,
  fetchFeaturedReviews,
  rootCategories,
} from "../lib/storefront";

/**
 * Visuel de la bannière « Portez avec fierté », hébergé sur EdgeStore comme les
 * images produits. Il ne passe pas par `src/assets` : la photo a été déposée
 * depuis le back-office, pas livrée avec le code.
 */
const BANNER_PRIDE =
  "https://files.edgestore.dev/ndxx5n7gwym9imar/publicImages/_public/702708e0-12d5-47f8-8e8b-3a6b19e8a7bd.png";

/** Visuel de la bannière finale « À votre façon », hébergé sur EdgeStore lui aussi. */
const BANNER_YOUR_WAY =
  "https://files.edgestore.dev/ndxx5n7gwym9imar/publicImages/_public/e292ddce-ef22-4a92-aef0-2b1e8fbf71bb.png";

/** Dégradé par catégorie, avec repli cyclique pour toute nouvelle catégorie créée en admin. */
const CATEGORY_GRADIENTS: Record<string, string> = {
  sacs: "from-zinc-700 to-zinc-900",
  accessoires: "from-slate-600 to-slate-800",
  "salon-de-beaute": "from-stone-600 to-stone-900",
};
const FALLBACK_GRADIENTS = [
  "from-zinc-700 to-zinc-900",
  "from-slate-600 to-slate-800",
  "from-stone-600 to-stone-900",
];

export default function Home() {
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  // Les précommandes mises en avant ont leur propre vitrine : mêlées à la
  // sélection ordinaire, leur compte à rebours et leur double prix passaient
  // pour des variantes d'une carte produit normale.
  const [featuredPreorders, setFeaturedPreorders] = useState<Product[]>([]);
  const [backpacks, setBackpacks] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [mainCollections, setMainCollections] = useState<
    { name: string; href: string; gradient: string; image: string | null }[]
  >([]);

  useEffect(() => {
    fetchFeatured(8, false)
      .then(setBestsellers)
      .catch(() => setBestsellers([]));
    fetchFeatured(4, true)
      .then(setFeaturedPreorders)
      .catch(() => setFeaturedPreorders([]));
    fetchBagCards(8)
      .then(setBackpacks)
      .catch(() => setBackpacks([]));
    // Témoignages : vrais avis clients approuvés depuis le back-office.
    fetchFeaturedReviews(6)
      .then((reviews) =>
        setTestimonials(
          reviews
            .filter((r) => r.body)
            .map((r) => ({
              text: r.body!,
              author: r.author,
              rating: r.rating,
            })),
        ),
      )
      .catch(() => setTestimonials([]));
    fetchCategories()
      .then((cats) =>
        setMainCollections(
          // Racines seulement : l'API renvoie aussi les sous-catégories à plat.
          rootCategories(cats)
            .slice(0, 3)
            .map((c, i) => ({
              name: c.name,
              href: `/products?category=${encodeURIComponent(c.slug)}`,
              gradient:
                CATEGORY_GRADIENTS[c.slug] ??
                FALLBACK_GRADIENTS[i % FALLBACK_GRADIENTS.length],
              image: c.imageUrl,
            })),
        ),
      )
      .catch(() => setMainCollections([]));
  }, []);

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
            Pour ceux qui cherchent plus.
          </p>
        </div>

        {/* Main category grid */}
        {mainCollections.length > 0 && (
          <div className="pt-10">
            <CollectionGrid collections={mainCollections} />
          </div>
        )}

        {/* Mise en avant — produits disponibles à l'achat immédiat */}
        <SectionTitle
          eyebrow="La sélection du moment"
          subtitle="Les pièces que nous mettons en avant cette saison."
        />
        <FeaturedProducts products={bestsellers} />

        {/* Mise en avant — précommandes. Bande grise et lien dédié : la section
            se lit comme un rayon à part, pas comme la suite de la sélection.
            Masquée tant qu'aucune précommande n'est mise en avant. */}
        {featuredPreorders.length > 0 && (
          <section className="bg-zinc-50 border-y border-zinc-100 mt-4">
            <SectionTitle
              eyebrow="Bientôt disponibles"
              subtitle="Réservez dès maintenant, sans paiement : nous vous livrons le jour de la sortie."
            />
            <FeaturedProducts products={featuredPreorders} />
            <div className="pb-14 text-center">
              <Link
                to="/collections/produits-a-venir"
                className="inline-block px-10 py-4 border-2 border-black text-sm font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
              >
                Toutes les précommandes
              </Link>
            </div>
          </section>
        )}

        {/* Bannière « Portez avec fierté ». Le dégradé ne sert plus que de
            couleur d'attente pendant le chargement de la photo : il reprend le
            noir de la charte plutôt que le violet du gabarit d'origine. */}
        <ImageBanner
          eyebrow="Willy Accessoires"
          title="Tout ce dont vous avez besoin, au même endroit"
          subtitle="Découvrez notre sélection de produits et faites-vous plaisir."
          cta={{ label: "Découvrir la boutique", href: "/products" }}
          gradient="from-zinc-800 via-zinc-900 to-black"
          image={BANNER_PRIDE}
        />

        {/* Avis clients — masqué tant qu'aucun avis n'est approuvé en back-office */}
        {testimonials.length > 0 && (
          <>
            <SectionTitle eyebrow="Ce qu'en disent nos clientes et clients" />
            <Testimonials testimonials={testimonials} />
          </>
        )}

        {/* Feature collections */}
        {mainCollections.length > 0 && (
          <>
            <SectionTitle
              eyebrow="Explorer par catégorie"
              subtitle="Trouvez ce qu'il vous faut, rayon par rayon."
            />
            <CollectionGrid collections={mainCollections} />
          </>
        )}

        {/* Backpacks */}
        <SectionTitle
          eyebrow="On assure vos arrières"
          subtitle="Du bureau au week-end."
        />
        <FeaturedProducts products={backpacks} />

        {/* Final CTA banner */}
        <ImageBanner
          title="Vos envies, notre sélection"
          subtitle="Trouvez facilement les produits qui vous correspondent."
          cta={{ label: "Voir les accessoires", href: "/accessories" }}
          accent
          gradient="from-zinc-700 via-zinc-900 to-black"
          image={BANNER_YOUR_WAY}
          imageAlt="Studio photo équipé de projecteurs, d'un fauteuil de réalisateur et de matériel de prise de vue"
        />
      </main>

      <Footer />
    </div>
  );
}
