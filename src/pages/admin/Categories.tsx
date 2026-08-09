import { useEffect, useRef, useState } from 'react'
import { api } from '../../lib/api'
import { useEdgeStore } from '../../lib/edgestore'
import { Plus, Pencil, Trash2, Loader2, Tag, ImagePlus, Upload } from 'lucide-react'

interface Category {
  id: string; name: string; slug: string; isActive: boolean; parentId: string | null
  imageUrl: string | null
  _count: { products: number }; children: Category[]
}

interface FormState {
  name: string
  isActive: boolean
  /** '' = catégorie de premier niveau. */
  parentId: string
  /** '' = pas d'image ; affichée sur les cartes de catégorie de la page d'accueil. */
  imageUrl: string
}

function Row({ cat, onEdit, onRemove, nested = false }: {
  cat: Category
  onEdit: (c: Category) => void
  onRemove: (id: string) => void
  nested?: boolean
}) {
  return (
    <div className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors ${nested ? 'pl-12 bg-gray-50/30' : ''}`}>
      <div className={`shrink-0 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center ${nested ? 'w-8 h-8' : 'w-11 h-11'}`}>
        {cat.imageUrl
          ? <img src={cat.imageUrl} alt="" className="w-full h-full object-cover" />
          : <Tag className={`text-gray-300 ${nested ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {nested && <span className="text-gray-300 select-none">└─</span>}
          <span className={nested ? 'text-gray-700' : 'font-medium text-gray-900'}>{cat.name}</span>
          {!cat.isActive && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">Inactif</span>
          )}
        </div>
        <p className={`text-xs text-gray-400 mt-0.5 ${nested ? 'ml-6' : ''}`}>
          {cat._count.products} produit(s) · slug : {cat.slug}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onEdit(cat)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={() => onRemove(cat.id)}
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Category | null | 'new'>(null)
  const [form, setForm] = useState<FormState>({ name: '', isActive: true, parentId: '', imageUrl: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { edgestore } = useEdgeStore()

  async function uploadImage(file: File) {
    setUploading(true); setError('')
    try {
      const res = await edgestore.publicImages.upload({ file })
      setForm((f) => ({ ...f, imageUrl: res.url }))
    } catch {
      setError("Échec du téléchargement de l'image")
    } finally {
      setUploading(false)
    }
  }

  const load = () => {
    setLoading(true)
    api.get<Category[]>('/categories?all=true')
      .then(setCategories)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // L'API renvoie tous les niveaux à plat : on regroupe pour l'affichage.
  const roots = categories.filter(c => !c.parentId)
  const childrenOf = (id: string) => categories.filter(c => c.parentId === id)

  function openNew() {
    setForm({ name: '', isActive: true, parentId: '', imageUrl: '' })
    setEditing('new'); setError('')
  }
  function openEdit(c: Category) {
    setForm({ name: c.name, isActive: c.isActive, parentId: c.parentId ?? '', imageUrl: c.imageUrl ?? '' })
    setEditing(c); setError('')
  }

  async function save() {
    if (!form.name.trim()) { setError('Le nom est requis'); return }
    setSaving(true); setError('')
    try {
      // parentId '' => null côté API, ce qui remonte la catégorie au premier niveau.
      const payload = {
        name: form.name,
        isActive: form.isActive,
        parentId: form.parentId || null,
        // '' plutôt que null : le champ reste optionnel côté API, et une chaîne
        // vide est traitée comme « pas d'image » partout côté vitrine.
        imageUrl: form.imageUrl.trim(),
      }
      if (editing === 'new') {
        await api.post('/categories', payload)
      } else if (editing) {
        await api.patch(`/categories/${editing.id}`, payload)
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
            {roots.map((cat) => (
              <div key={cat.id}>
                <Row cat={cat} onEdit={openEdit} onRemove={remove} />
                {childrenOf(cat.id).map((child) => (
                  <Row key={child.id} cat={child} onEdit={openEdit} onRemove={remove} nested />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inline modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 my-8">
            <h2 className="font-semibold text-gray-900">
              {editing === 'new' ? 'Nouvelle catégorie' : 'Modifier la catégorie'}
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom *</label>
              <input autoFocus value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Nom de la catégorie" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Image</label>
              {form.imageUrl ? (
                <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden group">
                  <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div onClick={() => !uploading && fileRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 aspect-[4/3] border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
                  {uploading ? (
                    <><Upload className="w-7 h-7 text-gray-400 animate-bounce" /><span className="text-sm text-gray-500">Téléchargement…</span></>
                  ) : (
                    <><ImagePlus className="w-7 h-7 text-gray-400" /><span className="text-sm text-gray-500">Cliquez pour uploader une image</span></>
                  )}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f?.type.startsWith('image/')) uploadImage(f); e.target.value = '' }} />
              <input value={form.imageUrl}
                onChange={(e) => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                className="mt-2 w-full px-3.5 py-2 rounded-lg border border-gray-200 text-xs text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="…ou coller une URL d'image" />
              <p className="text-xs text-gray-400 mt-1.5">
                Affichée sur la carte de la catégorie sur la page d'accueil.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Catégorie parente</label>
              <select
                value={form.parentId}
                onChange={(e) => setForm(f => ({ ...f, parentId: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">Aucune (catégorie principale)</option>
                {roots
                  .filter(r => editing === 'new' || r.id !== editing?.id)
                  .map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <p className="text-xs text-gray-400 mt-1.5">
                Une sous-catégorie devient un onglet de la page de sa catégorie parente.
              </p>
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
              <button onClick={save} disabled={saving || uploading}
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
