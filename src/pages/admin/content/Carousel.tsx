import { useEffect, useState, useRef } from 'react'
import { api } from '../../../lib/api'
import { useEdgeStore } from '../../../lib/edgestore'
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon, ImagePlus, Upload } from 'lucide-react'

interface Slide {
  id: string
  title: string | null
  subtitle: string | null
  imageUrl: string
  linkUrl: string | null
  altText: string | null
  sortOrder: number
  isActive: boolean
}

interface FormState {
  title: string
  subtitle: string
  imageUrl: string
  linkUrl: string
  altText: string
  sortOrder: string
  isActive: boolean
}

const EMPTY: FormState = {
  title: '', subtitle: '', imageUrl: '', linkUrl: '', altText: '', sortOrder: '0', isActive: true,
}

export default function Carousel() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Slide | null | 'new'>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
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
    api.get<Slide[]>('/content/carousel?all=true')
      .then(setSlides)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setForm({ ...EMPTY, sortOrder: String(slides.length) })
    setEditing('new'); setError('')
  }
  function openEdit(s: Slide) {
    setForm({
      title: s.title ?? '',
      subtitle: s.subtitle ?? '',
      imageUrl: s.imageUrl,
      linkUrl: s.linkUrl ?? '',
      altText: s.altText ?? '',
      sortOrder: String(s.sortOrder),
      isActive: s.isActive,
    })
    setEditing(s); setError('')
  }

  async function save() {
    if (!form.imageUrl.trim()) { setError("L'URL de l'image est requise"); return }
    try { new URL(form.imageUrl.trim()) } catch { setError("URL d'image invalide"); return }
    setSaving(true); setError('')

    const payload = {
      title: form.title.trim() || undefined,
      subtitle: form.subtitle.trim() || undefined,
      imageUrl: form.imageUrl.trim(),
      linkUrl: form.linkUrl.trim() || undefined,
      altText: form.altText.trim() || undefined,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    }

    try {
      if (editing === 'new') {
        await api.post('/content/carousel', payload)
      } else if (editing) {
        await api.patch(`/content/carousel/${editing.id}`, payload)
      }
      setEditing(null); load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce slide ?')) return
    await api.delete(`/content/carousel/${id}`).catch((e) => alert(e.message))
    load()
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carousel</h1>
          <p className="text-sm text-gray-500 mt-1">{slides.length} slide(s)</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
          <Plus className="w-4 h-4" /> Nouveau slide
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : !slides.length ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400 bg-white rounded-xl border border-gray-200">
          <ImageIcon className="w-8 h-8" />
          <p className="text-sm">Aucun slide</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {slides.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="aspect-[16/9] bg-gray-100 relative">
                <img src={s.imageUrl} alt={s.altText ?? ''} className="w-full h-full object-cover" />
                {!s.isActive && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs bg-black/60 text-white">Inactif</span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{s.title || <span className="text-gray-400">Sans titre</span>}</p>
                    <p className="text-xs text-gray-400 truncate">{s.subtitle || '—'} · ordre {s.sortOrder}</p>
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
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 my-8">
            <h2 className="font-semibold text-gray-900">
              {editing === 'new' ? 'Nouveau slide' : 'Modifier le slide'}
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Image *</label>
              {form.imageUrl ? (
                <div className="relative aspect-[16/9] bg-gray-100 rounded-lg overflow-hidden group">
                  <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div onClick={() => !uploading && fileRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 aspect-[16/9] border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre</label>
                <input value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ordre</label>
                <input type="number" min={0} value={form.sortOrder}
                  onChange={(e) => setForm(f => ({ ...f, sortOrder: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sous-titre</label>
              <input value={form.subtitle}
                onChange={(e) => setForm(f => ({ ...f, subtitle: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Lien (au clic)</label>
              <input value={form.linkUrl}
                onChange={(e) => setForm(f => ({ ...f, linkUrl: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="/collections/bags" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Texte alternatif (SEO)</label>
              <input value={form.altText}
                onChange={(e) => setForm(f => ({ ...f, altText: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive}
                onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 rounded accent-gray-900" />
              <span className="text-sm text-gray-700">Slide actif</span>
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
