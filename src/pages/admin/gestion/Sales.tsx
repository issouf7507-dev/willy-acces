import { useEffect, useMemo, useState } from 'react'
import { api } from '../../../lib/api'
import { Receipt, X, ShoppingCart, Globe } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { StatCard } from '@/components/admin/stat-card'
import { Segmented } from '@/components/admin/segmented'
import { DataTable, type Column } from '@/components/admin/data-table'
import { ErrorState } from '@/components/admin/empty-state'
import { StatusBadge, PAYMENT_STATUS } from '@/components/admin/status-badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Channel = 'ONLINE' | 'IN_STORE'
type PaymentMethod = 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CARD' | 'OTHER'

interface SaleItem {
  id: string
  name: string
  sku: string | null
  quantity: number
  price: string | number
  discountAmount: string | number
  discountReason: string | null
  total: string | number
}

interface Sale {
  id: string
  orderNumber: string
  channel: Channel
  status: string
  subtotal: string | number
  discountAmount: string | number
  total: string | number
  notes: string | null
  createdAt: string
  items: SaleItem[]
  store: { id: string; name: string } | null
  seller: { id: string; name: string } | null
  customer: { id: string; name: string; phone: string | null } | null
  payment: { method: PaymentMethod; status: string } | null
}

interface StoreOption { id: string; name: string }

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Espèces',
  MOBILE_MONEY: 'Mobile Money',
  BANK_TRANSFER: 'Virement',
  CARD: 'Carte',
  OTHER: 'Autre',
}

const CHANNELS = [
  { id: '', label: 'Tous' },
  { id: 'IN_STORE', label: 'Comptoir' },
  { id: 'ONLINE', label: 'En ligne' },
] as const satisfies readonly { id: '' | Channel; label: string }[]

const RANGES = [
  { id: '0',  label: "Aujourd'hui" },
  { id: '7',  label: '7 jours' },
  { id: '30', label: '30 jours' },
  { id: '90', label: '90 jours' },
] as const

