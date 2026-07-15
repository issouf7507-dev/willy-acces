import { useEffect, useState, useRef } from 'react'
import { api } from '../../../lib/api'
import { useEdgeStore } from '../../../lib/edgestore'
import { Plus, Trash2, Loader2, ImageIcon, Upload, ImagePlus } from 'lucide-react'

interface CatalogueImage { id: string; imageUrl: string; alt: string | null }
interface Catalogue {
  id: string
  title: string
  description: string | null
  images: CatalogueImage[]
}

interface Upload_ { url: string; uploading?: boolean; progress?: number; error?: string }

export default function SalonGallery() {
  const [items, setItems] = useState<Catalogue[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<Upload_[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const { edgestore } = useEdgeStore()

  const load = () => {
    setLoading(true)
    api.get<Catalogue[]>('/content/salon?all=true').then(setItems).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  function openNew() {
    setTitle(''); setDescription(''); setImages([]); setError(''); setCreating(true)
  }

  async function uploadFiles(files: File[]) {
    const start = images.length
    setImages((prev) => [...prev, ...files.map((f) => ({ url: URL.createObjectURL(f), uploading: true, progress: 0 }))])
    await Promise.all(files.map(async (file, i) => {
      const idx = start + i
      try {
        const res = await edgestore.publicImages.upload({
          file,
          onProgressChange: (p) => setImages((prev) => prev.map((im, j) => (j === idx ? { ...im, progress: p } : im))),
        })
        setImages((prev) => prev.map((im, j) => (j === idx ? { url: res.url, uploading: false } : im)))
      } catch {
        setImages((prev) => prev.map((im, j) => (j === idx ? { ...im, uploading: false, error: 'Échec' } : im)))
      }
    }))
  }

  async function save() {
    if (!title.trim()) { setError('Le titre est requis'); return }
    const ready = images.filter((im) => !im.uploading && !im.error && im.url.startsWith('https://'))
    setSaving(true); setError('')
    try {
      await api.post('/content/salon', {
        title: title.trim(),
        description: description.trim() || undefined,
        sortOrder: items.length,
        isActive: true,
        images: ready.map((im, sortOrder) => ({ imageUrl: im.url, sortOrder })),
      })
      setCreating(false); load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce catalogue et ses images ?')) return
    await api.delete(`/content/salon/${id}`).catch((e) => alert(e.message))
    load()
  }

  const hasUploading = images.some((im) => im.uploading)

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salon — Galerie</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} catalogue(s) de réalisations</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
          <Plus className="w-4 h-4" /> Nouveau catalogue
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : !items.length ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400 bg-white rounded-xl border border-gray-200">
          <ImageIcon className="w-8 h-8" /><p className="text-sm">Aucun catalogue</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">{c.title}</h3>
                  {c.description && <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{c.images.length} image(s)</p>
                </div>
                <button onClick={() => remove(c.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {c.images.map((img) => (
                  <div key={img.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img src={img.imageUrl} alt={img.alt ?? c.title} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Nouveau catalogue</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre *</label>
              <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex : Coiffure & Tresses"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Images</label>
              <div onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-5 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
                <ImagePlus className="w-7 h-7 text-gray-400" />
                <p className="text-sm text-gray-500">Cliquez pour ajouter des images</p>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={(e) => { const f = Array.from(e.target.files ?? []).filter((x) => x.type.startsWith('image/')); if (f.length) uploadFiles(f); e.target.value = '' }} />
              </div>
              {images.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {images.map((im, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                      <img src={im.url} alt="" className="w-full h-full object-cover" />
                      {im.uploading && (
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
                          <Upload className="w-4 h-4 text-white animate-bounce" />
                          <span className="text-white text-xs">{im.progress ?? 0}%</span>
                        </div>
                      )}
                      {im.error && <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center text-white text-xs">{im.error}</div>}
                      {!im.uploading && (
                        <button type="button" onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                          className="absolute top-1 right-1 p-1 bg-black/60 rounded-full">
                          <Trash2 className="w-3 h-3 text-white" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button onClick={() => setCreating(false)}
                className="flex-1 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button onClick={save} disabled={saving || hasUploading}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
                {(saving || hasUploading) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {hasUploading ? 'Téléchargement…' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
