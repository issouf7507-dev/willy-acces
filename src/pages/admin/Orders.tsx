import { useEffect, useState, useCallback } from 'react'
import { api } from '../../lib/api'
import { Search, Loader2, ShoppingBag, ChevronDown } from 'lucide-react'

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

const STATUS_COLORS: Record<string, string> = {
  PENDING:    'bg-yellow-100 text-yellow-800',
  CONFIRMED:  'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPED:    'bg-indigo-100 text-indigo-800',
  DELIVERED:  'bg-green-100 text-green-800',
  CANCELLED:  'bg-red-100 text-red-800',
  REFUNDED:   'bg-gray-100 text-gray-700',
}

export default function Orders() {
  const [data, setData] = useState<PageData | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (statusFilter) params.set('status', statusFilter)
    api.get<PageData>(`/orders?${params}`)
      .then(setData)
      .finally(() => setLoading(false))
  }, [page, statusFilter])

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

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commandes</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.meta.total ?? '—'} commande(s) au total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Rechercher par numéro ou client…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map((s) => (
            <button key={s.value}
              onClick={() => { setStatusFilter(s.value); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === s.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : !filtered.length ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
            <ShoppingBag className="w-8 h-8" />
            <p className="text-sm">Aucune commande</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">N° commande</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Client</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Date</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-medium text-gray-900 text-xs">{order.orderNumber}</span>
                        <p className="text-xs text-gray-400 mt-0.5">{order.items?.length ?? 0} article(s)</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-gray-900">{order.customerName ?? <span className="text-gray-400">—</span>}</p>
                        {order.customerPhone && <p className="text-xs text-gray-400">{order.customerPhone}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{fmtDate(order.createdAt)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(order.total)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="relative inline-block">
                          {updatingId === order.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400 mx-auto" />
                          ) : (
                            <div className="relative">
                              <select
                                value={order.status}
                                onChange={(e) => updateStatus(order.id, e.target.value)}
                                className={`appearance-none pl-2.5 pr-6 py-1 rounded-full text-xs font-medium cursor-pointer focus:outline-none ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}
                              >
                                {STATUSES.filter(s => s.value).map(s => (
                                  <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data && data.meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">Page {data.meta.page} / {data.meta.totalPages}</p>
                <div className="flex gap-1">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">Précédent</button>
                  <button disabled={page >= data.meta.totalPages} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">Suivant</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