const n = (v: string | number | null | undefined) => (v == null ? 0 : Number(v))
const fcfa = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' F'

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([])
  const [stores, setStores] = useState<StoreOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState<Sale | null>(null)

  const [range, setRange] = useState(30)
  const [storeId, setStoreId] = useState('')
  const [sellerId, setSellerId] = useState('')
  const [channel, setChannel] = useState<'' | Channel>('')

  useEffect(() => {
    api.get<StoreOption[]>('/gestion/stores').then(setStores).catch(() => setStores([]))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      from: isoDaysAgo(range),
      to: isoDaysAgo(0),
      limit: '200',
    })
    if (storeId) params.set('storeId', storeId)
    if (sellerId) params.set('sellerId', sellerId)
    if (channel) params.set('channel', channel)

    api.get<Sale[]>(`/gestion/sales?${params}`)
      .then((list) => { setSales(list); setError('') })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [range, storeId, sellerId, channel])

  /**
   * Les vendeuses proposées viennent des ventes affichées : la liste des
   * comptes est réservée au super administrateur, et on n'a besoin ici que de
   * celles qui ont réellement encaissé.
   */
  const sellers = useMemo(() => {
    const seen = new Map<string, string>()
    for (const s of sales) if (s.seller) seen.set(s.seller.id, s.seller.name)
    return [...seen].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [sales])

  const totals = useMemo(() => ({
    count: sales.length,
    revenue: sales.reduce((sum, s) => sum + n(s.total), 0),
    discount: sales.reduce((sum, s) => sum + n(s.discountAmount), 0),
  }), [sales])

  const columns: Column<Sale>[] = [
    {
      key: 'order',
      header: 'Vente',
      label: 'Vente',
      sortBy: (s) => s.orderNumber,
      cell: (s) => (
        <span className="flex items-center gap-1.5 whitespace-nowrap font-mono text-xs">
          {s.channel === 'ONLINE'
            ? <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            : <ShoppingCart className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          {s.orderNumber}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      label: 'Date',
      sortBy: (s) => s.createdAt,
      cell: (s) => <span className="whitespace-nowrap text-muted-foreground">{dateTime(s.createdAt)}</span>,
    },
    {
      key: 'store',
      header: 'Boutique',
      label: 'Boutique',
      hideOnMobile: true,
      sortBy: (s) => s.store?.name ?? null,
      cell: (s) => s.store?.name ?? '—',
    },
    {
      key: 'seller',
      header: 'Vendeuse',
      label: 'Vendeuse',
      hideOnMobile: true,
      sortBy: (s) => s.seller?.name ?? null,
      cell: (s) => s.seller?.name ?? '—',
    },
    {
      key: 'customer',
      header: 'Client',
      label: 'Client',
      hideOnMobile: true,
      sortBy: (s) => s.customer?.name ?? null,
      cell: (s) => s.customer?.name ?? <span className="text-muted-foreground">Client de passage</span>,
    },
    {
      key: 'items',
      header: 'Articles',
      label: 'Articles',
      align: 'right',
      hideOnMobile: true,
      sortBy: (s) => s.items.reduce((sum, i) => sum + i.quantity, 0),
      cell: (s) => (
        <span className="tabular-nums text-muted-foreground">
          {s.items.reduce((sum, i) => sum + i.quantity, 0)}
        </span>
      ),
    },
    {
      key: 'discount',
      header: 'Remise',
      label: 'Remise',
      align: 'right',
      hideOnMobile: true,
      sortBy: (s) => n(s.discountAmount),
      cell: (s) => (
        <span className={cn('whitespace-nowrap tabular-nums', n(s.discountAmount) > 0 ? 'text-warning' : 'text-muted-foreground/40')}>
          {n(s.discountAmount) > 0 ? fcfa(n(s.discountAmount)) : '—'}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      label: 'Total',
      align: 'right',
      sortBy: (s) => n(s.total),
      cell: (s) => <span className="whitespace-nowrap font-semibold tabular-nums">{fcfa(n(s.total))}</span>,
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Ventes"
        description="Chaque encaissement, comptoir et site confondus. Pour les totaux par jour, voir Recettes."
        actions={
          <Segmented
            value={String(range)}
            options={RANGES}
            onChange={(id) => setRange(Number(id))}
            ariaLabel="Période"
          />
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Ventes" value={totals.count} />
        <StatCard label="Recette" value={fcfa(totals.revenue)} />
        <StatCard
          label="Remises accordées"
          value={fcfa(totals.discount)}
          tone={totals.discount > 0 ? 'warning' : 'default'}
        />
      </div>

      {error && <ErrorState message={error} />}

      <DataTable
        rows={sales}
        columns={columns}
        getRowId={(s) => s.id}
        loading={loading}
        onRowClick={setOpen}
        columnsToggle
        searchIn={(s) => [s.orderNumber, s.customer?.name, s.seller?.name, s.store?.name]}
        searchPlaceholder="Numéro, client, vendeuse…"
        toolbar={
          <>
            <Segmented
              value={channel}
              options={CHANNELS}
              onChange={setChannel}
              ariaLabel="Filtrer par canal"
            />

            <Select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              aria-label="Filtrer par boutique"
              className="w-auto"
            >
              <option value="">Toutes les boutiques</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>

            <Select
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              aria-label="Filtrer par vendeuse"
              className="w-auto"
            >
              <option value="">Toutes les vendeuses</option>
              {sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </>
        }
        pagination={
          <>
            <span className="text-sm tabular-nums text-muted-foreground">
              {totals.count} vente(s) sur la période
            </span>
            <span className="text-sm text-muted-foreground">
              Total encaissé{' '}
              <span className="font-semibold tabular-nums text-foreground">{fcfa(totals.revenue)}</span>
            </span>
          </>
        }
        empty={{
          icon: Receipt,
          title: 'Aucune vente sur la période',
          description: 'Élargissez la période ou retirez un filtre.',
        }}
      />

      {open && <SaleDetail sale={open} onClose={() => setOpen(null)} />}
    </div>
  )
}

function SaleDetail({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <Card
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 font-semibold">
              {sale.orderNumber}
              <Badge variant={sale.channel === 'ONLINE' ? 'info' : 'secondary'}>
                {sale.channel === 'ONLINE' ? 'En ligne' : 'Comptoir'}
              </Badge>
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {dateTime(sale.createdAt)}
              {sale.store && ` · ${sale.store.name}`}
              {sale.seller && ` · ${sale.seller.name}`}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-5 p-6">
          {sale.customer && (
            <div className="text-sm">
              <p>{sale.customer.name}</p>
              {sale.customer.phone && (
                <p className="text-muted-foreground">{sale.customer.phone}</p>
              )}
            </div>
          )}

          <div className="divide-y divide-border rounded-xl border border-border">
            {sale.items.map((i) => (
              <div key={i.id} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate">
                    <span className="tabular-nums text-muted-foreground">{i.quantity} × </span>
                    {i.name}
                  </p>
                  {n(i.discountAmount) > 0 && (
                    <p className="text-xs text-warning">
                      − {fcfa(n(i.discountAmount))}
                      {i.discountReason && ` · ${i.discountReason}`}
                    </p>
                  )}
                </div>
                <span className="shrink-0 font-medium tabular-nums">{fcfa(n(i.total))}</span>
              </div>
            ))}
          </div>

          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Sous-total</dt>
              <dd className="tabular-nums">{fcfa(n(sale.subtotal))}</dd>
            </div>
            {n(sale.discountAmount) > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Remises</dt>
                <dd className="tabular-nums text-warning">− {fcfa(n(sale.discountAmount))}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-border pt-2">
              <dt className="font-medium">Total encaissé</dt>
              <dd className="text-xl font-bold tabular-nums">{fcfa(n(sale.total))}</dd>
            </div>
            {sale.payment && (
              <div className="flex items-center justify-between pt-2">
                <dt className="text-muted-foreground">Paiement</dt>
                <dd className="flex items-center gap-2">
                  <span>{PAYMENT_LABEL[sale.payment.method] ?? sale.payment.method}</span>
                  <StatusBadge status={sale.payment.status} map={PAYMENT_STATUS} />
                </dd>
              </div>
            )}
          </dl>

          {sale.notes && <p className="text-sm italic text-muted-foreground">{sale.notes}</p>}
        </div>
      </Card>
    </div>
  )
}
