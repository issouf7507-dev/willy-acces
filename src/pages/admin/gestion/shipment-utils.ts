/**
 * Types et calculs partagés par les pages Arrivages et Groupes.
 *
 * Un arrivage est une commande (A1, A2…) ; chaque livraison qui en arrive
 * forme un groupe (G1, G2…) avec son propre transport.
 */

export type ShipmentStatus = 'DRAFT' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED'
export type GroupStatus = 'DRAFT' | 'RECEIVED'

export interface ShipmentItem {
  id: string
  productId: string
  storeId: string
  store: { id: string; name: string }
  /** Quantité commandée. */
  quantity: number
  unitCost: string | number
  plannedPrice: string | number | null
  product: { id: string; name: string; sku: string | null; stock: number }
}

export interface ShipmentGroupSummary {
  id: string
  code: string
  label: string | null
  status: GroupStatus
  shippingCost: string | number
  receivedAt: string | null
  items: { shipmentItemId: string; quantity: number }[]
}

export interface Shipment {
  id: string
  code: string
  label: string | null
  storeId: string | null
  store: { id: string; name: string } | null
  status: ShipmentStatus
  orderedAt: string | null
  receivedAt: string | null
  notes: string | null
  items: ShipmentItem[]
  groups: ShipmentGroupSummary[]
}

export const SHIPMENT_BADGE: Record<ShipmentStatus, string> = {
  DRAFT: 'bg-warning/15 text-warning',
  PARTIAL: 'bg-info/15 text-info',
  RECEIVED: 'bg-success/15 text-success',
  CANCELLED: 'bg-muted text-muted-foreground',
}
export const SHIPMENT_LABEL: Record<ShipmentStatus, string> = {
  DRAFT: 'En attente',
  PARTIAL: 'Partiel',
  RECEIVED: 'Complet',
  CANCELLED: 'Annulé',
}

export const GROUP_BADGE: Record<GroupStatus, string> = {
  DRAFT: 'bg-warning/15 text-warning',
  RECEIVED: 'bg-success/15 text-success',
}
export const GROUP_LABEL: Record<GroupStatus, string> = {
  DRAFT: 'Brouillon',
  RECEIVED: 'Réceptionné',
}

export const input =
  'w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring'

export const n = (v: string | number | null | undefined) => (v == null ? 0 : Number(v))
export const fcfa = (v: string | number | null | undefined) =>
  n(v).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' F'

export const isOpen = (s: Shipment) => s.status === 'DRAFT' || s.status === 'PARTIAL'
export const hasReceivedGroup = (s: Shipment) => s.groups.some((g) => g.status === 'RECEIVED')

const sumFor = (groups: ShipmentGroupSummary[], itemId: string) =>
  groups.reduce(
    (sum, g) => sum + g.items.filter((l) => l.shipmentItemId === itemId).reduce((s, l) => s + l.quantity, 0),
    0,
  )

/** Quantité d'une ligne déjà réceptionnée. */
export const receivedQty = (s: Shipment, itemId: string) =>
  sumFor(s.groups.filter((g) => g.status === 'RECEIVED'), itemId)

/**
 * Reste à livrer d'une ligne : commandé moins ce que les groupes ont déjà
 * pris, reçus ou en brouillon. `exceptGroupId` exclut le groupe en cours
 * d'édition, dont les quantités sont justement à redéfinir.
 */
export const remainingQty = (s: Shipment, item: ShipmentItem, exceptGroupId?: string) =>
  item.quantity - sumFor(s.groups.filter((g) => g.id !== exceptGroupId), item.id)

export const orderedTotal = (s: Shipment) => s.items.reduce((sum, i) => sum + i.quantity, 0)
export const receivedTotal = (s: Shipment) => s.items.reduce((sum, i) => sum + receivedQty(s, i.id), 0)
