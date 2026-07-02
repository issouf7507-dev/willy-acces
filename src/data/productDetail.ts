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
    description: 'The Barrage 22L is the rolltop that built its own following. Featuring a fully welded main compartment, expandable cargo net, and rugged construction, it strikes the perfect balance between compact everyday carry and all-day hauling capability.',
    rating: 4.6,
    reviews: 68,
    gradientFrom: 'from-zinc-700',
    gradientTo: 'to-zinc-900',
    sku: 'BG-367-BK-NA-NA',
    variants: [
      { id: 1, name: 'Black', hex: '#111111', price: 170, available: true, gradientFrom: 'from-zinc-800', gradientTo: 'to-zinc-950' },
      { id: 2, name: 'Black XRF', hex: '#444444', isPattern: true, price: 175, available: true, gradientFrom: 'from-zinc-600', gradientTo: 'to-zinc-800' },
      { id: 3, name: 'Moss X', hex: '#7a9460', price: 170, available: false, gradientFrom: 'from-green-800', gradientTo: 'to-green-950' },
      { id: 4, name: 'Amber X', hex: '#CD7613', price: 170, available: false, gradientFrom: 'from-amber-700', gradientTo: 'to-amber-900' },
      { id: 5, name: 'Castlerock Twill', hex: '#8F8185', price: 170, available: false, gradientFrom: 'from-slate-500', gradientTo: 'to-slate-700' },
    ],
    features: [
      'Expandable water resistant rolltop closure allows for an extra 3L of room',
      'Lighter-weight, welded floating tarp liner made from recycled auto-glass',
      'Updated ergonomic shoulder straps with removable sternum strap',
      'Enhanced molded back panel for extra comfort',
    ],
    extendedFeatures: [
      'Exterior webbing cargo net for emotional and non-emotional cargo',
      'Internal 16" laptop sleeve, unpadded. Size: 14.75" x 10.5"',
      'External zippered pocket and internal drop pocket for the little things',
      'Side bottle pockets fit up to a 2.5" diameter container',
      'Lifetime warranty against material + workmanship defects',
    ],
    sizing: {
      volume: '19-22 Liters',
      dimensions: '20"H x 11"W x 5.5"D',
      weight: '2.47lbs (1.12 kg)',
      deviceSleeve: '14.75" x 10.5", unpadded',
      waterBottlePocket: 'up to a 2.5" diameter',
    },
    relatedSizes: [
      { label: '18L', handle: 'barrage-18l-pack' },
      { label: '22L', handle: 'barrage-22l-pack' },
      { label: '34L', handle: 'barrage-34l-pack' },
    ],
    collectionHandle: 'bags',
    collectionName: 'Bags',
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

function buildFromBag(bag: BagProduct): ProductDetailData {
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

  const gradients: GalleryImage[] = [
    { id: 1, gradientFrom: bag.gradientFrom, gradientTo: bag.gradientTo, alt: `${bag.name} front` },
    { id: 2, gradientFrom: bag.gradientFrom, gradientTo: bag.gradientTo.replace('900', '700'), alt: `${bag.name} side` },
    { id: 3, gradientFrom: bag.gradientFrom.replace('700', '800'), gradientTo: bag.gradientTo, alt: `${bag.name} back` },
    { id: 4, gradientFrom: bag.gradientFrom, gradientTo: bag.gradientTo, alt: `${bag.name} detail` },
  ]

  return {
    id: bag.id,
    handle,
    name: bag.name,
    description: `The ${bag.name} by Chrome Industries is built for the everyday commuter and weekend explorer. Durable construction, thoughtful organization, and a lifetime warranty make it a carry-everywhere bag.`,
    rating: bag.rating,
    reviews: bag.reviews,
    gradientFrom: bag.gradientFrom,
    gradientTo: bag.gradientTo,
    sku: `BG-${bag.id.toString().padStart(3, '0')}`,
    variants,
    features: [
      'Rugged, weather-resistant construction',
      'Padded back panel for all-day comfort',
      'Thoughtful internal organization',
      'Available in multiple colorways',
    ],
    extendedFeatures: [
      'Lifetime warranty against material + workmanship defects',
      'All PFAS-free materials',
      'Designed and tested for bike commuters and urban explorers',
    ],
    sizing: {
      volume: bag.volume ?? 'See details',
      dimensions: 'See product details',
      weight: 'See product details',
    },
    collectionHandle: 'bags',
    collectionName: 'Bags',
    galleryImages: gradients,
  }
}

export function getProductByHandle(handle: string): ProductDetailData | null {
  if (PRODUCT_DETAILS_CATALOG[handle]) return PRODUCT_DETAILS_CATALOG[handle]
  const bag = BAGS.find(b => nameToHandle(b.name) === handle)
  if (!bag) return null
  return buildFromBag(bag)
}
