import { useEffect } from 'react'

/**
 * Métadonnées de page pour une SPA. Chaque écran déclare son titre et sa
 * description ; sans ça, toutes les URL du site partageaient le titre unique
 * posé dans index.html.
 *
 * On écrit directement dans le `<head>` plutôt que d'ajouter une dépendance
 * (react-helmet) : il n'y a que quelques balises à tenir à jour, et elles sont
 * toutes remises à leur valeur d'origine au démontage.
 *
 * Limite connue : Google exécute le JS et voit donc ces balises, mais pas les
 * robots d'aperçu de WhatsApp / Facebook, qui lisent le HTML brut. Pour eux,
 * il faut un rendu serveur — hors périmètre ici.
 */

/** Origine publique du site, pour les URL canoniques et les images de partage. */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || 'https://willyaccessoire.com'
).replace(/\/$/, '')

export const SITE_NAME = 'Willy Accessoires'

const DEFAULT_TITLE = "Willy Accessoires — Boutique d'accessoires"
const DEFAULT_DESCRIPTION =
  "Willy Accessoires, boutique d'accessoires : nouveautés, précommandes et salon de beauté."

export interface SeoInput {
  /** Titre de l'onglet et des résultats de recherche. Le nom de la boutique est ajouté. */
  title?: string
  description?: string
  /** Chemin canonique (`/products/mon-produit`). Par défaut, l'URL courante. */
  canonicalPath?: string
  /** Image de partage, en URL absolue. */
  image?: string
  /** `product` sur une fiche, `website` ailleurs. */
  type?: 'website' | 'product' | 'article'
  /** Tunnel de commande, back-office… : à tenir hors de l'index. */
  noindex?: boolean
  /** Données structurées schema.org injectées dans un `<script type="application/ld+json">`. */
  jsonLd?: Record<string, unknown> | null
}

/** Balise `<meta>` par `name=` ou `property=`, créée si elle n'existe pas encore. */
function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function useSeo({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalPath,
  image,
  type = 'website',
  noindex = false,
  jsonLd = null,
}: SeoInput) {
  // Les dépendances sont sérialisées : `jsonLd` est un objet reconstruit à
  // chaque rendu, le passer tel quel relancerait l'effet en boucle.
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : ''

  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : DEFAULT_TITLE
    const path = canonicalPath ?? window.location.pathname
    const canonical = `${SITE_URL}${path}`
    const shareImage = image ?? `${SITE_URL}/logo-512.png`

    document.title = fullTitle
    setMeta('name', 'description', description)
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')
    setLink('canonical', canonical)

    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', canonical)
    setMeta('property', 'og:image', shareImage)
    setMeta('property', 'og:type', type)
    setMeta('property', 'og:site_name', SITE_NAME)
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', shareImage)

    let script: HTMLScriptElement | null = null
    if (jsonLdKey) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      script.textContent = jsonLdKey
      document.head.appendChild(script)
    }

    return () => {
      script?.remove()
      // Le titre par défaut reprend la main : sans ça, revenir sur une page
      // sans `useSeo` garderait le titre de la page précédente.
      document.title = DEFAULT_TITLE
      setMeta('name', 'robots', 'index, follow')
    }
  }, [title, description, canonicalPath, image, type, noindex, jsonLdKey])
}

/** Coupe une description à la longueur utile dans un résultat de recherche. */
export function seoText(value: string | undefined | null, max = 160): string {
  const clean = (value ?? '').replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).trimEnd()}…`
}
