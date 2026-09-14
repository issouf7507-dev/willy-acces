import { useEffect, useMemo, useState } from 'react'
import { api } from '../../../lib/api'
import { fetchAllProducts } from '../../../lib/catalog'
import { ArrowRight, Loader2, Repeat } from 'lucide-react'

interface StoreOption { id: string; name: string }
interface ProductOption { id: string; name: string; sku: string | null }

interface Transfer {
  id: string
  quantity: number
  note: string | null
  createdAt: string
  product: { id: string; name: string; sku: string | null }
  fromStore: { id: string; name: string }
  toStore: { id: string; name: string }
  createdBy: { id: string; name: string } | null
}

/** Le stock par boutique, relu à chaque transfert pour rester juste. */
interface StockRow {
  productId: string
  name: string
  byStore: Record<string, number>
}

const input =
  'w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring'

const day = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

export default function Transfers() {
  const [stores, setStores] = useState<StoreOption[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [stock, setStock] = useState<StockRow[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  const [form, setForm] = useState({ productId: '', fromStoreId: '', toStoreId: '', quantity: '', note: '' })

  const loadStock = () =>
    api.get<{ rows: StockRow[] }>('/gestion/reports/stock')
      .then((d) => setStock(d.rows))
      .catch(() => setStock([]))

  const loadTransfers = () =>
    api.get<Transfer[]>('/gestion/transfers?limit=30')
      .then(setTransfers)
      .catch(() => setTransfers([]))

  useEffect(() => {
    Promise.all([
      api.get<StoreOption[]>('/gestion/stores').then(setStores).catch(() => setStores([])),
      fetchAllProducts<ProductOption>().then(setProducts).catch(() => setProducts([])),
      loadStock(),
      loadTransfers(),
    ]).finally(() => setLoading(false))
  }, [])

  /** Ce que la boutique de départ a réellement sous la main. */
  const available = useMemo(() => {
    if (!form.productId || !form.fromStoreId) return null
    const row = stock.find((r) => r.productId === form.productId)
    return row?.byStore[form.fromStoreId] ?? 0
  }, [stock, form.productId, form.fromStoreId])

  async function submit() {
    setError(''); setDone('')
    const quantity = Number(form.quantity)
    if (!form.productId) { setError('Choisissez un produit'); return }
    if (!form.fromStoreId || !form.toStoreId) { setError('Choisissez les deux boutiques'); return }
    if (form.fromStoreId === form.toStoreId) { setError('Les deux boutiques doivent être différentes'); return }
    if (!Number.isInteger(quantity) || quantity <= 0) { setError('Quantité invalide'); return }

    setSaving(true)
    try {
      const t = await api.post<Transfer>('/gestion/transfers', {
        productId: form.productId,
        fromStoreId: form.fromStoreId,
        toStoreId: form.toStoreId,
        quantity,
        note: form.note.trim() || undefined,
      })
      setDone(`${t.quantity} × ${t.product.name} — ${t.fromStore.name} → ${t.toStore.name}`)
      setForm((f) => ({ ...f, productId: '', quantity: '', note: '' }))
      await Promise.all([loadStock(), loadTransfers()])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transfert impossible')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Transferts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Déplacer de la marchandise d'une boutique à une autre. Le stock total de l'entreprise ne
          change pas : seule sa répartition bouge.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Formulaire */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4 h-fit">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Produit *</label>
            <select value={form.productId}
              onChange={(e) => setForm(f => ({ ...f, productId: e.target.value }))}
              className={`${input} bg-card`}>
              <option value="">Choisir…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">De *</label>
              <select value={form.fromStoreId}
                onChange={(e) => setForm(f => ({ ...f, fromStoreId: e.target.value }))}
                className={`${input} bg-card`}>
                <option value="">Choisir…</option>
                {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Vers *</label>
              <select value={form.toStoreId}
                onChange={(e) => setForm(f => ({ ...f, toStoreId: e.target.value }))}
                className={`${input} bg-card`}>
                <option value="">Choisir…</option>
                {stores.filter((s) => s.id !== form.fromStoreId)
                  .map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Quantité *</label>
            <input type="number" min="1" value={form.quantity}
              onChange={(e) => setForm(f => ({ ...f, quantity: e.target.value }))}
              className={input} />
            {available !== null && (
              <p className={`text-xs mt-1.5 ${available === 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                Disponible au départ : <strong>{available}</strong>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Note</label>
            <input value={form.note}
              onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))}
              className={input} placeholder="Réassort weekend" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {done && <p className="text-sm text-success">Transfert enregistré — {done}</p>}

          <button onClick={submit} disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Repeat className="w-4 h-4" />}
            Transférer
          </button>
        </div>

        {/* Historique */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden">
          <h2 className="font-semibold text-foreground px-5 py-4 border-b border-border">
            Derniers transferts
          </h2>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !transfers.length ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
              <Repeat className="w-8 h-8" />
              <p className="text-sm">Aucun transfert</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {transfers.map((t) => (
                <div key={t.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      <span className="font-medium tabular-nums">{t.quantity}</span> × {t.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      {t.fromStore.name}
                      <ArrowRight className="w-3 h-3 flex-shrink-0" />
                      {t.toStore.name}
                      {t.note && <span className="text-muted-foreground truncate">— {t.note}</span>}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">{day(t.createdAt)}</p>
                    {t.createdBy && <p className="text-xs text-muted-foreground">{t.createdBy.name}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
