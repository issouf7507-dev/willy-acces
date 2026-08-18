/**
 * Commande via WhatsApp — unique canal de commande (web et mobile).
 *
 * Le numéro est surchargeable depuis le back-office (réglage `whatsappNumber`) ;
 * cette constante sert de repli tant que le réglage n'est pas renseigné.
 * Format attendu par wa.me : indicatif pays + numéro, sans « + » ni séparateurs.
 */
export const DEFAULT_WHATSAPP_NUMBER = '2250101016919'

/** Ne garde que les chiffres : wa.me refuse « + », espaces et tirets. */
export function toWhatsappDigits(number: string): string {
  return number.replace(/\D/g, '')
}

export function whatsappHref(number: string, message: string): string {
  return `https://wa.me/${toWhatsappDigits(number)}?text=${encodeURIComponent(message)}`
}

export interface WhatsappOrderLine {
  name: string
  quantity: number
  /** Total de la ligne, déjà formaté (ex. « 25 000 F CFA »). */
  lineTotal: string
  variant?: string
}

export interface WhatsappOrderDetails {
  items: WhatsappOrderLine[]
  /** Montant des articles avant frais, déjà formaté. Omis, seul le total sort. */
  subtotal?: string
  /** Frais de service, déjà formatés, affichés avec leur libellé. */
  serviceFee?: { label: string; amount: string }
  /** Montant final réclamé au client, frais compris, déjà formaté. */
  total: string
  name?: string
  phone?: string
  email?: string
  address?: string
  couponCode?: string
  notes?: string
}

/** Récapitulatif lisible tel qu'il arrivera dans la conversation WhatsApp. */
export function buildWhatsappOrderMessage(d: WhatsappOrderDetails): string {
  const lines = [
    'Bonjour, je souhaite passer commande :',
    '',
    ...d.items.map(
      i => `• ${i.quantity} x ${i.name}${i.variant ? ` (${i.variant})` : ''} — ${i.lineTotal}`,
    ),
    '',
    // Le détail n'apparaît que si des frais s'appliquent : le client doit
    // pouvoir refaire le calcul, sans alourdir le message quand il n'y a rien
    // à détailler.
    ...(d.subtotal && d.serviceFee
      ? [`Sous-total : ${d.subtotal}`, `${d.serviceFee.label} : ${d.serviceFee.amount}`]
      : []),
    `Total : ${d.total}`,
  ]

  const contact: string[] = []
  if (d.name) contact.push(`Nom : ${d.name}`)
  if (d.phone) contact.push(`Téléphone : ${d.phone}`)
  if (d.email) contact.push(`E-mail : ${d.email}`)
  if (d.address) contact.push(`Adresse : ${d.address}`)
  if (d.couponCode) contact.push(`Code promo : ${d.couponCode}`)
  if (d.notes) contact.push(`Note : ${d.notes}`)
  if (contact.length) lines.push('', ...contact)

  return lines.join('\n')
}
