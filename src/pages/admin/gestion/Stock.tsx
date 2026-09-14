import { useEffect, useMemo, useState } from 'react'
import { api } from '../../../lib/api'
import { Boxes, Search, AlertTriangle, Flame, History } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { EmptyState, ErrorState, LoadingState } from '@/components/admin/empty-state'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface StockRow {
  productId: string
  name: string
  sku: string | null
  received: number
  sold: number
  stock: number
  theoreticalStock: number
  costPrice: number | null
  avgSalePrice: number | null
  unitMargin: number | null
  totalMargin: number | null
  sold30: number
  lowStockAlert: number
  needsRestock: boolean
  suggestPromo: boolean
  /** Répartition du stock par boutique ; celles à zéro sont absentes. */
  byStore: Record<string, number>
}

interface StoreOption { id: string; name: string }

interface PriceChange {
  id: string
  productName: string
  oldPrice: number
  newPrice: number
  delta: number
  ratio: number | null
  changedBy: string | null
  createdAt: string
}

const FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'restock', label: 'À commander' },
  { id: 'promo', label: 'À promouvoir' },
] as const
type FilterId = (typeof FILTERS)[number]['id']

const fcfa = (v: number | null) =>
  v === null ? '—' : v.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' F'

export default function Stock() {
  const [rows, setRows] = useState<StockRow[]>([])
  const [stores, setStores] = useState<StoreOption[]>([])
  const [changes, setChanges] = useState<PriceChange[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterId>('all')

  useEffect(() => {
    api.get<{ stores: StoreOption[]; rows: StockRow[] }>('/gestion/reports/stock')
      .then((d) => { setStores(d.stores); setRows(d.rows) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
    // Une marge qui bouge s'explique souvent par un prix qui a changé :
    // l'historique a sa place ici, pas dans un écran séparé.
    api.get<PriceChange[]>('/gestion/reports/price-history?limit=20')
      .then(setChanges)
      .catch(() => setChanges([]))
  }, [])

  const filtered = useMemo(() => {
    let out = rows
    if (filter === 'restock') out = out.filter((r) => r.needsRestock)
    if (filter === 'promo') out = out.filter((r) => r.suggestPromo)
    if (search.trim()) {
      const q = search.toLowerCase()
      out = out.filter((r) => r.name.toLowerCase().includes(q) || r.sku?.toLowerCase().includes(q))
    }
    return out
  }, [rows, filter, search])

  const restockCount = rows.filter((r) => r.needsRestock).length
  const promoCount = rows.filter((r) => r.suggestPromo).length
  // Un produit reçu par arrivage dont le stock ne colle pas au « reçu − vendu »
  // porte du stock entré autrement (état initial, ajustement, vente non suivie).
  const drifting = rows.filter((r) => r.received > 0 && r.stock !== r.theoreticalStock)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Stock & marges"
        description="La marge part du coût de revient, transport inclus."
      />

      {error && <ErrorState message={error} />}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
            placeholder="Rechercher un produit…"
            className="pl-9"
            aria-label="Rechercher un produit"
          />
        </div>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                filter === f.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {f.label}
              {f.id === 'restock' && restockCount > 0 && <span className="ml-1 text-warning">{restockCount}</span>}
              {f.id === 'promo' && promoCount > 0 && <span className="ml-1 text-warning">{promoCount}</span>}
            </button>
          ))}
        </div>
      </div>

      {drifting.length > 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>
            {drifting.length} produit(s) dont le stock ne correspond pas à « reçu − vendu ».
            Du stock y est entré hors arrivage (état initial, ajustement manuel), ou des sorties
            ne sont pas suivies.
          </span>
        </div>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingState />
        ) : !filtered.length ? (
          <EmptyState
            icon={Boxes}
            title="Aucun produit"
            description={
              search || filter !== 'all'
                ? 'Aucun produit ne correspond à ce filtre.'
                : 'Les produits du catalogue apparaîtront ici avec leurs marges.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Produit</th>
                  <th className="text-right font-medium px-3 py-3">Reçu</th>
                  <th className="text-right font-medium px-3 py-3">Vendu</th>
                  <th className="text-right font-medium px-3 py-3">Stock</th>
                  {stores.map((st) => (
                    <th key={st.id} className="text-right font-medium px-3 py-3 whitespace-nowrap">
                      {st.name}
                    </th>
                  ))}
                  <th className="text-right font-medium px-3 py-3">Revient</th>
                  <th className="text-right font-medium px-3 py-3">Vente moy.</th>
                  <th className="text-right font-medium px-3 py-3">Marge/u</th>
                  <th className="text-right font-medium px-3 py-3">Marge totale</th>
                  <th className="text-right font-medium px-3 py-3">30 j</th>
                  <th className="text-left font-medium px-5 py-3">Alerte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r) => (
                  <tr key={r.productId} className="transition-colors hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <span>{r.name}</span>
                      {r.sku && <span className="block text-xs text-muted-foreground">{r.sku}</span>}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">{r.received}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">{r.sold}</td>
                    <td className="px-3 py-3 text-right font-medium tabular-nums">
                      {r.stock}
                      {r.received > 0 && r.stock !== r.theoreticalStock && (
                        <span className="block text-[11px] text-warning" title="Reçu − vendu">
                          ≠ {r.theoreticalStock}
                        </span>
                      )}
                    </td>
                    {stores.map((st) => {
                      const q = r.byStore[st.id] ?? 0
                      return (
                        <td key={st.id} className={`px-3 py-3 text-right tabular-nums ${
                          q === 0 ? 'text-muted-foreground/40' : 'text-muted-foreground'
                        }`}>
                          {q}
                        </td>
                      )
                    })}
                    <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">{fcfa(r.costPrice)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">{fcfa(r.avgSalePrice)}</td>
                    <td className={cn(
                      'px-3 py-3 text-right font-medium tabular-nums',
                      r.unitMargin === null ? 'text-muted-foreground/40'
                        : r.unitMargin < 0 ? 'text-destructive' : 'text-success',
                    )}>
                      {fcfa(r.unitMargin)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{fcfa(r.totalMargin)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">{r.sold30}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {r.needsRestock && (
                          <Badge variant="warning" className="gap-1 px-2 py-0 text-[11px]">
                            <AlertTriangle className="h-3 w-3" /> Commander
                          </Badge>
                        )}
                        {r.suggestPromo && (
                          <Badge variant="purple" className="gap-1 px-2 py-0 text-[11px]">
                            <Flame className="h-3 w-3" /> Promouvoir
                          </Badge>
                        )}
                        {!r.needsRestock && !r.suggestPromo && (
                          <span className="text-xs text-muted-foreground/40">OK</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {changes.length > 0 && (
        <Card className="mt-6 overflow-hidden">
          <h2 className="flex items-center gap-2 border-b border-border px-6 py-4 font-semibold">
            <History className="h-4 w-4 text-muted-foreground" /> Derniers changements de prix
          </h2>
          <div className="divide-y divide-border">
            {changes.map((c) => (
              <div key={c.id} className="flex items-center gap-4 px-6 py-3">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm">{c.productName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    {c.changedBy ? ` · ${c.changedBy}` : ''}
                  </p>
                </div>
                <span className="text-sm tabular-nums text-muted-foreground">{fcfa(c.oldPrice)}</span>
                <span className="text-muted-foreground/40">→</span>
                <span className="text-sm font-medium tabular-nums">{fcfa(c.newPrice)}</span>
                <span className={cn('w-16 text-right text-xs tabular-nums', c.delta >= 0 ? 'text-success' : 'text-warning')}>
                  {c.delta >= 0 ? '+' : ''}{c.ratio !== null ? `${(c.ratio * 100).toFixed(1)} %` : fcfa(c.delta)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
