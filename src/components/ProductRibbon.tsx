/**
 * Ruban posé sur l'image d'une carte produit : « PRÉCOMMANDE » ou « PROMO -X% ».
 *
 * La précommande passe devant la promo, comme pour le calcul du prix côté API :
 * un produit pas encore sorti est d'abord une précommande, même si son tarif est
 * avantageux. Afficher les deux rubans brouillerait le message.
 *
 * Placé en haut à droite pour ne pas se superposer aux badges existants
 * (« Nouveau », « Épuisé »…), qui occupent tous le coin haut gauche. La carte
 * parente doit être en `relative` et le conteneur d'image en `overflow-hidden`.
 */
export default function ProductRibbon({
  price,
  compareAtPrice,
  isPreorder = false,
}: {
  price: number
  compareAtPrice?: number
  isPreorder?: boolean
}) {
  if (isPreorder) {
    return (
      <span className="absolute top-3 right-3 z-10 bg-zinc-900 text-white text-xs font-bold px-2.5 py-1 uppercase tracking-wide shadow-sm">
        Précommande
      </span>
    )
  }

  // Une « remise » nulle ou négative n'en est pas une : on n'affiche rien
  // plutôt qu'un ruban « -0% ».
  if (!compareAtPrice || compareAtPrice <= price) return null

  const discount = Math.round(((compareAtPrice - price) / compareAtPrice) * 100)

  return (
    <span className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 uppercase tracking-wide shadow-sm">
      Promo
      {discount > 0 && <span className="tabular-nums">−{discount}%</span>}
    </span>
  )
}
