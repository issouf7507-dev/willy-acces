import { useState, useEffect, useRef, type FormEvent, type MouseEvent, type DragEvent } from 'react'
import { api } from '../../lib/api'
import { useEdgeStore } from '../../lib/edgestore'
import { X, Loader2, Upload, Trash2, ImagePlus } from 'lucide-react'

interface Category { id: string; name: string }
interface Product {
  id: string; name: string; slug?: string; price: number | string
  compareAtPrice?: number | string | null; stock: number; sku: string | null
  description?: string | null; isActive: boolean; isFeatured: boolean
  categoryId?: string | null; images: { url: string; alt?: string | null }[]
}

interface Props {
  product: Product | null
  onClose: () => void
  onSaved: () => void
}

interface ImageEntry {
  url: string
  alt: string
  uploading?: boolean
  progress?: number
  error?: string
}

export default function ProductFormModal({ product, onClose, onSaved }: Props) {
  const isNew = !product
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [images, setImages] = useState<ImageEntry[]>(
    product?.images?.map((img) => ({ url: img.url, alt: img.alt ?? '' })) ?? []
  )
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { edgestore } = useEdgeStore()

  const [form, setForm] = useState({
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: String(product?.price ?? ''),
    compareAtPrice: String(product?.compareAtPrice ?? ''),
    stock: String(product?.stock ?? '0'),
    sku: product?.sku ?? '',
    categoryId: product?.categoryId ?? '',
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
  })

  useEffect(() => {
    api.get<Category[]>('/categories').then(setCategories).catch(() => null)
  }, [])

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }))

  async function uploadFiles(files: File[]) {
    const startIdx = images.length
    const newEntries: ImageEntry[] = files.map((f) => ({
      url: URL.createObjectURL(f),
      alt: f.name.replace(/\.[^.]+$/, ''),
      uploading: true,
      progress: 0,
    }))
    setImages((prev) => [...prev, ...newEntries])

    await Promise.all(
      files.map(async (file, i) => {
        const idx = startIdx + i
        try {
          const res = await edgestore.publicImages.upload({
            file,
            onProgressChange: (progress) => {
              setImages((prev) =>
                prev.map((img, j) => (j === idx ? { ...img, progress } : img))
              )
            },
          })
          setImages((prev) =>
            prev.map((img, j) =>
              j === idx
                ? { url: res.url, alt: file.name.replace(/\.[^.]+$/, ''), uploading: false }
                : img
            )
          )
        } catch {
          setImages((prev) =>
            prev.map((img, j) =>
              j === idx ? { ...img, uploading: false, error: 'Échec du téléchargement' } : img
            )
          )
        }
      })
    )
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'))
    if (files.length) uploadFiles(files)
    e.target.value = ''
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    if (files.length) uploadFiles(files)
  }

  async function removeImage(idx: number) {
    const img = images[idx]
    if (!img || img.uploading) return
    try {
      if (img.url.startsWith('https://')) {
        await edgestore.publicImages.delete({ url: img.url })
      }
    } catch { /* ignore delete errors */ }
    setImages((prev) => prev.filter((_, j) => j !== idx))
  }

  async function handleSubmit(e: FormEvent | MouseEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const body = {
        name: form.name,
        description: form.description || undefined,
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
        stock: Number(form.stock),
        sku: form.sku || undefined,
        categoryId: form.categoryId || undefined,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        images: images
          .filter((img) => !img.uploading && !img.error && img.url.startsWith('https://'))
          .map((img, sortOrder) => ({ url: img.url, alt: img.alt || undefined, sortOrder })),
        variants: [],
      }
      if (isNew) {
        await api.post('/products', body)
      } else {
        await api.patch(`/products/${product.id}`, body)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const hasUploading = images.some((img) => img.uploading)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{isNew ? 'Nouveau produit' : 'Modifier le produit'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <Field label="Nom *">
            <input required value={form.name} onChange={(e) => set('name', e.target.value)}
              className={input} placeholder="Nom du produit" />
          </Field>

          <Field label="Description">
            <textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)}
              className={`${input} resize-none`} placeholder="Description…" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Prix (FCFA) *">
              <input required type="number" min="0" step="1" value={form.price}
                onChange={(e) => set('price', e.target.value)} className={input} placeholder="5000" />
            </Field>
            <Field label="Prix barré (FCFA)">
              <input type="number" min="0" step="1" value={form.compareAtPrice}
                onChange={(e) => set('compareAtPrice', e.target.value)} className={input} placeholder="6000" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Stock">
              <input type="number" min="0" step="1" value={form.stock}
                onChange={(e) => set('stock', e.target.value)} className={input} />
            </Field>
            <Field label="SKU">
              <input value={form.sku} onChange={(e) => set('sku', e.target.value)}
                className={input} placeholder="REF-001" />
            </Field>
          </div>

          <Field label="Catégorie">
            <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} className={input}>
              <option value="">— Aucune —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          {/* Image uploader */}
          <Field label="Images du produit">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-5 cursor-pointer transition-colors ${
                dragging ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <ImagePlus className="w-7 h-7 text-gray-400" />
              <p className="text-sm text-gray-500">
                Glissez des images ici ou <span className="font-medium text-gray-800">parcourir</span>
              </p>
              <p className="text-xs text-gray-400">PNG, JPG, WEBP — max 10 Mo par image</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onFileChange}
              />
            </div>

            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group">
                    <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />

                    {img.uploading && (
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
                        <Upload className="w-4 h-4 text-white animate-bounce" />
                        <span className="text-white text-xs font-medium">{img.progress ?? 0}%</span>
                      </div>
                    )}

                    {img.error && (
                      <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center p-1">
                        <span className="text-white text-xs text-center">{img.error}</span>
                      </div>
                    )}

                    {!img.uploading && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeImage(i) }}
                        className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </button>
                    )}

                    {i === 0 && !img.uploading && !img.error && (
                      <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                        Principale
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Field>

          <div className="flex gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive}
                onChange={(e) => set('isActive', e.target.checked)}
                className="w-4 h-4 rounded accent-gray-900" />
              <span className="text-sm text-gray-700">Actif</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured}
                onChange={(e) => set('isFeatured', e.target.checked)}
                className="w-4 h-4 rounded accent-gray-900" />
              <span className="text-sm text-gray-700">Mis en avant</span>
            </label>
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            Annuler
          </button>
          <button
            onClick={(e) => handleSubmit(e)}
            disabled={loading || hasUploading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {(loading || hasUploading) && <Loader2 className="w-4 h-4 animate-spin" />}
            {hasUploading ? 'Téléchargement…' : isNew ? 'Créer' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const input = 'w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition'
