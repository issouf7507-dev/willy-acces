import { Badge } from '@/components/ui/badge'

type Variant = React.ComponentProps<typeof Badge>['variant']

interface StatusDef { variant: Variant; label: string }

/**
 * Statuts de commande. Cette table était recopiée à l'identique dans
 * Commandes, le tableau de bord et Ventes — trois endroits à corriger le jour
 * où un statut change de nom.
 */
const ORDER_STATUS: Record<string, StatusDef> = {
  PENDING:    { variant: 'warning',     label: 'En attente' },
  CONFIRMED:  { variant: 'info',        label: 'Confirmée' },
  PROCESSING: { variant: 'purple',      label: 'En cours' },
  SHIPPED:    { variant: 'indigo',      label: 'Expédiée' },
  DELIVERED:  { variant: 'success',     label: 'Livrée' },
  CANCELLED:  { variant: 'destructive', label: 'Annulée' },
  REFUNDED:   { variant: 'secondary',   label: 'Remboursée' },
}

/** Statuts d'arrivage. */
const SHIPMENT_STATUS: Record<string, StatusDef> = {
  DRAFT:     { variant: 'warning',   label: 'En attente' },
  PARTIAL:   { variant: 'info',      label: 'Partiel' },
  RECEIVED:  { variant: 'success',   label: 'Complet' },
  CANCELLED: { variant: 'secondary', label: 'Annulé' },
}

/** États de paiement. */
const PAYMENT_STATUS: Record<string, StatusDef> = {
  PENDING:  { variant: 'warning',     label: 'À encaisser' },
  PAID:     { variant: 'success',     label: 'Payée' },
  FAILED:   { variant: 'destructive', label: 'Échouée' },
  REFUNDED: { variant: 'secondary',   label: 'Remboursée' },
}

interface StatusBadgeProps {
  status: string
  /** Table à utiliser. Par défaut celle des commandes. */
  map?: Record<string, StatusDef>
  className?: string
}

/**
 * Pastille de statut. Un statut inconnu s'affiche tel quel plutôt que de
 * disparaître : mieux vaut une valeur brute qu'un trou silencieux.
 */
function StatusBadge({ status, map = ORDER_STATUS, className }: StatusBadgeProps) {
  const def = map[status]
  return (
    <Badge variant={def?.variant ?? 'secondary'} className={className}>
      {def?.label ?? status}
    </Badge>
  )
}

export { StatusBadge, ORDER_STATUS, SHIPMENT_STATUS, PAYMENT_STATUS }
