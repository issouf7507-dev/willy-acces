import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Plus, Pencil, Trash2, Loader2, Tag } from 'lucide-react'

interface Category {
  id: string; name: string; slug: string; isActive: boolean
  _count: { products: number }; children: Category[]
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Category | null | 'new'>(null)
  const [form, setForm] = useState({ name: '', isActive: true })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    api.get<Category[]>('/categories?all=true')
      .then(setCategories)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function openNew() { setForm({ name: '', isActive: true }); setEditing('new'); setError('') }
  function openEdit(c: Category) { setForm({ name: c.name, isActive: c.isActive }); setEditing(c); setError('') }

  async function save() {
    if (!form.name.trim()) { setError('Le nom est requis'); return }
    setSaving(true); setError('')
    try {
      if (editing === 'new') {
        await api.post('/categories', form)
      } else if (editing) {
        await api.patch(`/categories/${editing.id}`, form)
      }
      setEditing(null); load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cette catégorie ?')) return
    await api.delete(`/categories/${id}`).catch((e) => alert(e.message))
    load()
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catégories</h1>
          <p className="text-sm text-gray-500 mt-1">{categories.length} catégorie(s)</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
          <Plus className="w-4 h-4" /> Nouvelle catégorie
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : !categories.length ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
            <Tag className="w-8 h-8" />
            <p className="text-sm">Aucune catégorie</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{cat.name}</span>
                    {!cat.isActive && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">Inactif</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {cat._count.products} produit(s) · slug : {cat.slug}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(cat)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(cat.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inline modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">
              {editing === 'new' ? 'Nouvelle catégorie' : 'Modifier la catégorie'}
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom *</label>
              <input autoFocus value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Nom de la catégorie" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive}
                onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 rounded accent-gray-900" />
              <span className="text-sm text-gray-700">Catégorie active</span>
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
