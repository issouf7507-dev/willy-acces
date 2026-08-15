import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AnnouncementBar from "../components/AnnouncementBar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useSettings } from "../context/SettingsContext";
import { fetchAccordion, type AccordionItemApi } from "../lib/storefront";
import { DEFAULT_WHATSAPP_NUMBER, whatsappHref } from "../lib/whatsapp";
import { formatPrice } from "../lib/utils";
import { useSeo } from '../lib/seo'

/**
 * Comment se passe une commande ici. Ces trois étapes décrivent le parcours
 * réel du site (panier → récapitulatif WhatsApp) : elles ne dépendent d'aucun
 * contenu back-office, contrairement à la FAQ plus bas.
 */
const STEPS = [
  {
    title: "Choisir",
    text: "Parcourez la boutique et ajoutez au panier. Aucun compte n'est nécessaire.",
  },
  {
    title: "Valider",
    text: "Renseignez nom, téléphone et adresse : le récapitulatif part sur WhatsApp, où nous confirmons disponibilité, montant et livraison.",
  },
  {
    title: "Recevoir",
    text: "Vous payez à la livraison ou avant selon le moyen choisi, et suivez votre commande sur WhatsApp.",
  },
];

/**
 * Aide & FAQ. Les questions viennent de /admin/content/faq (table
 * `accordion_items`) ; le reste de la page explique le fonctionnement de la
 * boutique et donne les moyens de nous joindre.
 */
export default function Faq() {
  useSeo({
    title: 'Aide & FAQ',
    description:
      'Comment commander, payer et se faire livrer chez Willy Accessoires, et les réponses aux questions fréquentes.',
    canonicalPath: '/faq',
  })
  const [items, setItems] = useState<AccordionItemApi[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const { settings } = useSettings();
  const freeShipping = settings.freeShippingThreshold;
  const whatsapp = settings.whatsappNumber || DEFAULT_WHATSAPP_NUMBER;

  useEffect(() => {
    fetchAccordion()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

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
              Aide
              <br />
              &amp; FAQ
            </h1>
            <p className="text-sm text-zinc-400 max-w-md mt-6 leading-relaxed">
              Comment commander, payer et vous faire livrer — et les réponses
              aux questions qu'on nous pose le plus souvent.
            </p>
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="max-w-[900px] mx-auto px-5 md:px-12 pt-12 md:pt-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">
            Comment ça marche
          </h2>
          <ol className="grid sm:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <li key={step.title} className="border-t-2 border-black pt-4">
                <span className="block text-3xl font-black text-zinc-200 leading-none mb-2">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-black uppercase tracking-tight text-zinc-900 mb-1.5">
                  {step.title}
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>

          {/* Seuil de livraison offerte : réglé dans /admin/settings. */}
          {freeShipping !== undefined && (
            <p className="mt-6 text-sm text-zinc-500">
              Livraison offerte à partir de{" "}
              <span className="font-bold text-zinc-900">
                {formatPrice(freeShipping)}
              </span>{" "}
              d'achat à Abidjan.
            </p>
          )}
        </section>

        <div className="max-w-[900px] mx-auto px-5 md:px-12 py-12 md:py-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">
            Questions fréquentes
          </h2>
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
                const isOpen = open === item.id;
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
                          isOpen ? "rotate-45" : ""
                        }`}
                        aria-hidden="true"
                      >
                        +
                      </span>
                    </button>
                    <div
                      className={`grid transition-all duration-300 ${
                        isOpen ? "grid-rows-[1fr] pb-6" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="text-zinc-600 leading-relaxed whitespace-pre-line">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Nous joindre. WhatsApp d'abord : c'est le canal où se finalisent
              les commandes, donc celui où l'on répond le plus vite. */}
          <div className="mt-14 border border-zinc-200 p-8 text-center">
            <h2 className="font-black uppercase tracking-tight text-zinc-900 mb-2">
              Vous ne trouvez pas votre réponse ?
            </h2>
            <p className="text-sm text-zinc-500 mb-5">
              Notre équipe vous répond directement.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href={whatsappHref(
                  whatsapp,
                  "Bonjour, j’ai une question sur la boutique.",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 text-white text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#25D366" }}
              >
                Écrire sur WhatsApp
              </a>
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
                  href={`tel:${settings.contactPhone.replace(/\s+/g, "")}`}
                  className="px-6 py-3 border border-zinc-300 text-sm font-bold uppercase tracking-widest hover:border-black transition-colors"
                >
                  {settings.contactPhone}
                </a>
              )}
            </div>
          </div>

          {/* Inscription : le seul « compte » de la boutique. */}
          <div className="mt-6 bg-zinc-50 border border-zinc-200 p-8 text-center">
            <h2 className="font-black uppercase tracking-tight text-zinc-900 mb-2">
              Restez prévenu
            </h2>
            <p className="text-sm text-zinc-500 mb-5 max-w-md mx-auto leading-relaxed">
              Nouveautés, promotions et jeux concours : inscrivez-vous avec
              votre nom et votre numéro, sans créer de compte.
            </p>
            <Link
              to="/inscription"
              className="inline-block px-6 py-3 bg-[#FFEA3B] text-zinc-900 text-sm font-bold uppercase tracking-widest hover:bg-yellow-300 transition-colors"
            >
              S'inscrire
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
