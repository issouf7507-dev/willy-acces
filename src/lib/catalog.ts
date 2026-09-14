import { api } from './api'

/** Une page de `/products`, réduite à ce dont les listes déroulantes ont besoin. */
interface ProductPage<T> {
  items: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

/** Plafond imposé par `ProductQuerySchema` côté API : au-delà, la requête est refusée. */
const PAGE_SIZE = 100

/** Garde-fou : 20 pages, soit 2 000 produits, largement au-dessus du catalogue. */
const MAX_PAGES = 20

/**
 * Le catalogue entier, pour les sélecteurs de produit du back-office (caisse,
 * arrivages).
 *
 * `/products` plafonne `limit` à 100 : demander davantage ne tronque pas la
 * liste, l'API refuse la requête (422) et le sélecteur se retrouvait vide sans
 * le moindre message. On enchaîne donc les pages jusqu'à `totalPages`.
 */
export async function fetchAllProducts<T>(): Promise<T[]> {
  const first = await api.get<ProductPage<T>>(`/products?limit=${PAGE_SIZE}&page=1`)
  const items = [...first.items]

  const pages = Math.min(first.meta?.totalPages ?? 1, MAX_PAGES)
  for (let page = 2; page <= pages; page++) {
    const next = await api.get<ProductPage<T>>(`/products?limit=${PAGE_SIZE}&page=${page}`)
    items.push(...next.items)
  }

  return items
}
