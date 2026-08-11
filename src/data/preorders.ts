export interface PreorderColor {
  name: string
  hex: string
  isPattern?: boolean
}

export interface PreorderProduct {
  id: number
  /** Identifiant produit côté API (cuid), envoyé avec la demande de précommande. */
  productId: string
  name: string
  /** Prix applicable : le tarif de précommande tant que la période court. */
  price: number
  /** Prix normal barré, présent quand la précommande est moins chère. */
  compareAtPrice?: number
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
