import { useState, useEffect, useRef, type FormEvent, type MouseEvent, type DragEvent } from 'react'
import { api } from '../../lib/api'
import { useEdgeStore } from '../../lib/edgestore'
import { X, Loader2, Upload, Trash2, ImagePlus } from 'lucide-react'

interface Category { id: string; name: string; parentId?: string | null; sortOrder?: number }
interface Product {
  id: string; name: string; slug?: string; price: number | string
  promoPrice?: number | string | null
  promoStartsAt?: string | null; promoEndsAt?: string | null
  stock: number; sku: string | null
  description?: string | null; isActive: boolean; isFeatured: boolean
  isNew?: boolean; isPreorder?: boolean
  preorderStartsAt?: string | null; releaseDate?: string | null
  preorderPrice?: number | string | null
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

/**
 * Aplatit l'arbre en options parent → enfants indentés. L'API renvoie les
 * catégories à plat : sans ce regroupement, « Porte-clés » apparaîtrait au même
 * niveau que « Sacs », sans indiquer de quoi elle dépend.
 */
function categoryOptions(cats: Category[]): { id: string; label: string }[] {
  const byOrder = [...cats].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  const roots = byOrder.filter(c => !c.parentId)
  const out: { id: string; label: string }[] = []
  for (const root of roots) {
    out.push({ id: root.id, label: root.name })
    for (const child of byOrder.filter(c => c.parentId === root.id)) {
      out.push({ id: child.id, label: `   └─ ${child.name}` })
    }
  }
  // Filet de sécurité : une catégorie dont le parent est inactif/absent de la
  // liste doit rester sélectionnable plutôt que de disparaître du formulaire.
  for (const c of byOrder) {
    if (!out.some(o => o.id === c.id)) out.push({ id: c.id, label: c.name })
  }
  return out
}

const pad = (n: number) => String(n).padStart(2, '0')

/** `YYYY-MM-DD` local pour un `<input type="date">`, à partir d'une date ISO. */
function toDateInput(value?: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Les dates sont saisies au jour près mais stockées à la seconde : une promo
 * « du 12 au 15 » doit démarrer au premier instant du 12 et courir toute la
 * journée du 15. On envoie donc début de journée pour le début, fin de journée
 * pour la fin — sinon la promo démarrerait ou s'arrêterait un jour trop tôt.
 */
function dayBoundaryISO(value: string, edge: 'start' | 'end'): string | undefined {
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return undefined
  const date = edge === 'start'
    ? new Date(y, m - 1, d, 0, 0, 0, 0)
    : new Date(y, m - 1, d, 23, 59, 59, 999)
  return date.toISOString()
}

/** `2026-08-15` → `15 août 2026`, pour le récapitulatif de promotion. */
function formatDay(value: string): string {
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return value
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatFcfa(value: string): string {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? `${n.toLocaleString('fr-FR')} FCFA` : '—'
}

/**
 * Aperçu du SKU généré par l'API quand le champ est laissé vide (même règle de
 * préfixe côté serveur, voir products.service.ts). Le numéro n'est pas connu ici :
 * il dépend des produits déjà en base.
 */
function skuPreview(categoryName?: string): string {
  const letters = (categoryName ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
  const prefix = (letters.slice(0, 3) || 'PRD').padEnd(3, 'X')
  return `${prefix}-001 (auto)`
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
    promoPrice: String(product?.promoPrice ?? ''),
    promoStartsAt: toDateInput(product?.promoStartsAt),
    promoEndsAt: toDateInput(product?.promoEndsAt),
    stock: String(product?.stock ?? '0'),
    sku: product?.sku ?? '',
    categoryId: product?.categoryId ?? '',
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    isNew: product?.isNew ?? false,
    isPreorder: product?.isPreorder ?? false,
    preorderStartsAt: toDateInput(product?.preorderStartsAt),
    releaseDate: toDateInput(product?.releaseDate),
    preorderPrice: String(product?.preorderPrice ?? ''),
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

  // Une promo se définit par un prix et une période : sans prix promo, les
  // dates n'ont pas d'objet et rien n'est envoyé.
  const hasPromo = Number(form.promoPrice) > 0

  async function handleSubmit(e: FormEvent | MouseEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const body = {
        name: form.name,
        description: form.description || undefined,
        price: Number(form.price),
        // L'API refuse 0 (prix strictement positif) : un « 0 » saisi ou un champ
        // vide partent en `null`, ce qui efface la promo côté serveur (`undefined`
        // laisserait l'ancienne promo en place lors d'une modification).
        promoPrice: hasPromo ? Number(form.promoPrice) : null,
        // Début vide = la promo démarre immédiatement.
        promoStartsAt: hasPromo ? dayBoundaryISO(form.promoStartsAt, 'start') ?? null : null,
        promoEndsAt: hasPromo ? dayBoundaryISO(form.promoEndsAt, 'end') : null,
        stock: Number(form.stock) || 0,
        sku: form.sku || undefined,
        categoryId: form.categoryId || undefined,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        isNew: form.isNew,
        isPreorder: form.isPreorder,
        // Ouverture vide = commandes ouvertes tout de suite. La date de sortie
        // ferme la fenêtre : elle est prise au début de journée pour que le
        // produit soit bien vendable normalement le jour même de sa sortie.
        preorderStartsAt: form.isPreorder
          ? dayBoundaryISO(form.preorderStartsAt, 'start') ?? null
          : null,
        releaseDate: form.isPreorder ? dayBoundaryISO(form.releaseDate, 'start') : null,
        // Prix de précommande facultatif : vide, c'est le prix normal qui
        // s'applique déjà pendant la période.
        preorderPrice:
          form.isPreorder && Number(form.preorderPrice) > 0 ? Number(form.preorderPrice) : null,
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
  const todayInput = toDateInput(new Date().toISOString())
  const skuPlaceholder = skuPreview(categories.find((c) => c.id === form.categoryId)?.name)

  // Récapitulatif en clair : le back-office manipule des dates, mais ce qui
  // compte pour l'admin c'est le prix affiché avant, pendant et après.
  const promoSummary = (() => {
    const normal = formatFcfa(form.price)
    const promo = formatFcfa(form.promoPrice)
    const debut = form.promoStartsAt ? `du ${formatDay(form.promoStartsAt)}` : 'dès l\'enregistrement'
    const fin = form.promoEndsAt ? `au ${formatDay(form.promoEndsAt)} inclus` : '(fin à définir)'
    return `${debut} ${fin}, le produit est vendu ${promo} avec ${normal} barré. En dehors de cette période, il est vendu ${normal}, sans prix barré.`
  })()

  const preorderSummary = (() => {
    const ouverture = form.preorderStartsAt
      ? `À partir du ${formatDay(form.preorderStartsAt)}`
      : 'Dès l\'enregistrement'
    if (!form.releaseDate) {
      return `${ouverture}, le produit est proposé en précommande. Renseignez la date de sortie pour fermer la période.`
    }
    const normal = formatFcfa(form.price)
    const tarif = Number(form.preorderPrice) > 0
      ? `au prix de précommande de ${formatFcfa(form.preorderPrice)}`
      : `au prix normal de ${normal}`
    return `${ouverture}, le produit est proposé en précommande ${tarif}, avec un compte à rebours jusqu'au ${formatDay(form.releaseDate)}. Ce jour-là il sort du rayon Précommandes, repasse à ${normal} et se vend normalement. Avant l'ouverture, il n'apparaît pas en boutique.`
  })()

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
        <form id="product-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <Field label="Nom *">
            <input required value={form.name} onChange={(e) => set('name', e.target.value)}
              className={input} placeholder="Nom du produit" />
          </Field>

          <Field label="Description">
            <textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)}
              className={`${input} resize-none`} placeholder="Description…" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Prix normal (FCFA) *">
              <input required type="number" min="0" step="1" value={form.price}
                onChange={(e) => set('price', e.target.value)} className={input} placeholder="6000" />
            </Field>
            <Field label="Prix promo (FCFA)">
              <input type="number" min="0" step="1" value={form.promoPrice}
                onChange={(e) => set('promoPrice', e.target.value)} className={input} placeholder="5000" />
            </Field>
          </div>

          {hasPromo && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Période de la promotion</p>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Début">
                  <input type="date" value={form.promoStartsAt}
                    onChange={(e) => set('promoStartsAt', e.target.value)} className={input} />
                </Field>
                <Field label="Fin *">
                  <input required type="date" min={form.promoStartsAt || todayInput} value={form.promoEndsAt}
                    onChange={(e) => set('promoEndsAt', e.target.value)} className={input} />
                </Field>
              </div>

              <p className="text-xs text-gray-500">{promoSummary}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Stock">
              <input type="number" min="0" step="1" value={form.stock}
                onChange={(e) => set('stock', e.target.value)} className={input} />
            </Field>
            <Field label="SKU">
              <input value={form.sku} onChange={(e) => set('sku', e.target.value)}
                className={input} placeholder={skuPlaceholder} />
              <p className="mt-1 text-xs text-gray-400">Laissez vide : généré automatiquement.</p>
            </Field>
          </div>

          <Field label="Catégorie">
            <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} className={input}>
              <option value="">— Aucune —</option>
              {categoryOptions(categories).map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
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

          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
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
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isNew}
                onChange={(e) => set('isNew', e.target.checked)}
                className="w-4 h-4 rounded accent-gray-900" />
              <span className="text-sm text-gray-700">Nouveau</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPreorder}
                onChange={(e) => set('isPreorder', e.target.checked)}
                className="w-4 h-4 rounded accent-gray-900" />
              <span className="text-sm text-gray-700">Précommande</span>
            </label>
          </div>

          {form.isPreorder && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Période de précommande</p>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Ouverture">
                  <input type="date" value={form.preorderStartsAt}
                    onChange={(e) => set('preorderStartsAt', e.target.value)} className={input} />
                </Field>
                <Field label="Date de sortie *">
                  <input required type="date" min={form.preorderStartsAt || todayInput}
                    value={form.releaseDate}
                    onChange={(e) => set('releaseDate', e.target.value)} className={input} />
                </Field>
              </div>

              <Field label="Prix précommande (FCFA)">
                <input type="number" min="0" step="1" value={form.preorderPrice}
                  onChange={(e) => set('preorderPrice', e.target.value)} className={input}
                  placeholder={form.price || '20000'} />
                <p className="mt-1 text-xs text-gray-400">
                  Laissez vide pour vendre au prix normal pendant la précommande.
                </p>
              </Field>

              <p className="text-xs text-gray-500">{preorderSummary}</p>
            </div>
          )}

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
          {/* Le bouton est hors du <form> (footer figé) : l'attribut `form` le
              rattache quand même, sinon les champs `required` ne sont pas validés
              et l'API répond 422 sur un prix ou un nom vide. */}
          <button
            type="submit"
            form="product-form"
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
