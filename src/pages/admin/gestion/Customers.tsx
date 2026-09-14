import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { Plus, Pencil, Trash2, Loader2, UserRound, Search, Phone, Wallet } from 'lucide-react'

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  notes: string | null
  isActive: boolean
  _count: { orders: number }
}

/** Agrégats de fidélité, calculés sur les ventes. */
interface Loyalty {
  customerId: string | null
  userId: string | null
  name: string
  visits: number
  totalSpent: number
  totalDiscount: number
  lastVisit: string | null
}

interface FormState {
  name: string
  phone: string
  email: string
  notes: string
  isActive: boolean
}

const EMPTY: FormState = { name: '', phone: '', email: '', notes: '', isActive: true }

const input =
  'w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring'

const fcfa = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' F'

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loyalty, setLoyalty] = useState<Map<string, Loyalty>>(new Map())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Customer | null | 'new'>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = (q = '') => {
    setLoading(true)
    const params = new URLSearchParams({ includeInactive: 'true' })
    if (q.trim()) params.set('search', q.trim())
    api.get<Customer[]>(`/gestion/customers?${params}`)
      .then(setCustomers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  // La recherche part côté API : la liste des clients grandira bien au-delà de
  // ce qu'on peut filtrer en mémoire.
  useEffect(() => {
    const t = setTimeout(() => load(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // Fidélité : réservée à l'encadrement. Un 403 ne doit pas casser la page —
  // la gestion des fiches reste utilisable sans les agrégats.
  useEffect(() => {
    api.get<Loyalty[]>('/gestion/reports/customers')
      .then((rows) => setLoyalty(new Map(rows.filter(r => r.customerId).map(r => [r.customerId!, r]))))
      .catch(() => setLoyalty(new Map()))
  }, [])

  function openNew() { setForm(EMPTY); setEditing('new'); setError('') }
  function openEdit(c: Customer) {
    setForm({
      name: c.name, phone: c.phone ?? '', email: c.email ?? '',
      notes: c.notes ?? '', isActive: c.isActive,
    })
    setEditing(c); setError('')
  }

  async function save() {
    if (form.name.trim().length < 2) { setError('Le nom est requis'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        notes: form.notes.trim() || undefined,
        isActive: form.isActive,
      }
      if (editing === 'new') await api.post('/gestion/customers', payload)
      else if (editing) await api.patch(`/gestion/customers/${editing.id}`, payload)
      setEditing(null); load(search)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function remove(c: Customer) {
    if (!confirm(`Supprimer la fiche de « ${c.name} » ?`)) return
    try {
      await api.delete(`/gestion/customers/${c.id}`)
      load(search)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur')
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {customers.length} fiche(s) — le téléphone sert d'identité, il évite les doublons au comptoir.
          </p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Nouveau client
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un nom ou un numéro…"
          className={`${input} pl-9`} />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !customers.length ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
            <UserRound className="w-8 h-8" />
            <p className="text-sm">{search ? 'Aucun résultat' : 'Aucun client enregistré'}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {customers.map((c) => (
              <div key={c.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition-colors">
                <div className="shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                  {c.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{c.name}</span>
                    {!c.isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] bg-muted text-muted-foreground">Inactif</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                    {c.phone ? <><Phone className="w-3 h-3" />{c.phone} · </> : null}
                    {c._count.orders} achat(s)
                    {loyalty.get(c.id)?.lastVisit && (
                      <> · dernière visite {new Date(loyalty.get(c.id)!.lastVisit!).toLocaleDateString('fr-FR')}</>
                    )}
                  </p>
                </div>
                {loyalty.get(c.id) && (
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium tabular-nums text-foreground flex items-center gap-1.5 justify-end">
                      <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
                      {fcfa(loyalty.get(c.id)!.totalSpent)}
                    </p>
                    {loyalty.get(c.id)!.totalDiscount > 0 && (
                      <p className="text-[11px] text-warning">
                        {fcfa(loyalty.get(c.id)!.totalDiscount)} de remises
                      </p>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(c)}
                    className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(c)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 my-8">
            <h2 className="font-semibold text-foreground">
              {editing === 'new' ? 'Nouveau client' : `Modifier ${editing.name}`}
            </h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nom *</label>
              <input autoFocus value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className={input} placeholder="Nom et prénom" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Téléphone</label>
              <input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                className={input} placeholder="+225 …" />
              <p className="text-xs text-muted-foreground mt-1.5">
                Sert d'identité : un numéro déjà enregistré ne peut pas être réutilisé.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                className={input} placeholder="facultatif" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
              <textarea rows={3} value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                className={input} placeholder="Préférences, remarques…" />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive}
                onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 rounded accent-primary" />
              <span className="text-sm text-foreground">Fiche active</span>
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
