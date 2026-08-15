import { api } from "./api";
import type { BagProduct } from "../data/bags";
import type { AccessoryProduct } from "../data/accessories";
import type { PreorderProduct } from "../data/preorders";
import {
  nameToHandle,
  legacyNameToHandle,
  type ProductDetailData,
  type DetailVariant,
  type GalleryImage,
  type ProductSizing,
} from "../data/productDetail";
import type { Product as CardProduct } from "../components/ProductCard";

// ─── Shape renvoyée par l'API (/api/products) ────────────────────────────────

interface ProductMetadata {
  kind?: "bag" | "accessory";
  legacyId?: number;
  gradientFrom?: string;
  gradientTo?: string;
  colors?: { name: string; hex: string; isPattern?: boolean }[];
  rating?: number;
  reviews?: number;
  volume?: string;
  weather?: string[];
  tags?: string[];
  badge?: string;
  soldOut?: boolean;
  tagline?: string;
  accessoryCategory?: string;
  /** Puces de la fiche produit, saisies côté back-office (metadata). */
  features?: string[];
  extendedFeatures?: string[];
  sizing?: ProductSizing;
}

export interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  sku: string | null;
  /** Tarif applicable aujourd'hui : prix de précommande, prix promo, ou prix normal. */
  price: string | number;
  /** Prix normal brut, celui qui reprend la main dès qu'aucune fenêtre n'est
   *  ouverte. Contrairement à `compareAtPrice`, il est toujours renseigné : c'est
   *  lui qui permet d'annoncer le prix d'après la sortie d'une précommande. */
  basePrice?: string | number | null;
  compareAtPrice: string | number | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isPreorder: boolean;
  /** Calculé par l'API : le produit est en précommande *en ce moment*, c'est-à-dire
   *  coché « Précommande » et pas encore sorti. */
  isPreorderActive?: boolean;
  preorderStartsAt: string | null;
  releaseDate: string | null;
  currency: string;
  tags: string | null;
  /** Lien vers une vidéo TikTok du produit, saisi en back-office (facultatif). */
  tiktokUrl?: string | null;
  /** Titre et description SEO saisis en back-office ; à défaut on retombe sur le nom. */
  seoTitle?: string | null;
  seoDescription?: string | null;
  images: { url: string; alt?: string | null }[];
  category: { id: string; name: string; slug: string } | null;
  metadata: ProductMetadata | null;
  /** Moyenne des avis approuvés, calculée par l'API (0 si aucun avis). */
  rating?: number;
  /** Nombre d'avis approuvés — à préférer à `_count.reviews`, qui compte aussi
   *  les avis en attente de modération. */
  reviewCount?: number;
  _count?: { reviews: number };
}

