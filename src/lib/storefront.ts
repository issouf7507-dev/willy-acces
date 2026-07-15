import { api } from './api'
import type { BagProduct } from '../data/bags'
import type { AccessoryProduct } from '../data/accessories'
import type { PreorderProduct } from '../data/preorders'
import {
  buildFromBag,
  getStaticProductDetail,
  nameToHandle,
  type ProductDetailData,
} from '../data/productDetail'
import type { Product as CardProduct } from '../components/ProductCard'

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
    categorySlug: p.category?.slug,
    imageUrl: p.images?.[0]?.url,
    images: p.images?.map((i) => i.url),
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
    // La sous-catégorie vient de la vraie catégorie du produit (back-office).
    // `metadata.accessoryCategory` n'est plus qu'un repli pour d'éventuels
    // produits non repris par la migration.
    category: p.category?.slug ?? m.accessoryCategory ?? '',
    colors: m.colors ?? [],
    gradientFrom: m.gradientFrom ?? 'from-zinc-700',
    gradientTo: m.gradientTo ?? 'to-zinc-900',
    imageUrl: p.images?.[0]?.url,
  }
}

export function toCardProduct(p: ApiProduct): CardProduct {
  const m = p.metadata ?? {}
  return {
    id: m.legacyId ?? hashId(p.id),
    name: p.name,
    price: Number(p.price),
    rating: m.rating ?? 0,
    reviews: m.reviews ?? p._count?.reviews ?? 0,
    colors: (m.colors ?? []).map(c => c.hex),
    badge: m.badge,
    imageUrl: p.images?.[0]?.url,
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
    imageUrl: p.images?.[0]?.url,
  }
}

// ─── Fetchers ────────────────────────────────────────────────────────────────

async function fetchAll(): Promise<ApiProduct[]> {
  const res = await api.get<Paginated<ApiProduct>>('/products?limit=100&isActive=true')
  return res.items
}

/**
 * Sacs = produits rangés sous « Sacs » (ou une de ses sous-catégories), hors
 * précommandes. Se baser sur `metadata.kind` faisait passer pour un sac tout
 * produit créé depuis l'admin, qui n'écrit pas ce champ.
 */
export async function fetchBags(): Promise<BagProduct[]> {
  const [all, cats] = await Promise.all([fetchAll(), fetchCategories()])
  const covered = new Set(categorySlugsWithDescendants(cats, 'sacs'))
  return all
    .filter(p => !p.isPreorder && p.category?.slug && covered.has(p.category.slug))
    .map(toBagProduct)
}

/** Catalogue complet (tous produits actifs hors précommandes), pour /products. */
export async function fetchCatalog(): Promise<BagProduct[]> {
  const all = await fetchAll()
  return all.filter(p => !p.isPreorder).map(toBagProduct)
}

// ─── Catégories (gérées depuis le back-office) ───────────────────────────────

interface ApiCategory {
  id: string
  name: string
  slug: string
  parentId: string | null
  sortOrder: number
  _count?: { products: number }
}

export interface StoreCategory {
  id: string
  name: string
  slug: string
  parentId: string | null
  sortOrder: number
  /** Produits rattachés à cette catégorie seule (hors sous-catégories). */
  productCount: number
}

/**
 * Catégories actives, triées, telles que définies dans le back-office.
 * L'API les renvoie à plat, tous niveaux confondus : filtrer avec `rootCategories`
 * / `childCategories` pour n'en afficher qu'un niveau.
 */
