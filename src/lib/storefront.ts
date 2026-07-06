import { api } from './api'
import type { BagProduct } from '../data/bags'
import type { AccessoryProduct } from '../data/accessories'
import type { PreorderProduct } from '../data/preorders'

// ─── Shape renvoyée par l'API (/api/products) ────────────────────────────────

interface ProductMetadata {
  kind?: 'bag' | 'accessory'
  legacyId?: number
  gradientFrom?: string
  gradientTo?: string
  colors?: { name: string; hex: string; isPattern?: boolean }[]
  rating?: number
  reviews?: number
  volume?: string
  weather?: string[]
  tags?: string[]
  badge?: string
  soldOut?: boolean
  tagline?: string
  accessoryCategory?: string
}

export interface ApiProduct {
  id: string
  name: string
  slug: string
  price: string | number
  compareAtPrice: string | number | null
  stock: number
  isActive: boolean
  isFeatured: boolean
  isNew: boolean
  isPreorder: boolean
  releaseDate: string | null
  currency: string
  tags: string | null
  images: { url: string; alt?: string | null }[]
  category: { id: string; name: string; slug: string } | null
  metadata: ProductMetadata | null
  _count?: { reviews: number }
}

interface Paginated<T> {
  items: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

/** Id numérique stable à partir du cuid (fallback quand pas de legacyId). */
function hashId(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

const num = (v: string | number | null | undefined): number | undefined =>
  v === null || v === undefined ? undefined : Number(v)

// ─── Mappers API → shapes de cartes du front ─────────────────────────────────

export function toBagProduct(p: ApiProduct): BagProduct {
  const m = p.metadata ?? {}
  return {
    id: m.legacyId ?? hashId(p.id),
    name: p.name,
    price: Number(p.price),
    compareAtPrice: num(p.compareAtPrice),
    rating: m.rating ?? 0,
    reviews: m.reviews ?? p._count?.reviews ?? 0,
    colors: m.colors ?? [],
    badge: m.badge,
    soldOut: m.soldOut ?? p.stock <= 0,
    gradientFrom: m.gradientFrom ?? 'from-zinc-700',
    gradientTo: m.gradientTo ?? 'to-zinc-900',
    tags: m.tags ?? (p.tags ? p.tags.split(',').filter(Boolean) : []),
    volume: m.volume,
    weather: m.weather,
    inStock: p.stock > 0,
    isNew: p.isNew,
  }
}

export function toAccessoryProduct(p: ApiProduct): AccessoryProduct {
  const m = p.metadata ?? {}
  return {
    id: m.legacyId ?? hashId(p.id),
    name: p.name,
    price: Number(p.price),
    compareAtPrice: num(p.compareAtPrice),
    rating: m.rating ?? 0,
    reviews: m.reviews ?? p._count?.reviews ?? 0,
    category: m.accessoryCategory ?? 'porte-cles',
    colors: m.colors ?? [],
    gradientFrom: m.gradientFrom ?? 'from-zinc-700',
    gradientTo: m.gradientTo ?? 'to-zinc-900',
  }
}

export function toPreorderProduct(p: ApiProduct): PreorderProduct {
  const m = p.metadata ?? {}
  return {
    id: m.legacyId ?? hashId(p.id),
    name: p.name,
    price: Number(p.price),
    releaseDate: p.releaseDate ?? new Date().toISOString(),
    tagline: m.tagline ?? '',
    colors: m.colors ?? [],
    gradientFrom: m.gradientFrom ?? 'from-zinc-700',
    gradientTo: m.gradientTo ?? 'to-zinc-900',
  }
}

// ─── Fetchers ────────────────────────────────────────────────────────────────

async function fetchAll(): Promise<ApiProduct[]> {
  const res = await api.get<Paginated<ApiProduct>>('/products?limit=100&isActive=true')
  return res.items
}

/** Sacs = produits kind 'bag' hors précommandes. */
export async function fetchBags(): Promise<BagProduct[]> {
  const all = await fetchAll()
  return all
    .filter(p => (p.metadata?.kind ?? 'bag') === 'bag' && !p.isPreorder)
    .map(toBagProduct)
}

export async function fetchAccessories(): Promise<AccessoryProduct[]> {
  const all = await fetchAll()
  return all.filter(p => p.metadata?.kind === 'accessory').map(toAccessoryProduct)
}

export async function fetchNewArrivals(): Promise<BagProduct[]> {
  const products = await api.get<ApiProduct[]>('/products/new-arrivals?limit=50')
  return products.map(toBagProduct)
}

export async function fetchPreorders(): Promise<PreorderProduct[]> {
  const products = await api.get<ApiProduct[]>('/products/preorders?limit=50')
  return products.map(toPreorderProduct)
}
