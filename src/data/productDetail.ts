export interface DetailVariant {
  id: number
  name: string
  hex: string
  isPattern?: boolean
  price: number
  compareAtPrice?: number
  available: boolean
  gradientFrom: string
  gradientTo: string
}

export interface GalleryImage {
  id: number
  gradientFrom: string
  gradientTo: string
  alt: string
  url?: string
}

export interface ProductSizing {
  volume?: string
  dimensions?: string
  weight?: string
  deviceSleeve?: string
  waterBottlePocket?: string
}

/**
 * Fiche produit affichée sur /products/:handle. Tout vient du back-office : les
 * champs facultatifs sont absents quand l'admin ne les a pas renseignés, et les
 * blocs correspondants ne s'affichent pas — on n'invente ni description, ni
 * caractéristiques, ni dimensions.
 */
export interface ProductDetailData {
  id: number
  /** cuid côté API — nécessaire pour charger les avis du produit. */
  productId: string
  handle: string
  name: string
  description: string
  rating: number
  reviews: number
  gradientFrom: string
  gradientTo: string
  sku: string
  variants: DetailVariant[]
  /** Vrai seulement si le produit déclare de vrais coloris (metadata.colors). */
  hasColorVariants: boolean
  features: string[]
  extendedFeatures: string[]
  sizing?: ProductSizing
  relatedSizes?: Array<{ label: string; handle: string }>
  collectionHandle: string
  collectionName: string
  galleryImages: GalleryImage[]
}

export function nameToHandle(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}
