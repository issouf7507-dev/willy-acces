import { BAGS, type BagProduct } from './bags'

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

export interface ProductDetailData {
  id: number
  handle: string
  name: string
  description: string
  rating: number
  reviews: number
  gradientFrom: string
  gradientTo: string
  sku: string
  variants: DetailVariant[]
  features: string[]
  extendedFeatures: string[]
  sizing: {
    volume: string
    dimensions: string
    weight: string
    deviceSleeve?: string
    waterBottlePocket?: string
  }
  relatedSizes?: Array<{ label: string; handle: string }>
  collectionHandle: string
  collectionName: string
  galleryImages: GalleryImage[]
}

export function nameToHandle(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

// Rich PDP data for featured products
const PRODUCT_DETAILS_CATALOG: Record<string, ProductDetailData> = {
  'barrage-22l-pack': {
    id: 11,
    handle: 'barrage-22l-pack',
    name: 'Barrage 22L Pack',
    description: 'Le Barrage 22L est le sac à rabat qui s’est fait un nom. Compartiment principal entièrement soudé, filet de transport extensible et fabrication robuste : l’équilibre parfait entre un usage quotidien compact et une grande capacité de portage.',
    rating: 4.6,
    reviews: 68,
    gradientFrom: 'from-zinc-700',
    gradientTo: 'to-zinc-900',
    sku: 'BG-367-BK-NA-NA',
    variants: [
      { id: 1, name: 'Noir', hex: '#111111', price: 170, available: true, gradientFrom: 'from-zinc-800', gradientTo: 'to-zinc-950' },
      { id: 2, name: 'Black XRF', hex: '#444444', isPattern: true, price: 175, available: true, gradientFrom: 'from-zinc-600', gradientTo: 'to-zinc-800' },
      { id: 3, name: 'Moss X', hex: '#7a9460', price: 170, available: false, gradientFrom: 'from-green-800', gradientTo: 'to-green-950' },
      { id: 4, name: 'Amber X', hex: '#CD7613', price: 170, available: false, gradientFrom: 'from-amber-700', gradientTo: 'to-amber-900' },
      { id: 5, name: 'Castlerock Twill', hex: '#8F8185', price: 170, available: false, gradientFrom: 'from-slate-500', gradientTo: 'to-slate-700' },
    ],
    features: [
      'Fermeture à rabat déroulant, résistante à l’eau, offrant 3 L d’espace supplémentaire',
      'Doublure soudée plus légère, fabriquée à partir de pare-brise recyclés',
      'Bretelles ergonomiques avec sangle de poitrine amovible',
      'Dos moulé renforcé pour plus de confort',
    ],
    extendedFeatures: [
      'Filet de transport extérieur pour tout emporter',
      'Compartiment ordinateur 16 pouces (non matelassé), 37,5 x 26,7 cm',
      'Poche extérieure zippée et poche intérieure pour les petits objets',
      'Poches latérales pour bouteille jusqu’à 6,3 cm de diamètre',
      'Garantie à vie contre les défauts de matériaux et de fabrication',
    ],
    sizing: {
      volume: '19–22 litres',
      dimensions: '20"H x 11"W x 5.5"D',
      weight: '1,12 kg',
      deviceSleeve: '37,5 x 26,7 cm, non matelassé',
      waterBottlePocket: 'jusqu’à 6,3 cm de diamètre',
    },
    relatedSizes: [
      { label: '18L', handle: 'barrage-18l-pack' },
      { label: '22L', handle: 'barrage-22l-pack' },
      { label: '34L', handle: 'barrage-34l-pack' },
    ],
    collectionHandle: 'bags',
    collectionName: 'Sacs',
    galleryImages: [
      { id: 1, gradientFrom: 'from-zinc-800', gradientTo: 'to-zinc-950', alt: 'Barrage 22L front on-body' },
      { id: 2, gradientFrom: 'from-zinc-700', gradientTo: 'to-zinc-900', alt: 'Barrage 22L product front' },
      { id: 3, gradientFrom: 'from-zinc-900', gradientTo: 'to-black', alt: 'Barrage 22L product back' },
      { id: 4, gradientFrom: 'from-stone-700', gradientTo: 'to-stone-900', alt: 'Barrage 22L features callout' },
      { id: 5, gradientFrom: 'from-zinc-600', gradientTo: 'to-zinc-800', alt: 'Barrage 22L in use' },
      { id: 6, gradientFrom: 'from-neutral-700', gradientTo: 'to-neutral-900', alt: 'Barrage 22L interior' },
    ],
  },
}

export function buildFromBag(bag: BagProduct): ProductDetailData {
  const handle = nameToHandle(bag.name)
  const variants: DetailVariant[] = bag.colors.length > 0
    ? bag.colors.map((c, i) => ({
        id: bag.id * 100 + i,
        name: c.name,
        hex: c.hex,
        isPattern: c.isPattern,
        price: bag.price,
        compareAtPrice: bag.compareAtPrice,
        available: bag.inStock,
        gradientFrom: bag.gradientFrom,
        gradientTo: bag.gradientTo,
      }))
    : [{ id: bag.id * 100, name: 'One Color', hex: '#111111', price: bag.price, compareAtPrice: bag.compareAtPrice, available: bag.inStock, gradientFrom: bag.gradientFrom, gradientTo: bag.gradientTo }]

  const gradients: GalleryImage[] = bag.images && bag.images.length > 0
    ? bag.images.map((url, i) => ({
        id: i + 1,
        gradientFrom: bag.gradientFrom,
        gradientTo: bag.gradientTo,
        alt: `${bag.name} ${i + 1}`,
        url,
      }))
    : bag.imageUrl
    ? [{ id: 1, gradientFrom: bag.gradientFrom, gradientTo: bag.gradientTo, alt: bag.name, url: bag.imageUrl }]
    : [
        { id: 1, gradientFrom: bag.gradientFrom, gradientTo: bag.gradientTo, alt: `${bag.name} front` },
        { id: 2, gradientFrom: bag.gradientFrom, gradientTo: bag.gradientTo.replace('900', '700'), alt: `${bag.name} side` },
        { id: 3, gradientFrom: bag.gradientFrom.replace('700', '800'), gradientTo: bag.gradientTo, alt: `${bag.name} back` },
        { id: 4, gradientFrom: bag.gradientFrom, gradientTo: bag.gradientTo, alt: `${bag.name} detail` },
      ]

  return {
    id: bag.id,
    handle,
    name: bag.name,
    description: `Le ${bag.name} est pensé pour le quotidien comme pour les escapades du week-end. Fabrication durable, organisation intelligente et garantie à vie : un sac à emporter partout.`,
    rating: bag.rating,
    reviews: bag.reviews,
    gradientFrom: bag.gradientFrom,
    gradientTo: bag.gradientTo,
    sku: `BG-${bag.id.toString().padStart(3, '0')}`,
    variants,
    features: [
      'Fabrication robuste et résistante aux intempéries',
      'Dos matelassé pour un confort toute la journée',
      'Organisation interne bien pensée',
      'Disponible en plusieurs coloris',
    ],
    extendedFeatures: [
      'Garantie à vie contre les défauts de matériaux et de fabrication',
      'Matériaux sans PFAS',
      'Conçu et testé pour les trajets à vélo et la ville',
    ],
    sizing: {
      volume: bag.volume ?? 'Voir les détails',
      dimensions: 'Voir la fiche produit',
      weight: 'Voir la fiche produit',
    },
    collectionHandle: 'bags',
    collectionName: 'Sacs',
    galleryImages: gradients,
  }
}

/** Fiche produit riche écrite à la main (override), sinon null. */
export function getStaticProductDetail(handle: string): ProductDetailData | null {
  return PRODUCT_DETAILS_CATALOG[handle] ?? null
}

export function getProductByHandle(handle: string): ProductDetailData | null {
  if (PRODUCT_DETAILS_CATALOG[handle]) return PRODUCT_DETAILS_CATALOG[handle]
  const bag = BAGS.find(b => nameToHandle(b.name) === handle)
  if (!bag) return null
  return buildFromBag(bag)
}
