export interface ColorOption {
  name: string
  hex: string
  isPattern?: boolean
}

export interface BagProduct {
  id: number
  name: string
  price: number
  compareAtPrice?: number
  /** Identifiant produit côté API (cuid), nécessaire pour précommander. */
  productId?: string
  /** Produit en précommande *en ce moment* (calculé par l'API). */
  isPreorder?: boolean
  /** Date de sortie ISO, pour le compte à rebours des cartes en précommande. */
  releaseDate?: string
  rating: number
  reviews: number
  colors: ColorOption[]
  badge?: string
  soldOut?: boolean
  isNew?: boolean
  gradientFrom: string
  gradientTo: string
  tags: string[]
  volume?: string
  weather?: string[]
  inStock: boolean
  /** Slug de la catégorie en base (renseigné quand le produit vient de l'API). */
  categorySlug?: string
  /** URL de la première image (renseignée quand le produit vient de l'API). */
  imageUrl?: string
  /** Toutes les images du produit (renseignées quand le produit vient de l'API). */
  images?: string[]
}

// Aucun sac codé en dur : les pages Sacs/Nouveautés/Catalogue chargent leurs
// produits depuis le back-office via fetchBags()/fetchNewArrivals()/fetchCatalog()
// (voir src/lib/storefront.ts).

// Les options de filtre (couleurs, caractéristiques, volumes, intempéries) ne
// sont plus listées ici : elles sont déduites des produits réellement chargés
// depuis l'API (voir src/components/collection/FilterDrawer.tsx). Les sous-
// catégories affichées sous le titre viennent de /admin/categories.

/** Ordres de tri proposés — libellés d'interface, pas du contenu éditorial. */
export const SORT_OPTIONS = [
  { label: 'En vedette', value: 'featured' },
  { label: 'Prix : croissant', value: 'price-asc' },
  { label: 'Prix : décroissant', value: 'price-desc' },
  { label: 'Mieux notés', value: 'rating' },
  { label: 'Plus d’avis', value: 'reviews' },
]
