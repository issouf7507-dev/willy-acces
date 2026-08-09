export interface AccessoryColor {
  name: string
  hex: string
  isPattern?: boolean
}

export interface AccessoryProduct {
  id: number
  name: string
  price: number
  compareAtPrice?: number
  rating: number
  reviews: number
  category: string
  colors: AccessoryColor[]
  gradientFrom: string
  gradientTo: string
  imageUrl?: string
}

// Les sous-catégories d'accessoires (Porte-clés, Sangles…) ne sont plus listées
// ici : ce sont des catégories enfants d'« Accessoires », gérées depuis
// /admin/categories et lues via fetchCategories(). Le champ `category` ci-dessus
// porte le slug de la catégorie du produit.

export const ACCESSORY_SORT_OPTIONS = [
  { label: 'En vedette', value: 'featured' },
  { label: 'Prix : croissant', value: 'price-asc' },
  { label: 'Prix : décroissant', value: 'price-desc' },
  { label: 'Mieux notés', value: 'rating' },
  { label: 'Plus d’avis', value: 'reviews' },
]

// Aucun accessoire n'est codé en dur : la page Accessoires charge ses produits
// depuis le back-office via fetchAccessories() (voir src/lib/storefront.ts).
