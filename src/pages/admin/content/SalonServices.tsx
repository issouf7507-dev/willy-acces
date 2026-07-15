import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { Plus, Pencil, Trash2, Loader2, Scissors } from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string
  priceFrom: number
  sortOrder: number
  isActive: boolean
}

interface FormState {
  name: string
  description: string
  priceFrom: string
  sortOrder: string
  isActive: boolean
}

const EMPTY: FormState = { name: '', description: '', priceFrom: '0', sortOrder: '0', isActive: true }

export default function SalonServices() {
  const [items, setItems] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Service | null | 'new'>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    api.get<Service[]>('/content/salon-services?all=true')
      .then(setItems)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setForm({ ...EMPTY, sortOrder: String(items.length) })
    setEditing('new'); setError('')
  }
  function openEdit(s: Service) {
    setForm({
      name: s.name, description: s.description, priceFrom: String(s.priceFrom),
      sortOrder: String(s.sortOrder), isActive: s.isActive,
    })
    setEditing(s); setError('')
  }

  async function save() {
    if (!form.name.trim()) { setError('Le nom est requis'); return }
    if (!form.description.trim()) { setError('La description est requise'); return }
    setSaving(true); setError('')
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      priceFrom: Number(form.priceFrom) || 0,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    }
    try {
      if (editing === 'new') {
        await api.post('/content/salon-services', payload)
      } else if (editing) {
        await api.patch(`/content/salon-services/${editing.id}`, payload)
      }
      setEditing(null); load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cette prestation ?')) return
    await api.delete(`/content/salon-services/${id}`).catch((e) => alert(e.message))
    load()
  }

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salon — Prestations</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} prestation(s)</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
          <Plus className="w-4 h-4" /> Nouvelle prestation
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : !items.length ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
            <Scissors className="w-8 h-8" />
            <p className="text-sm">Aucune prestation</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map((s) => (
              <div key={s.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{s.name}</span>
                    <span className="text-xs text-gray-500">· à partir de {fmt(s.priceFrom)}</span>
                    {!s.isActive && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">Inactif</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{s.description}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(s)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(s.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">
              {editing === 'new' ? 'Nouvelle prestation' : 'Modifier la prestation'}
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom *</label>
              <input autoFocus value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
              <textarea rows={3} value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
            </div>

            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Prix à partir de (FCFA)</label>
                <input type="number" min={0} value={form.priceFrom}
                  onChange={(e) => setForm(f => ({ ...f, priceFrom: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ordre</label>
                <input type="number" min={0} value={form.sortOrder}
                  onChange={(e) => setForm(f => ({ ...f, sortOrder: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive}
                onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 rounded accent-gray-900" />
              <span className="text-sm text-gray-700">Active</span>
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button onClick={() => setEditing(null)}
                className="flex-1 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
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
