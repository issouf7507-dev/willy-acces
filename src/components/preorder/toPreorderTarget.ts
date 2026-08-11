import type { PreorderProduct } from '../../data/preorders'
import type { PreorderTarget } from '../../context/PreorderContext'

/** Traduit une précommande vers la cible du formulaire de réservation. */
export function toPreorderTarget(product: PreorderProduct): PreorderTarget {
  return {
    productId: product.productId,
    name: product.name,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    releaseDate: product.releaseDate,
    imageUrl: product.imageUrl,
    colors: product.colors.map((c) => ({ name: c.name, hex: c.hex })),
  }
}