export async function fetchCategories(): Promise<StoreCategory[]> {
  const cats = await api.get<ApiCategory[]>('/categories')
  return cats
    .map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentId: c.parentId ?? null,
      sortOrder: c.sortOrder ?? 0,
      productCount: c._count?.products ?? 0,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

/** Catégories de premier niveau (Sacs, Accessoires…). */
export function rootCategories(cats: StoreCategory[]): StoreCategory[] {
  return cats.filter(c => c.parentId === null)
}

/** Sous-catégories directes du parent désigné par son slug. */
export function childCategories(cats: StoreCategory[], parentSlug: string): StoreCategory[] {
  const parent = cats.find(c => c.slug === parentSlug)
  if (!parent) return []
  return cats.filter(c => c.parentId === parent.id)
}

/**
 * Slugs couverts par une catégorie : elle-même + tous ses descendants.
 * Sans ça, filtrer sur « Accessoires » raterait les produits rangés dans
 * « Porte-clés », puisqu'ils ne portent que le slug de la sous-catégorie.
 */
export function categorySlugsWithDescendants(cats: StoreCategory[], slug: string): string[] {
  const root = cats.find(c => c.slug === slug)
  if (!root) return [slug]
  const slugs = [root.slug]
  const queue = [root.id]
  while (queue.length) {
    const parentId = queue.shift()!
    for (const c of cats) {
      if (c.parentId === parentId) {
        slugs.push(c.slug)
        queue.push(c.id)
      }
    }
  }
  return slugs
}

/** Nombre de produits d'une catégorie, sous-catégories incluses. */
export function countInCategory(
  cats: StoreCategory[],
  slug: string,
  products: { categorySlug?: string }[],
): number {
  const covered = new Set(categorySlugsWithDescendants(cats, slug))
  return products.filter(p => p.categorySlug && covered.has(p.categorySlug)).length
}

/**
 * Accessoires = produits rangés sous « Accessoires » ou l'une de ses
 * sous-catégories. On se base sur la catégorie et non sur `metadata.kind`,
 * que le back-office n'écrit pas : un accessoire créé depuis l'admin serait
 * sinon absent de la page.
 */
export async function fetchAccessories(): Promise<AccessoryProduct[]> {
  const [all, cats] = await Promise.all([fetchAll(), fetchCategories()])
  const covered = new Set(categorySlugsWithDescendants(cats, 'accessoires'))
  return all
    .filter(p => !p.isPreorder && p.category?.slug && covered.has(p.category.slug))
    .map(toAccessoryProduct)
}

/** Produits mis en avant (page d'accueil). */
export async function fetchFeatured(limit = 8): Promise<CardProduct[]> {
  const products = await api.get<ApiProduct[]>(`/products/featured?limit=${limit}`)
  return products.map(toCardProduct)
}

/** Cartes "sacs" pour la page d'accueil. */
export async function fetchBagCards(limit = 8): Promise<CardProduct[]> {
  const [all, cats] = await Promise.all([fetchAll(), fetchCategories()])
  const covered = new Set(categorySlugsWithDescendants(cats, 'sacs'))
  return all
    .filter(p => !p.isPreorder && p.category?.slug && covered.has(p.category.slug))
    .slice(0, limit)
    .map(toCardProduct)
}

export async function fetchNewArrivals(): Promise<BagProduct[]> {
  const products = await api.get<ApiProduct[]>('/products/new-arrivals?limit=50')
  return products.map(toBagProduct)
}

/** Produits mis en avant (isFeatured), au format carte de collection. */
export async function fetchFeaturedBags(limit = 50): Promise<BagProduct[]> {
  const products = await api.get<ApiProduct[]>(`/products/featured?limit=${limit}`)
  return products.map(toBagProduct)
}

export async function fetchPreorders(): Promise<PreorderProduct[]> {
  const products = await api.get<ApiProduct[]>('/products/preorders?limit=50')
  return products.map(toPreorderProduct)
}

/**
 * Fiche produit (PDP) résolue par handle = nameToHandle(nom).
 * Priorité aux fiches détaillées écrites à la main, sinon construite depuis
 * le produit renvoyé par l'API.
 */
export async function fetchProductDetail(
  handle: string,
): Promise<ProductDetailData | null> {
  const staticDetail = getStaticProductDetail(handle)
  if (staticDetail) return staticDetail

  const bags = await fetchBags()
  const bag = bags.find(b => nameToHandle(b.name) === handle)
  return bag ? buildFromBag(bag) : null
}

// ─── Carousel (page d'accueil, géré depuis le back-office) ───────────────────

export interface CarouselSlideApi {
  id: string
  title: string | null
  subtitle: string | null
  imageUrl: string
  linkUrl: string | null
  altText: string | null
}

export async function fetchCarousel(): Promise<CarouselSlideApi[]> {
  return api.get<CarouselSlideApi[]>('/content/carousel')
}

// ─── Salon (services + galerie, gérés depuis le back-office) ─────────────────

export interface SalonServiceApi {
  id: string
  name: string
  description: string
  priceFrom: number
  gradientFrom: string
  gradientTo: string
}

export async function fetchSalonServices(): Promise<SalonServiceApi[]> {
  return api.get<SalonServiceApi[]>('/content/salon-services')
}

export interface SalonCatalogueApi {
  id: string
  title: string
  description: string | null
  images: { id: string; imageUrl: string; alt: string | null; sortOrder: number }[]
}

export async function fetchSalonCatalogues(): Promise<SalonCatalogueApi[]> {
  return api.get<SalonCatalogueApi[]>('/content/salon')
}

// ─── Réglages boutique (public) ──────────────────────────────────────────────

export type StoreSettings = Record<string, unknown>

export async function fetchSettings(): Promise<StoreSettings> {
  return api.get<StoreSettings>('/settings')
}

// ─── Résolution panier → items de commande ───────────────────────────────────

export interface OrderItemPayload {
  productId: string
  quantity: number
}

export interface ResolvedOrder {
  /** Items prêts pour POST /api/orders. */
  orderItems: OrderItemPayload[]
  /** Noms des articles non retrouvés côté API (à exclure de la commande en ligne). */
  unresolved: string[]
}

/**
 * Convertit les articles du panier en items de commande.
 * Priorité au `productId` (cuid) porté par l'article ; sinon résolution par nom
 * contre le catalogue API. Les articles non résolus sont listés à part.
 */
export async function resolveCartToOrder(
  items: { productId?: string; name: string; quantity: number }[],
): Promise<ResolvedOrder> {
  const needsLookup = items.some(i => !i.productId)
  const byName = new Map<string, string>()
  if (needsLookup) {
    const all = await fetchAll()
    for (const p of all) byName.set(p.name.trim().toLowerCase(), p.id)
  }

  const orderItems: OrderItemPayload[] = []
  const unresolved: string[] = []
  for (const it of items) {
    const pid = it.productId ?? byName.get(it.name.trim().toLowerCase())
    if (pid) orderItems.push({ productId: pid, quantity: it.quantity })
    else unresolved.push(it.name)
  }
  return { orderItems, unresolved }
}
