export interface PreorderColor {
  name: string
  hex: string
  isPattern?: boolean
}

export interface PreorderProduct {
  id: number
  name: string
  price: number
  /** Date de disponibilité au format ISO 8601 */
  releaseDate: string
  tagline: string
  colors: PreorderColor[]
  gradientFrom: string
  gradientTo: string
  imageUrl?: string
}

// Aucune précommande codée en dur : la page Précommandes charge ses produits
// depuis le back-office via fetchPreorders() (voir src/lib/storefront.ts).
