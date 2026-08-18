/**
 * Frais de service appliqués à la validation d'un panier — commande normale
 * comme précommande, sur le web comme sur le mobile.
 *
 * Le montant annoncé au client doit être identique partout : c'est ce qu'il
 * verra sur son récapitulatif WhatsApp et, pour une précommande, ce qu'il
 * réglera par Wave. D'où ce calcul unique plutôt qu'un « × 1.01 » recopié.
 */
export const SERVICE_FEE_RATE = 0.01

/** Arrondi au franc : le FCFA n'a pas de subdivision. */
export function serviceFee(subtotal: number): number {
  return Math.round(subtotal * SERVICE_FEE_RATE)
}

export function totalWithServiceFee(subtotal: number): number {
  return subtotal + serviceFee(subtotal)
}

/** Libellé affiché à côté du montant, ex. « Frais de service (1 %) ». */
export const SERVICE_FEE_LABEL = `Frais de service (${SERVICE_FEE_RATE * 100} %)`
