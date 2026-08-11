import { formatPrice } from '../../lib/utils'

/**
 * Prix d'une précommande. Quand un tarif de précommande est en place, les deux
 * montants sont annoncés côte à côte et étiquetés : ce qu'on paie maintenant, et
 * ce que le produit coûtera une fois sorti. Sans tarif dédié, il n'y a qu'un
 * prix — afficher deux fois le même n'apprendrait rien.
 *
 * `compareAtPrice` porte le prix normal, celui qui reprend la main à la sortie.
 */
export default function PreorderPrice({
  price,
  compareAtPrice,
  size = 'sm',
}: {
  price: number
  compareAtPrice?: number
  size?: 'sm' | 'lg'
}) {
  const hasDeal = !!compareAtPrice && compareAtPrice > price
  const amount = size === 'lg' ? 'text-lg' : 'text-sm'

  if (!hasDeal) {
    return <span className={`${amount} font-semibold`}>{formatPrice(price)}</span>
  }

  return (
    <div className="space-y-0.5">
      <div className="flex items-baseline gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 w-[5.5rem] shrink-0">
          Précommande
        </span>
        <span className={`${amount} font-semibold`}>{formatPrice(price)}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 w-[5.5rem] shrink-0">
          À la sortie
        </span>
        {/* Pas de texte barré ici : ce montant n'est pas un ancien prix annulé,
            c'est celui qui s'appliquera après la date de sortie. */}
        <span className="text-sm text-zinc-500">{formatPrice(compareAtPrice!)}</span>
      </div>
    </div>
  )
}