interface Paginated<T> {
  items: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

/** Id numérique stable à partir du cuid (fallback quand pas de legacyId). */
function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const num = (v: string | number | null | undefined): number | undefined =>
  v === null || v === undefined ? undefined : Number(v);

/**
 * Un produit dont la date de sortie est passée n'est plus une précommande : il
 * rejoint le catalogue normal. C'est l'API qui tranche via `isPreorderActive` ;
 * le repli sur le drapeau brut couvre une réponse d'API plus ancienne.
 */
const isPreorderNow = (p: ApiProduct): boolean =>
  p.isPreorderActive ?? p.isPreorder;

// ─── Mappers API → shapes de cartes du front ─────────────────────────────────

export function toBagProduct(p: ApiProduct): BagProduct {
  const m = p.metadata ?? {};
  return {
    id: m.legacyId ?? hashId(p.id),
    productId: p.id,
    name: p.name,
    price: Number(p.price),
    basePrice: num(p.basePrice),
    compareAtPrice: num(p.compareAtPrice),
    isPreorder: isPreorderNow(p),
    releaseDate: p.releaseDate ?? undefined,
    // Note réelle calculée par l'API sur les avis approuvés ; metadata ne sert
    // plus que de repli pour les produits importés avec une note historique.
    rating: p.rating ?? m.rating ?? 0,
    reviews: p.reviewCount ?? m.reviews ?? 0,
    colors: m.colors ?? [],
    badge: m.badge,
    soldOut: m.soldOut ?? p.stock <= 0,
    gradientFrom: m.gradientFrom ?? "from-zinc-700",
    gradientTo: m.gradientTo ?? "to-zinc-900",
    tags: m.tags ?? (p.tags ? p.tags.split(",").filter(Boolean) : []),
    volume: m.volume,
    weather: m.weather,
    inStock: p.stock > 0,
    isNew: p.isNew,
    categorySlug: p.category?.slug,
    imageUrl: p.images?.[0]?.url,
    images: p.images?.map((i) => i.url),
  };
}

export function toAccessoryProduct(p: ApiProduct): AccessoryProduct {
  const m = p.metadata ?? {};
  return {
    id: m.legacyId ?? hashId(p.id),
    productId: p.id,
    name: p.name,
    price: Number(p.price),
    basePrice: num(p.basePrice),
    compareAtPrice: num(p.compareAtPrice),
    isPreorder: isPreorderNow(p),
    releaseDate: p.releaseDate ?? undefined,
    // Note réelle calculée par l'API sur les avis approuvés ; metadata ne sert
    // plus que de repli pour les produits importés avec une note historique.
    rating: p.rating ?? m.rating ?? 0,
    reviews: p.reviewCount ?? m.reviews ?? 0,
    // La sous-catégorie vient de la vraie catégorie du produit (back-office).
    // `metadata.accessoryCategory` n'est plus qu'un repli pour d'éventuels
    // produits non repris par la migration.
    category: p.category?.slug ?? m.accessoryCategory ?? "",
    colors: m.colors ?? [],
    gradientFrom: m.gradientFrom ?? "from-zinc-700",
    gradientTo: m.gradientTo ?? "to-zinc-900",
    imageUrl: p.images?.[0]?.url,
  };
}

export function toCardProduct(p: ApiProduct): CardProduct {
  const m = p.metadata ?? {};
  return {
    id: m.legacyId ?? hashId(p.id),
    productId: p.id,
    name: p.name,
    price: Number(p.price),
    basePrice: num(p.basePrice),
    compareAtPrice: num(p.compareAtPrice),
    isPreorder: isPreorderNow(p),
    releaseDate: p.releaseDate ?? undefined,
    // Note réelle calculée par l'API sur les avis approuvés ; metadata ne sert
    // plus que de repli pour les produits importés avec une note historique.
    rating: p.rating ?? m.rating ?? 0,
    reviews: p.reviewCount ?? m.reviews ?? 0,
    colors: (m.colors ?? []).map((c) => c.hex),
    badge: m.badge,
    imageUrl: p.images?.[0]?.url,
  };
}

export function toPreorderProduct(p: ApiProduct): PreorderProduct {
  const m = p.metadata ?? {};
  return {
    id: m.legacyId ?? hashId(p.id),
    productId: p.id,
    name: p.name,
    price: Number(p.price),
    basePrice: num(p.basePrice),
    compareAtPrice: num(p.compareAtPrice),
    releaseDate: p.releaseDate ?? new Date().toISOString(),
    tagline: m.tagline ?? "",
    colors: m.colors ?? [],
    gradientFrom: m.gradientFrom ?? "from-zinc-700",
    gradientTo: m.gradientTo ?? "to-zinc-900",
    imageUrl: p.images?.[0]?.url,
  };
}

// ─── Fetchers ────────────────────────────────────────────────────────────────

async function fetchAll(): Promise<ApiProduct[]> {
  const res = await api.get<Paginated<ApiProduct>>(
    "/products?limit=100&isActive=true",
  );
  return res.items;
}

/**
 * Sacs = produits rangés sous « Sacs » (ou une de ses sous-catégories).
 * Se baser sur `metadata.kind` faisait passer pour un sac tout produit créé
 * depuis l'admin, qui n'écrit pas ce champ.
 *
 * Les précommandes ne sont plus écartées : elles se mêlent au catalogue, où le
 * ruban « Précommande » et le compte à rebours les distinguent.
 */
export async function fetchBags(): Promise<BagProduct[]> {
  const [all, cats] = await Promise.all([fetchAll(), fetchCategories()]);
  const covered = new Set(categorySlugsWithDescendants(cats, "sacs"));
  return all
    .filter((p) => p.category?.slug && covered.has(p.category.slug))
    .map(toBagProduct);
}

/** Catalogue complet (tous produits actifs, précommandes comprises), pour /products. */
export async function fetchCatalog(): Promise<BagProduct[]> {
  const all = await fetchAll();
  return all.map(toBagProduct);
}

// ─── Catégories (gérées depuis le back-office) ───────────────────────────────

interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  imageUrl?: string | null;
  _count?: { products: number };
}

export interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  /** Visuel choisi en back-office ; absent = repli sur un dégradé. */
  imageUrl: string | null;
  /** Produits rattachés à cette catégorie seule (hors sous-catégories). */
  productCount: number;
}

/**
 * Catégories actives, triées, telles que définies dans le back-office.
 * L'API les renvoie à plat, tous niveaux confondus : filtrer avec `rootCategories`
 * / `childCategories` pour n'en afficher qu'un niveau.
 */
export async function fetchCategories(): Promise<StoreCategory[]> {
  const cats = await api.get<ApiCategory[]>("/categories");
  return cats
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentId: c.parentId ?? null,
      sortOrder: c.sortOrder ?? 0,
      imageUrl: c.imageUrl || null,
      productCount: c._count?.products ?? 0,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Catégories de premier niveau (Sacs, Accessoires…). */
export function rootCategories(cats: StoreCategory[]): StoreCategory[] {
  return cats.filter((c) => c.parentId === null);
}

/** Sous-catégories directes du parent désigné par son slug. */
export function childCategories(
  cats: StoreCategory[],
  parentSlug: string,
): StoreCategory[] {
  const parent = cats.find((c) => c.slug === parentSlug);
  if (!parent) return [];
  return cats.filter((c) => c.parentId === parent.id);
}

/**
 * Slugs couverts par une catégorie : elle-même + tous ses descendants.
 * Sans ça, filtrer sur « Accessoires » raterait les produits rangés dans
 * « Porte-clés », puisqu'ils ne portent que le slug de la sous-catégorie.
 */
export function categorySlugsWithDescendants(
  cats: StoreCategory[],
  slug: string,
): string[] {
  const root = cats.find((c) => c.slug === slug);
  if (!root) return [slug];
  const slugs = [root.slug];
  const queue = [root.id];
  while (queue.length) {
    const parentId = queue.shift()!;
    for (const c of cats) {
      if (c.parentId === parentId) {
        slugs.push(c.slug);
        queue.push(c.id);
      }
    }
  }
  return slugs;
}

/** Nombre de produits d'une catégorie, sous-catégories incluses. */
export function countInCategory(
  cats: StoreCategory[],
  slug: string,
  products: { categorySlug?: string }[],
): number {
  const covered = new Set(categorySlugsWithDescendants(cats, slug));
  return products.filter((p) => p.categorySlug && covered.has(p.categorySlug))
    .length;
}

/**
 * Accessoires = produits rangés sous « Accessoires » ou l'une de ses
 * sous-catégories. On se base sur la catégorie et non sur `metadata.kind`,
 * que le back-office n'écrit pas : un accessoire créé depuis l'admin serait
 * sinon absent de la page.
 */
export async function fetchAccessories(): Promise<AccessoryProduct[]> {
  const [all, cats] = await Promise.all([fetchAll(), fetchCategories()]);
  const covered = new Set(categorySlugsWithDescendants(cats, "accessoires"));
  return all
    .filter((p) => p.category?.slug && covered.has(p.category.slug))
    .map(toAccessoryProduct);
}

/**
 * Produits mis en avant (page d'accueil).
 *
 * `preorder` sépare les deux vitrines : `false` pour la sélection ordinaire,
 * `true` pour les précommandes. Le tri se fait côté API, avant la limite — un
 * découpage côté client priverait une vitrine de ses produits dès que l'autre
 * remplit les 8 premières places.
 */
export async function fetchFeatured(
  limit = 8,
  preorder?: boolean,
): Promise<CardProduct[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (preorder !== undefined) params.set("preorder", String(preorder));
  const products = await api.get<ApiProduct[]>(`/products/featured?${params}`);
  return products.map(toCardProduct);
}

/** Cartes "sacs" pour la page d'accueil. */
export async function fetchBagCards(limit = 8): Promise<CardProduct[]> {
  const [all, cats] = await Promise.all([fetchAll(), fetchCategories()]);
  const covered = new Set(categorySlugsWithDescendants(cats, "sacs"));
  return all
    .filter((p) => p.category?.slug && covered.has(p.category.slug))
    .slice(0, limit)
    .map(toCardProduct);
}

export async function fetchNewArrivals(): Promise<BagProduct[]> {
  const products = await api.get<ApiProduct[]>(
    "/products/new-arrivals?limit=50",
  );
  return products.map(toBagProduct);
}

/** Produits mis en avant (isFeatured), au format carte de collection. */
export async function fetchFeaturedBags(limit = 50): Promise<BagProduct[]> {
  const products = await api.get<ApiProduct[]>(
    `/products/featured?limit=${limit}`,
  );
  return products.map(toBagProduct);
}

export async function fetchPreorders(): Promise<PreorderProduct[]> {
  const products = await api.get<ApiProduct[]>("/products/preorders?limit=50");
  return products.map(toPreorderProduct);
}

/**
 * Fiche produit (PDP) résolue par handle = nameToHandle(nom).
 * Toujours construite depuis le catalogue du back-office (tous produits actifs :
 * sacs, accessoires, précommandes), sans aucune fiche écrite en dur.
 */
/**
 * Fiche produit construite uniquement à partir de l'API. Les champs que le
 * back-office ne renseigne pas restent vides : le rendu masque alors le bloc
 * correspondant, plutôt que d'afficher un texte générique.
 */
export function buildProductDetail(p: ApiProduct): ProductDetailData {
  const m = p.metadata ?? {};
  const gradientFrom = m.gradientFrom ?? "from-zinc-700";
  const gradientTo = m.gradientTo ?? "to-zinc-900";
  const legacyId = m.legacyId ?? hashId(p.id);
  const price = Number(p.price);
  const compareAtPrice = num(p.compareAtPrice);
  const preorder = isPreorderNow(p);
  // Une précommande n'a pas de stock à écouler : elle reste commandable même à
  // zéro, puisque le produit n'est pas encore fabriqué ou reçu.
  const available = preorder || p.stock > 0;

  const colors = m.colors ?? [];
  const variants: DetailVariant[] =
    colors.length > 0
      ? colors.map((c, i) => ({
          id: legacyId * 100 + i,
          name: c.name,
          hex: c.hex,
          isPattern: c.isPattern,
          price,
          compareAtPrice,
          available,
          gradientFrom,
          gradientTo,
        }))
      : // Sans coloris déclarés, un variant unique porte le prix et la dispo du
        // produit ; le sélecteur de couleur est masqué (hasColorVariants: false) et
        // le nom reste vide — c'est lui qui sert de libellé de coloris au panier.
        [
          {
            id: legacyId * 100,
            name: "",
            hex: "#111111",
            price,
            compareAtPrice,
            available,
            gradientFrom,
            gradientTo,
          },
        ];

  const galleryImages: GalleryImage[] = (p.images ?? []).map((img, i) => ({
    id: i + 1,
    gradientFrom,
    gradientTo,
    alt: img.alt ?? `${p.name} ${i + 1}`,
    url: img.url,
  }));

  const sizing =
    m.sizing && Object.values(m.sizing).some(Boolean) ? m.sizing : undefined;

  return {
    id: legacyId,
    productId: p.id,
    handle: nameToHandle(p.name),
    name: p.name,
    description: p.description ?? p.shortDescription ?? "",
    // Note réelle calculée par l'API sur les avis approuvés ; metadata ne sert
    // plus que de repli pour les produits importés avec une note historique.
    rating: p.rating ?? m.rating ?? 0,
    reviews: p.reviewCount ?? m.reviews ?? 0,
    gradientFrom,
    gradientTo,
    sku: p.sku ?? "",
    isPreorder: preorder,
    basePrice: num(p.basePrice),
    releaseDate: p.releaseDate ?? undefined,
    imageUrl: p.images?.[0]?.url,
    variants,
    hasColorVariants: colors.length > 0,
    features: m.features ?? [],
    extendedFeatures: m.extendedFeatures ?? [],
    sizing,
    collectionHandle: p.category?.slug ?? "products",
    collectionName: p.category?.name ?? "Boutique",
    galleryImages,
    tiktokUrl: p.tiktokUrl ?? undefined,
    seoTitle: p.seoTitle ?? undefined,
    seoDescription: p.seoDescription ?? undefined,
  };
}

export async function fetchProductDetail(
  handle: string,
): Promise<ProductDetailData | null> {
  const all = await fetchAll();
  // Trois clés acceptées : le slug de l'API, le handle calculé depuis le nom,
  // et l'ancien handle sans accents — les liens déjà partagés doivent continuer
  // d'ouvrir la fiche, même après la correction des URL.
  const match =
    all.find((p) => p.slug === handle) ??
    all.find((p) => nameToHandle(p.name) === handle) ??
    all.find((p) => legacyNameToHandle(p.name) === handle);
  return match ? buildProductDetail(match) : null;
}

/** Cartes « Vous aimerez aussi » (panier) — produits mis en avant du back-office. */
export interface RecommendationCardData {
  /** Id numérique local (clé de panier). */
  id: number;
  /** cuid produit côté API (résolution de commande sans lookup par nom). */
  productId: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
  gradientFrom: string;
  gradientTo: string;
}

export async function fetchRecommendations(
  limit = 8,
): Promise<RecommendationCardData[]> {
  const products = await api.get<ApiProduct[]>(
    `/products/featured?limit=${limit}`,
  );
  return products.map((p) => {
    const m = p.metadata ?? {};
    return {
      id: m.legacyId ?? hashId(p.id),
      productId: p.id,
      name: p.name,
      price: Number(p.price),
      compareAtPrice: num(p.compareAtPrice),
      imageUrl: p.images?.[0]?.url,
      gradientFrom: m.gradientFrom ?? "from-zinc-700",
      gradientTo: m.gradientTo ?? "to-zinc-900",
    };
  });
}

// ─── Carousel (page d'accueil, géré depuis le back-office) ───────────────────

export interface CarouselSlideApi {
  id: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  altText: string | null;
}

export async function fetchCarousel(): Promise<CarouselSlideApi[]> {
  return api.get<CarouselSlideApi[]>("/content/carousel");
}

// ─── Salon (services + galerie, gérés depuis le back-office) ─────────────────

export interface SalonServiceApi {
  id: string;
  name: string;
  description: string;
  priceFrom: number;
  gradientFrom: string;
  gradientTo: string;
}

export async function fetchSalonServices(): Promise<SalonServiceApi[]> {
  return api.get<SalonServiceApi[]>("/content/salon-services");
}

export interface SalonCatalogueApi {
  id: string;
  title: string;
  description: string | null;
  images: {
    id: string;
    imageUrl: string;
    alt: string | null;
    sortOrder: number;
  }[];
}

export async function fetchSalonCatalogues(): Promise<SalonCatalogueApi[]> {
  return api.get<SalonCatalogueApi[]>("/content/salon");
}

// ─── FAQ (accordéon, géré depuis le back-office) ─────────────────────────────

export interface AccordionItemApi {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
}

export async function fetchAccordion(): Promise<AccordionItemApi[]> {
  return api.get<AccordionItemApi[]>("/content/accordion");
}

// ─── Témoignages (avis clients approuvés) ────────────────────────────────────

export interface FeaturedReviewApi {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  author: string;
  productName: string;
  productSlug: string;
}

export async function fetchFeaturedReviews(
  limit = 6,
): Promise<FeaturedReviewApi[]> {
  return api.get<FeaturedReviewApi[]>(`/reviews/featured?limit=${limit}`);
}

export interface ProductReviewApi {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  author: string;
  createdAt: string;
}

/** Avis approuvés d'un produit (id = cuid API, pas l'id numérique local). */
export async function fetchProductReviews(
  productId: string,
): Promise<ProductReviewApi[]> {
  return api.get<ProductReviewApi[]>(`/reviews/products/${productId}`);
}

export interface NewProductReview {
  productId: string;
  rating: number;
  authorName: string;
  title?: string;
  body?: string;
}

/**
 * Dépose un avis depuis la boutique, sans compte client. L'avis part en attente
 * de modération : il n'apparaîtra qu'après validation dans /admin/reviews.
 */
export async function submitProductReview(
  review: NewProductReview,
): Promise<void> {
  await api.post<{ id: string; pending: boolean }>("/reviews/public", review);
}

// ─── Inscription à la communauté (public) ────────────────────────────────────

export interface NewSubscriber {
  firstName: string;
  lastName: string;
  phone: string;
  /** Facultatif : le canal principal reste le téléphone (WhatsApp/SMS). */
  email?: string;
}

/**
 * Inscrit un client aux notifications, promotions et jeux.
 * Un numéro déjà inscrit met simplement sa fiche à jour côté API : se
 * réinscrire n'est pas une erreur.
 */
export async function subscribe(input: NewSubscriber): Promise<void> {
  await api.post<{ id: string }>("/subscribers", input);
}

// ─── Réglages boutique (public) ──────────────────────────────────────────────

export type StoreSettings = Record<string, unknown>;

export async function fetchSettings(): Promise<StoreSettings> {
  return api.get<StoreSettings>("/settings");
}

// ─── Résolution panier → items de commande ───────────────────────────────────

export interface OrderItemPayload {
  productId: string;
  quantity: number;
}

export interface ResolvedOrder {
  /** Items prêts pour POST /api/orders. */
  orderItems: OrderItemPayload[];
  /** Noms des articles non retrouvés côté API (à exclure de la commande en ligne). */
  unresolved: string[];
}

/**
 * Convertit les articles du panier en items de commande.
 * Priorité au `productId` (cuid) porté par l'article ; sinon résolution par nom
 * contre le catalogue API. Les articles non résolus sont listés à part.
 */
export async function resolveCartToOrder(
  items: { productId?: string; name: string; quantity: number }[],
): Promise<ResolvedOrder> {
  const needsLookup = items.some((i) => !i.productId);
  const byName = new Map<string, string>();
  if (needsLookup) {
    const all = await fetchAll();
    for (const p of all) byName.set(p.name.trim().toLowerCase(), p.id);
  }

  const orderItems: OrderItemPayload[] = [];
  const unresolved: string[] = [];
  for (const it of items) {
    const pid = it.productId ?? byName.get(it.name.trim().toLowerCase());
    if (pid) orderItems.push({ productId: pid, quantity: it.quantity });
    else unresolved.push(it.name);
  }
  return { orderItems, unresolved };
}
