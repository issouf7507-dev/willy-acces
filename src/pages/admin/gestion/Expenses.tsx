import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { Plus, Pencil, Trash2, Loader2, Wallet, AlertTriangle } from 'lucide-react'

interface Expense {
  id: string
  date: string
  label: string
  amount: string | number
  notes: string | null
  store: { id: string; name: string } | null
}

interface StoreOption { id: string; name: string }

interface FormState {
  date: string
  label: string
  amount: string
  storeId: string
  notes: string
}

const today = () => new Date().toISOString().slice(0, 10)
const EMPTY: FormState = { date: today(), label: '', amount: '', storeId: '', notes: '' }

const input =
  'w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring'

const n = (v: string | number | null | undefined) => {
  const x = Number(v)
  return Number.isFinite(x) ? x : 0
}
const fcfa = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' F'

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [stores, setStores] = useState<StoreOption[]>([])
  const [month, setMonth] = useState(() => today().slice(0, 7))
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Expense | null | 'new'>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = (m: string) => {
    setLoading(true)
    api.get<Expense[]>(`/gestion/finance/expenses?month=${m}`)
      .then(setExpenses)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(month) }, [month])

  useEffect(() => {
    api.get<StoreOption[]>('/gestion/stores').then(setStores).catch(() => setStores([]))
  }, [])

  const total = expenses.reduce((sum, e) => sum + n(e.amount), 0)

  function openNew() {
    // Prérempli au 1er du mois consulté : on saisit rarement une dépense
    // d'un autre mois que celui qu'on a sous les yeux.
    setForm({ ...EMPTY, date: month === today().slice(0, 7) ? today() : `${month}-01` })
    setEditing('new'); setError('')
  }
  function openEdit(e: Expense) {
    setForm({
      date: e.date.slice(0, 10), label: e.label, amount: String(n(e.amount)),
      storeId: e.store?.id ?? '', notes: e.notes ?? '',
    })
    setEditing(e); setError('')
  }

  async function save() {
    if (form.label.trim().length < 2) { setError('Le libellé est requis'); return }
    if (!(n(form.amount) >= 0)) { setError('Montant invalide'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        date: form.date,
        label: form.label.trim(),
        amount: n(form.amount),
        storeId: form.storeId || null,
        notes: form.notes.trim() || null,
      }
      if (editing === 'new') await api.post('/gestion/finance/expenses', payload)
      else if (editing) await api.patch(`/gestion/finance/expenses/${editing.id}`, payload)
      setEditing(null); load(month)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function remove(e: Expense) {
    if (!confirm(`Supprimer « ${e.label} » ?`)) return
    try {
      await api.delete(`/gestion/finance/expenses/${e.id}`)
      load(month)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dépenses annexes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Les imprévus, au jour le jour. Les charges fixes se saisissent dans le bilan mensuel.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Nouvelle dépense
          </button>
        </div>
      </div>

      {error && !editing && (
        <div className="mb-4 flex items-start gap-2 px-4 py-3 rounded-lg bg-red-50 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />{error}
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !expenses.length ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
            <Wallet className="w-8 h-8" />
            <p className="text-sm">Aucune dépense ce mois-ci</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {expenses.map((e) => (
                <div key={e.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition-colors">
                  <div className="shrink-0 w-11 h-11 rounded-lg bg-muted flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{e.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(e.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}
                      {e.store ? ` · ${e.store.name}` : ''}
                      {e.notes ? ` · ${e.notes}` : ''}
                    </p>
                  </div>
                  <span className="text-sm font-medium tabular-nums text-foreground">{fcfa(n(e.amount))}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(e)}
                      className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => remove(e)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between px-6 py-3 bg-muted/50 border-t border-border">
              <span className="text-xs font-medium text-muted-foreground">
                Total du mois — repris automatiquement dans le bilan
              </span>
              <span className="text-sm font-bold tabular-nums text-foreground">{fcfa(total)}</span>
            </div>
          </>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 my-8">
            <h2 className="font-semibold text-foreground">
              {editing === 'new' ? 'Nouvelle dépense' : 'Modifier la dépense'}
            </h2>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Date *</label>
              <input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                className={input} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nature *</label>
              <input autoFocus value={form.label} onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))}
                className={input} placeholder="Réparation climatiseur" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Montant *</label>
              <input type="number" min="0" value={form.amount}
                onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} className={input} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Boutique</label>
              <select value={form.storeId} onChange={(e) => setForm(f => ({ ...f, storeId: e.target.value }))}
                className={`${input} bg-card`}>
                <option value="">Aucune en particulier</option>
                {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
              <textarea rows={2} value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                className={input} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setEditing(null)}
                className="flex-1 py-2 text-sm text-foreground border border-border rounded-lg hover:bg-accent transition-colors">
                Annuler
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editing === 'new' ? 'Ajouter' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
