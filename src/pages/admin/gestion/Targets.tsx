import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { Loader2, Target as TargetIcon, Pencil, Users, TrendingUp } from 'lucide-react'

interface TargetRow {
  id: string | null
  month: string
  storeId: string
  storeName: string
  target: number
  achieved: number
  rate: number | null
  gap: number | null
}

interface SellerRow {
  sellerId: string
  name: string
  storeName: string | null
  sales: number
  totalSold: number
  averageBasket: number
}

interface StoreOption { id: string; name: string }

const fcfa = (v: number | null) =>
  v === null ? '—' : v.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' F'

const monthLabel = (m: string) =>
  new Date(`${m}-01T12:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

const input =
  'w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring'

export default function Targets() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [targets, setTargets] = useState<TargetRow[]>([])
  const [sellers, setSellers] = useState<SellerRow[]>([])
  const [stores, setStores] = useState<StoreOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editing, setEditing] = useState<{ storeId: string; storeName: string; amount: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const load = (m: string) => {
    setLoading(true)
    Promise.all([
      api.get<TargetRow[]>(`/gestion/reports/targets?month=${m}`),
      api.get<SellerRow[]>(`/gestion/reports/sellers?month=${m}`),
    ])
      .then(([t, s]) => { setTargets(t); setSellers(s) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(month) }, [month])

  useEffect(() => {
    api.get<StoreOption[]>('/gestion/stores').then(setStores).catch(() => setStores([]))
  }, [])

  async function save() {
    if (!editing) return
    setSaving(true); setError('')
    try {
      await api.put('/gestion/reports/targets', {
        month,
        storeId: editing.storeId,
        amount: Number(editing.amount) || 0,
      })
      setEditing(null); load(month)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  // Toutes les boutiques sont proposées à la saisie, y compris celles qui n'ont
  // encore ni objectif ni vente sur le mois.
  const rowsByStore = new Map(targets.filter(t => t.month === month).map((t) => [t.storeId, t]))

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Objectifs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cible par boutique. Le réalisé se lit sur les ventes du mois.
          </p>
        </div>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      {error && !editing && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center h-48 bg-card rounded-xl border border-border">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <h2 className="font-semibold text-foreground px-6 py-4 border-b border-border flex items-center gap-2">
              <TargetIcon className="w-4 h-4 text-muted-foreground" /> Cible vs réalisé
            </h2>
            <div className="divide-y divide-border">
              {stores.map((s) => {
                const row = rowsByStore.get(s.id)
                const target = row?.target ?? 0
                const achieved = row?.achieved ?? 0
                const rate = target > 0 ? achieved / target : null
                return (
                  <div key={s.id} className="px-6 py-4">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <span className="font-medium text-foreground">{s.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {fcfa(achieved)} <span className="text-muted-foreground/40">/</span>{' '}
                          {target > 0 ? fcfa(target) : <span className="text-muted-foreground">pas d'objectif</span>}
                        </span>
                        <button
                          onClick={() => setEditing({ storeId: s.id, storeName: s.name, amount: String(target || '') })}
                          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {rate !== null && (
                      <>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${rate >= 1 ? 'bg-emerald-500' : 'bg-gray-900'}`}
                            style={{ width: `${Math.min(100, rate * 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {Math.round(rate * 100)} % atteint · écart{' '}
                          <span className={achieved - target >= 0 ? 'text-success' : 'text-warning'}>
                            {achieved - target >= 0 ? '+' : ''}{fcfa(achieved - target)}
                          </span>
                        </p>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <h2 className="font-semibold text-foreground px-6 py-4 border-b border-border flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" /> Ventes par vendeuse
            </h2>
            {!sellers.length ? (
              <p className="px-6 py-8 text-sm text-muted-foreground">Aucune vente nominative ce mois-ci</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-6 py-3">Vendeuse</th>
                    <th className="text-left font-medium px-4 py-3">Boutique</th>
                    <th className="text-right font-medium px-4 py-3">Ventes</th>
                    <th className="text-right font-medium px-4 py-3">Total</th>
                    <th className="text-right font-medium px-6 py-3">Panier moyen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sellers.map((s) => (
                    <tr key={s.sellerId} className="hover:bg-muted/40">
                      <td className="px-6 py-3 text-foreground">{s.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.storeName ?? '—'}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{s.sales}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-foreground">{fcfa(s.totalSold)}</td>
                      <td className="px-6 py-3 text-right tabular-nums text-muted-foreground">{fcfa(s.averageBasket)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-semibold text-foreground">
              Objectif — {editing.storeName}
            </h2>
            <p className="text-sm text-muted-foreground capitalize">{monthLabel(month)}</p>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Recette visée</label>
              <input autoFocus type="number" min="0" value={editing.amount}
                onChange={(e) => setEditing({ ...editing, amount: e.target.value })}
                className={input} placeholder="800000" />
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> 0 retire l'objectif du suivi.
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setEditing(null)}
                className="flex-1 py-2 text-sm text-foreground border border-border rounded-lg hover:bg-accent transition-colors">
                Annuler
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
