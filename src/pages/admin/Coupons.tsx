import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Plus, Pencil, Trash2, Loader2, Ticket } from 'lucide-react'

interface Coupon {
  id: string
  code: string
  description: string | null
  type: 'PERCENTAGE' | 'FIXED'
  value: string | number
  minPurchase: string | number | null
  usageLimit: number | null
  usedCount: number
  startDate: string | null
  endDate: string | null
  isActive: boolean
}

interface FormState {
  code: string
  description: string
  type: 'PERCENTAGE' | 'FIXED'
  value: string
  minPurchase: string
  usageLimit: string
  isActive: boolean
}

const EMPTY: FormState = {
  code: '', description: '', type: 'PERCENTAGE', value: '',
  minPurchase: '', usageLimit: '', isActive: true,
}

export default function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Coupon | null | 'new'>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    api.get<Coupon[]>('/coupons')
      .then(setCoupons)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function openNew() { setForm(EMPTY); setEditing('new'); setError('') }
  function openEdit(c: Coupon) {
    setForm({
      code: c.code,
      description: c.description ?? '',
      type: c.type,
      value: String(c.value),
      minPurchase: c.minPurchase != null ? String(c.minPurchase) : '',
      usageLimit: c.usageLimit != null ? String(c.usageLimit) : '',
      isActive: c.isActive,
    })
    setEditing(c)
    setError('')
  }

  async function save() {
    if (!form.code.trim()) { setError('Le code est requis'); return }
    const value = Number(form.value)
    if (!value || value <= 0) { setError('La valeur doit être positive'); return }
    setSaving(true); setError('')

    const payload: Record<string, unknown> = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || undefined,
      type: form.type,
      value,
      minPurchase: form.minPurchase ? Number(form.minPurchase) : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      isActive: form.isActive,
    }

    try {
      if (editing === 'new') {
        await api.post('/coupons', payload)
      } else if (editing) {
        await api.patch(`/coupons/${editing.id}`, payload)
      }
      setEditing(null); load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce coupon ?')) return
    await api.delete(`/coupons/${id}`).catch((e) => alert(e.message))
    load()
  }

  const formatValue = (c: Coupon) =>
    c.type === 'PERCENTAGE' ? `${c.value}%` : `${c.value} FCFA`

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Coupons</h1>
          <p className="text-sm text-muted-foreground mt-1">{coupons.length} coupon(s)</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Nouveau coupon
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !coupons.length ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
            <Ticket className="w-8 h-8" />
            <p className="text-sm">Aucun coupon</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {coupons.map((c) => (
              <div key={c.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-semibold text-foreground">{c.code}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-foreground">{formatValue(c)}</span>
                    {!c.isActive && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">Inactif</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.description ? `${c.description} · ` : ''}
                    utilisé {c.usedCount}{c.usageLimit != null ? ` / ${c.usageLimit}` : ''} fois
                    {c.minPurchase != null ? ` · min. ${c.minPurchase} FCFA` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(c)}
                    className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(c.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="font-semibold text-foreground">
              {editing === 'new' ? 'Nouveau coupon' : 'Modifier le coupon'}
            </h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Code *</label>
              <input autoFocus value={form.code}
                onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="SOLDES10" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Type</label>
                <select value={form.type}
                  onChange={(e) => setForm(f => ({ ...f, type: e.target.value as FormState['type'] }))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="PERCENTAGE">Pourcentage (%)</option>
                  <option value="FIXED">Montant fixe (FCFA)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Valeur *</label>
                <input type="number" min={0} value={form.value}
                  onChange={(e) => setForm(f => ({ ...f, value: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={form.type === 'PERCENTAGE' ? '10' : '5000'} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Achat min. (FCFA)</label>
                <input type="number" min={0} value={form.minPurchase}
                  onChange={(e) => setForm(f => ({ ...f, minPurchase: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Optionnel" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Limite d'usage</label>
                <input type="number" min={0} value={form.usageLimit}
                  onChange={(e) => setForm(f => ({ ...f, usageLimit: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Optionnel" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
              <input value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Optionnel" />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive}
                onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 rounded accent-primary" />
              <span className="text-sm text-foreground">Coupon actif</span>
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button onClick={() => setEditing(null)}
                className="flex-1 py-2 text-sm text-foreground border border-border rounded-lg hover:bg-accent transition-colors">
                Annuler
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editing === 'new' ? 'Créer' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
