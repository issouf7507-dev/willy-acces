import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { Plus, Pencil, Trash2, Loader2, Store as StoreIcon, Globe, Users, Power } from 'lucide-react'

type StoreType = 'PHYSICAL' | 'ONLINE'

interface Store {
  id: string
  name: string
  slug: string
  type: StoreType
  address: string | null
  phone: string | null
  isDefaultOnline: boolean
  isActive: boolean
  sortOrder: number
  _count: { staff: number; orders: number }
}

interface FormState {
  name: string
  type: StoreType
  address: string
  phone: string
  isDefaultOnline: boolean
  isActive: boolean
  sortOrder: string
}

const EMPTY: FormState = {
  name: '', type: 'PHYSICAL', address: '', phone: '',
  isDefaultOnline: false, isActive: true, sortOrder: '0',
}

const input =
  'w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring'

export default function Stores() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Store | null | 'new'>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    // `all=true` : les boutiques désactivées restent visibles ici, c'est le seul
    // écran d'où on peut les réactiver.
    api.get<Store[]>('/gestion/stores?all=true')
      .then(setStores)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function openNew() { setForm(EMPTY); setEditing('new'); setError('') }
  function openEdit(s: Store) {
    setForm({
      name: s.name, type: s.type, address: s.address ?? '', phone: s.phone ?? '',
      isDefaultOnline: s.isDefaultOnline, isActive: s.isActive, sortOrder: String(s.sortOrder),
    })
    setEditing(s); setError('')
  }

  async function save() {
    if (form.name.trim().length < 2) { setError('Le nom est requis'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        // '' plutôt que null : les champs sont facultatifs côté API et une
        // chaîne vide s'affiche partout comme « non renseigné ».
        address: form.address.trim() || undefined,
        phone: form.phone.trim() || undefined,
        isDefaultOnline: form.isDefaultOnline,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder) || 0,
      }
      if (editing === 'new') await api.post('/gestion/stores', payload)
      else if (editing) await api.patch(`/gestion/stores/${editing.id}`, payload)
      setEditing(null); load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function remove(s: Store) {
    if (!confirm(`Supprimer « ${s.name} » ?`)) return
    try {
      await api.delete(`/gestion/stores/${s.id}`)
      load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const total = stores.filter(s => s.isActive).length

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Boutiques</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} point(s) de vente actif(s) — recettes, objectifs et comparatifs se ventilent par boutique.
          </p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Nouvelle boutique
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !stores.length ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
            <StoreIcon className="w-8 h-8" />
            <p className="text-sm">Aucune boutique</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {stores.map((s) => (
              <div key={s.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition-colors">
                <div className="shrink-0 w-11 h-11 rounded-lg bg-muted flex items-center justify-center">
                  {s.type === 'ONLINE'
                    ? <Globe className="w-4 h-4 text-muted-foreground" />
                    : <StoreIcon className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{s.name}</span>
                    {s.isDefaultOnline && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-info/15 text-info">
                        Commandes du site
                      </span>
                    )}
                    {!s.isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] bg-muted text-muted-foreground">Inactive</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s._count.orders} vente(s) · {s._count.staff} personne(s)
                    {s.address ? ` · ${s.address}` : ''}
                    {s.phone ? ` · ${s.phone}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(s)}
                    className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(s)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-muted-foreground flex items-start gap-1.5">
        <Users className="w-3.5 h-3.5 mt-px flex-shrink-0" />
        Le rattachement des vendeuses à leur boutique se fait depuis Configuration → Utilisateurs.
      </p>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 my-8">
            <h2 className="font-semibold text-foreground">
              {editing === 'new' ? 'Nouvelle boutique' : `Modifier ${editing.name}`}
            </h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nom *</label>
              <input autoFocus value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className={input} placeholder="Palmeraie" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Type</label>
              <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value as StoreType }))}
                className={`${input} bg-card`}>
                <option value="PHYSICAL">Boutique physique</option>
                <option value="ONLINE">Vente en ligne</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Adresse</label>
              <input value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                className={input} placeholder="Quartier, rue…" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Téléphone</label>
              <input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                className={input} placeholder="+225 …" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Ordre d'affichage</label>
              <input type="number" min="0" value={form.sortOrder}
                onChange={(e) => setForm(f => ({ ...f, sortOrder: e.target.value }))} className={input} />
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isDefaultOnline}
                onChange={(e) => setForm(f => ({ ...f, isDefaultOnline: e.target.checked }))}
                className="w-4 h-4 mt-0.5 rounded accent-primary" />
              <span className="text-sm text-foreground">
                Reçoit les commandes du site
                <span className="block text-xs text-muted-foreground mt-0.5">
                  Une seule boutique à la fois : la cocher ici la retire de la précédente.
                </span>
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive}
                onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 rounded accent-primary" />
              <span className="text-sm text-foreground flex items-center gap-1.5">
                <Power className="w-3.5 h-3.5 text-muted-foreground" /> Boutique active
              </span>
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
