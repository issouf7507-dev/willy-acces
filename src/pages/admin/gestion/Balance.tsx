import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { useAuth } from '../../../context/AuthContext'
import { Loader2, Scale, Pencil, PiggyBank, ShoppingBag, AlertTriangle } from 'lucide-react'

interface Balance {
  month: string
  closed: boolean
  rent: number
  salaries: number
  utilities: number
  transportTaxes: number
  other: number
  obligatoryTotal: number
  revenue: number
  expensesTotal: number
  netProfit: number
  reserve: number | null
  remaining: number
  purchaseRate: number
  purchases: number
  savings: number
  notes: string | null
}

interface FormState {
  rent: string
  salaries: string
  utilities: string
  transportTaxes: string
  other: string
  purchaseRate: string
  notes: string
}

const input =
  'w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring'

const n = (v: string | number | null | undefined) => {
  const x = Number(v)
  return Number.isFinite(x) ? x : 0
}
const fcfa = (v: number | null) =>
  v === null ? '—' : v.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' F'

const monthLabel = (m: string) =>
  new Date(`${m}-01T12:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

const CHARGES = [
  { key: 'rent', label: 'Loyer' },
  { key: 'salaries', label: 'Salaires' },
  { key: 'utilities', label: 'Électricité / Eau / Internet' },
  { key: 'transportTaxes', label: 'Transport / Taxes' },
  { key: 'other', label: 'Autres' },
] as const

export default function Balance() {
  const { user } = useAuth()
  // La clôture engage la répartition de l'argent : SUPER_ADMIN seul, côté
  // serveur comme ici. Le test portait encore sur l'ancien nom du rôle.
  const canClose = user?.role === 'SUPER_ADMIN'

  const [balances, setBalances] = useState<Balance[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Balance | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    api.get<Balance[]>('/gestion/finance/closings')
      .then(setBalances)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function openEdit(b: Balance) {
    setForm({
      rent: String(b.rent), salaries: String(b.salaries), utilities: String(b.utilities),
      transportTaxes: String(b.transportTaxes), other: String(b.other),
      purchaseRate: String(Math.round(b.purchaseRate * 100)), notes: b.notes ?? '',
    })
    setEditing(b); setError('')
  }

  async function save() {
    if (!editing || !form) return
    const rate = n(form.purchaseRate)
    if (rate < 0 || rate > 100) { setError('Le taux doit être compris entre 0 et 100'); return }
    setSaving(true); setError('')
    try {
      await api.put(`/gestion/finance/closings/${editing.month}`, {
        rent: n(form.rent),
        salaries: n(form.salaries),
        utilities: n(form.utilities),
        transportTaxes: n(form.transportTaxes),
        other: n(form.other),
        purchaseRate: rate / 100,
        notes: form.notes.trim() || undefined,
      })
      setEditing(null); load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Bilan mensuel</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Seules les cinq charges obligatoires se saisissent. Recettes, dépenses annexes et
          répartition se calculent.
        </p>
      </div>

      {error && !editing && (
        <div className="mb-4 flex items-start gap-2 px-4 py-3 rounded-lg bg-red-50 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />{error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48 bg-card rounded-xl border border-border">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !balances.length ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground bg-card rounded-xl border border-border">
          <Scale className="w-8 h-8" />
          <p className="text-sm">Aucun mois d'activité pour l'instant</p>
        </div>
      ) : (
        <div className="space-y-4">
          {balances.map((b) => (
            <div key={b.month} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold text-foreground capitalize">{monthLabel(b.month)}</h2>
                  {!b.closed && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-warning/15 text-warning">
                      Charges non saisies
                    </span>
                  )}
                </div>
                {canClose && (
                  <button onClick={() => openEdit(b)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground border border-border rounded-lg hover:bg-accent transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> Saisir les charges
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                {/* Compte du mois */}
                <dl className="p-6 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Recettes</dt>
                    <dd className="tabular-nums font-medium text-foreground">{fcfa(b.revenue)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Charges obligatoires</dt>
                    <dd className="tabular-nums text-muted-foreground">− {fcfa(b.obligatoryTotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Dépenses annexes</dt>
                    <dd className="tabular-nums text-muted-foreground">− {fcfa(b.expensesTotal)}</dd>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <dt className="font-medium text-foreground">Bénéfice net</dt>
                    <dd className={`tabular-nums font-semibold ${b.netProfit < 0 ? 'text-destructive' : 'text-success'}`}>
                      {fcfa(b.netProfit)}
                    </dd>
                  </div>
                </dl>

                {/* Répartition */}
                <dl className="p-6 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      Réserve du mois suivant
                      {b.reserve === null && (
                        <span className="block text-[11px] text-muted-foreground">
                          Premier mois : aucun mois précédent d'où la tirer
                        </span>
                      )}
                    </dt>
                    <dd className="tabular-nums text-muted-foreground">− {fcfa(b.reserve)}</dd>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <dt className="font-medium text-foreground">Reste à partager</dt>
                    <dd className={`tabular-nums font-semibold ${b.remaining < 0 ? 'text-destructive' : 'text-foreground'}`}>
                      {fcfa(b.remaining)}
                    </dd>
                  </div>
                  {b.remaining < 0 ? (
                    <p className="text-xs text-warning bg-amber-50 rounded-lg px-3 py-2 mt-2">
                      Rien à répartir ce mois-ci : le bénéfice ne couvre pas la réserve.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3" /> Achats {Math.round(b.purchaseRate * 100)} %
                        </p>
                        <p className="text-sm font-semibold tabular-nums text-foreground mt-0.5">{fcfa(b.purchases)}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <PiggyBank className="w-3 h-3" /> Épargne {100 - Math.round(b.purchaseRate * 100)} %
                        </p>
                        <p className="text-sm font-semibold tabular-nums text-foreground mt-0.5">{fcfa(b.savings)}</p>
                      </div>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 my-8">
            <h2 className="font-semibold text-foreground capitalize">
              Charges de {monthLabel(editing.month)}
            </h2>
            {CHARGES.map((c) => (
              <div key={c.key}>
                <label className="block text-sm font-medium text-foreground mb-1.5">{c.label}</label>
                <input type="number" min="0" value={form[c.key]}
                  onChange={(e) => setForm(f => (f ? { ...f, [c.key]: e.target.value } : f))}
                  className={input} />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Part achats (%)</label>
              <input type="number" min="0" max="100" value={form.purchaseRate}
                onChange={(e) => setForm(f => (f ? { ...f, purchaseRate: e.target.value } : f))}
                className={input} />
              <p className="text-xs text-muted-foreground mt-1.5">
                Le complément ({100 - n(form.purchaseRate)} %) part en épargne.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
              <textarea rows={2} value={form.notes}
                onChange={(e) => setForm(f => (f ? { ...f, notes: e.target.value } : f))} className={input} />
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
