import { useEffect, useState, useCallback } from 'react'
import { api } from '../../lib/api'
import {
  Search, Loader2, ShoppingBag, ChevronDown, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { DataTable, type Column } from '@/components/admin/data-table'
import { Segmented } from '@/components/admin/segmented'
import { StatusBadge } from '@/components/admin/status-badge'
import { Input, Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface Order {
  id: string; orderNumber: string; total: number | string; status: string
  createdAt: string; customerName: string | null; customerPhone: string | null
  items: { quantity: number }[]
}

interface PageData {
  items: Order[]
  meta: { total: number; page: number; totalPages: number }
}

const STATUSES = [
  { value: '', label: 'Tous' },
  { value: 'PENDING',    label: 'En attente' },
  { value: 'CONFIRMED',  label: 'Confirmée' },
  { value: 'PROCESSING', label: 'En cours' },
  { value: 'SHIPPED',    label: 'Expédiée' },
  { value: 'DELIVERED',  label: 'Livrée' },
  { value: 'CANCELLED',  label: 'Annulée' },
]

/** Les mêmes statuts, sous la forme attendue par le sélecteur d'onglets. */
const STATUS_TABS = STATUSES.map((s) => ({ id: s.value, label: s.label }))

/** Choix de densité du tableau : on lit 20 lignes par défaut. */
const PAGE_SIZES = [10, 20, 50] as const

export default function Orders() {
  const [data, setData] = useState<PageData | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<number>(20)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (statusFilter) params.set('status', statusFilter)
    api.get<PageData>(`/orders?${params}`)
      .then(setData)
      .finally(() => setLoading(false))
  }, [page, limit, statusFilter])

  useEffect(() => { load() }, [load])

  async function updateStatus(orderId: string, status: string) {
    setUpdatingId(orderId)
    try {
      await api.patch(`/orders/${orderId}/status`, { status })
      load()
    } finally {
      setUpdatingId(null)
    }
  }

  const fmt = (n: number | string) => new Intl.NumberFormat('fr-FR').format(Number(n)) + ' FCFA'
  const fmtDate = (d: string) =>
    new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d))

  const filtered = search
    ? (data?.items ?? []).filter(o =>
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        (o.customerName ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : (data?.items ?? [])

  const total = data?.meta.total ?? 0
  const shownCount = filtered.length
  const first = shownCount === 0 ? 0 : (page - 1) * limit + 1
  const last = shownCount === 0 ? 0 : first + shownCount - 1

  const columns: Column<Order>[] = [
    {
      key: 'number',
      header: 'N° commande',
      label: 'N° commande',
      sortBy: (o) => o.orderNumber,
      cell: (o) => (
        <div>
          <span className="whitespace-nowrap font-mono text-xs font-medium">{o.orderNumber}</span>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {o.items?.length ?? 0} article{(o.items?.length ?? 0) > 1 ? 's' : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Client',
      label: 'Client',
      hideOnMobile: true,
      sortBy: (o) => o.customerName,
      cell: (o) => (
        <div>
          <p>{o.customerName ?? <span className="text-muted-foreground">—</span>}</p>
          {o.customerPhone && <p className="text-xs text-muted-foreground">{o.customerPhone}</p>}
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      label: 'Date',
      hideOnMobile: true,
      sortBy: (o) => o.createdAt,
      cell: (o) => <span className="whitespace-nowrap text-muted-foreground">{fmtDate(o.createdAt)}</span>,
    },
    {
      key: 'total',
      header: 'Total',
      label: 'Total',
      align: 'right',
      sortBy: (o) => Number(o.total),
      cell: (o) => <span className="whitespace-nowrap font-semibold tabular-nums">{fmt(o.total)}</span>,
    },
    {
      key: 'status',
      header: 'Statut',
      label: 'Statut',
      sortBy: (o) => o.status,
      cell: (o) => (
        // Le statut se lit d'abord, et se change au clic : l'ancien menu
        // déroulant coloré était illisible tant qu'on ne l'ouvrait pas.
        <div className="flex">
          {updatingId === o.id ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Changer le statut de ${o.orderNumber}`}
              >
                <span className="inline-flex items-center gap-1">
                  <StatusBadge status={o.status} />
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {STATUSES.filter((s) => s.value).map((s) => (
                  <DropdownMenuItem
                    key={s.value}
                    onSelect={() => updateStatus(o.id, s.value)}
                    className={cn(s.value === o.status && 'font-semibold')}
                  >
                    <StatusBadge status={s.value} />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Commandes"
        description={`${data?.meta.total ?? '—'} commande(s) au total`}
      />

      <DataTable
        rows={filtered}
        columns={columns}
        getRowId={(o) => o.id}
        loading={loading}
        columnsToggle
        toolbar={
          <>
            <Segmented
              value={statusFilter}
              options={STATUS_TABS}
              onChange={(id) => { setStatusFilter(id); setPage(1) }}
              ariaLabel="Filtrer par statut"
            />
            <div className="relative w-full max-w-56">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Numéro ou client…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-8"
                aria-label="Rechercher une commande"
              />
            </div>
          </>
        }
        pagination={
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hidden sm:inline">Lignes par page</span>
              <Select
                value={String(limit)}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}
                className="w-auto"
                aria-label="Lignes par page"
              >
                {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm tabular-nums text-muted-foreground">
                {first} – {last} sur {total}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                aria-label="Page précédente"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={!data || page >= data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Page suivante"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </>
        }
        empty={{
          icon: ShoppingBag,
          title: 'Aucune commande',
          description: search || statusFilter
            ? 'Aucune commande ne correspond à ce filtre.'
            : 'Les commandes du site et les ventes comptoir apparaîtront ici.',
        }}
      />

    </div>
  )
}
