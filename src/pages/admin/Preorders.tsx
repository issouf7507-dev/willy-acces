import { useEffect, useState, useCallback } from 'react'
import { api } from '../../lib/api'
import { formatPrice } from '../../lib/utils'
import { SERVICE_FEE_LABEL, serviceFee, totalWithServiceFee } from '../../lib/fees'
import {
  Loader2, PackageCheck, Trash2, Phone, Mail, MapPin, Palette, CalendarClock,
  MessageCircle, ExternalLink, Hash, Boxes, AlertTriangle, ImageOff,
} from 'lucide-react'

type Status = 'NEW' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED'

interface PreorderItem {
  id: string
  productId: string | null
  productName: string
  unitPrice: string | number
  releaseDate: string | null
  color: string | null
  quantity: number
  product?: {
    id: string
    slug: string
    sku: string | null
    stock: number
    isActive: boolean
    images: { url: string; alt: string | null }[]
  } | null
}

interface PreorderRequest {
  id: string
  name: string
  phone: string
  deliveryPlace: string | null
  /** Renseignés uniquement sur les demandes reçues avant le retrait de ces champs. */
  email: string | null
  message: string | null
  status: Status
  adminNote: string | null
  createdAt: string
  items: PreorderItem[]
}

interface PageData {
  items: PreorderRequest[]
  meta: { total: number; page: number; totalPages: number }
}

const STATUS: Record<Status, { label: string; cls: string }> = {
  NEW:       { label: 'Nouvelle',  cls: 'bg-info/10 text-info' },
  CONFIRMED: { label: 'Confirmée', cls: 'bg-warning/10 text-warning' },
  DELIVERED: { label: 'Livrée',    cls: 'bg-green-50 text-green-700' },
  CANCELLED: { label: 'Annulée',   cls: 'bg-muted text-muted-foreground' },
}

const FILTERS: { id: '' | Status; label: string }[] = [
  { id: '', label: 'Toutes' },
  { id: 'NEW', label: 'Nouvelles' },
  { id: 'CONFIRMED', label: 'Confirmées' },
  { id: 'DELIVERED', label: 'Livrées' },
  { id: 'CANCELLED', label: 'Annulées' },
]

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

/**
 * Vignette produit. Une image absente — ou dont le fichier a disparu du
 * stockage — laissait un carré blanc : on retombe sur un visuel neutre.
 */
function Thumb({ url, alt }: { url?: string; alt: string }) {
  const [broken, setBroken] = useState(false)
  const placeholder = (
    <div className="w-20 h-20 rounded-lg bg-gray-200 shrink-0 flex items-center justify-center">
      <ImageOff className="w-6 h-6 text-muted-foreground" />
    </div>
  )
  if (!url || broken) return placeholder
  return (
    <img
      src={url}
      alt={alt}
      onError={() => setBroken(true)}
      className="w-20 h-20 rounded-lg object-cover shrink-0 bg-card"
    />
  )
}

export default function Preorders() {
  const [data, setData] = useState<PageData | null>(null)
  const [filter, setFilter] = useState<'' | Status>('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PreorderRequest | null>(null)
  const [status, setStatus] = useState<Status>('NEW')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '100' })
    if (filter) params.set('status', filter)
    api.get<PageData>(`/preorders?${params}`)
      .then(setData)
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  function open(r: PreorderRequest) {
    setSelected(r); setStatus(r.status); setNote(r.adminNote ?? '')
  }

  async function save() {
    if (!selected) return
    setSaving(true)
    try {
      await api.patch(`/preorders/${selected.id}`, { status, adminNote: note })
      setSelected(null); load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cette demande de précommande ?')) return
    await api.delete(`/preorders/${id}`).catch((e) => alert(e.message))
    setSelected(null); load()
  }

  /** Montant des articles, avant frais de service. */
  const subtotal = (r: PreorderRequest) =>
    r.items.reduce((sum, i) => sum + Number(i.unitPrice) * i.quantity, 0)

  /** Ce que le client a réellement à régler : c'est ce montant qu'il a vu. */
  const total = (r: PreorderRequest) => totalWithServiceFee(subtotal(r))

  /** Résumé d'une demande en une ligne : au-delà d'un article on abrège. */
  const summary = (r: PreorderRequest) => {
    const [first, ...rest] = r.items
    if (!first) return 'Aucun article'
    const head = `${first.quantity} × ${first.productName}${first.color ? ` · ${first.color}` : ''}`
    return rest.length ? `${head} + ${rest.length} autre(s)` : head
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Précommandes</h1>
        <p className="text-sm text-muted-foreground mt-1">{data?.meta.total ?? '—'} demande(s) — aucun paiement encaissé</p>
      </div>

      {/* Filtres */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide">
        {FILTERS.map((f) => (
          <button key={f.id || 'all'} onClick={() => setFilter(f.id)}
            className={`flex-shrink-0 px-3.5 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              filter === f.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-ring/40'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
            <PackageCheck className="w-8 h-8" /><p className="text-sm">Aucune précommande</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data.items.map((r) => (
              <button key={r.id} onClick={() => open(r)}
                className="w-full text-left flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition-colors">
                {r.items[0]?.product?.images?.[0]?.url ? (
                  <img src={r.items[0]!.product!.images[0]!.url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded bg-muted shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{r.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{summary(r)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-foreground">{formatPrice(total(r))}</p>
                  <p className="text-xs text-muted-foreground">{DATE_FMT.format(new Date(r.createdAt))}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Détail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-foreground text-lg">{selected.name}</h2>
                <p className="text-xs text-muted-foreground">
                  Reçue le {DATE_FMT.format(new Date(selected.createdAt))} ·{' '}
                  {selected.items.reduce((n, i) => n + i.quantity, 0)} article(s)
                </p>
              </div>
              <button onClick={() => remove(selected.id)}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Les produits et les prix sont ceux figés à la soumission : ils restent
                justes même si le tarif a changé ou le produit été supprimé. */}
            <div className="bg-muted/50 rounded-lg divide-y divide-gray-200/70">
              {selected.items.map((item) => (
                <div key={item.id} className="flex gap-3 p-3">
                  <Thumb
                    url={item.product?.images?.[0]?.url}
                    alt={item.product?.images?.[0]?.alt ?? item.productName}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-medium text-foreground">{item.productName}</p>
                      <p className="text-sm font-semibold text-foreground shrink-0">
                        {formatPrice(Number(item.unitPrice) * item.quantity)}
                      </p>
                    </div>

                    <p className="text-sm text-muted-foreground mt-0.5">
                      {item.quantity} × {formatPrice(Number(item.unitPrice))}
                      {item.color && (
                        <span className="inline-flex items-center gap-1.5 ml-2 text-muted-foreground">
                          <Palette className="w-3.5 h-3.5" />{item.color}
                        </span>
                      )}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                      {item.releaseDate && (
                        <span className="flex items-center gap-1.5">
                          <CalendarClock className="w-3.5 h-3.5" />
                          Sortie le {DATE_FMT.format(new Date(item.releaseDate))}
                        </span>
                      )}
                      {item.product?.sku && (
                        <span className="flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5" />{item.product.sku}
                        </span>
                      )}
                      {item.product && (
                        <span className="flex items-center gap-1.5">
                          <Boxes className="w-3.5 h-3.5" />Stock {item.product.stock}
                        </span>
                      )}
                    </div>

                    {/* Le produit peut avoir été retiré ou dépublié depuis la
                        réservation : la ligne reste juste, mais il faut le voir. */}
                    {!item.product ? (
                      <p className="flex items-center gap-1.5 text-xs text-warning mt-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />Produit supprimé du catalogue
                      </p>
                    ) : !item.product.isActive ? (
                      <p className="flex items-center gap-1.5 text-xs text-warning mt-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />Produit désactivé
                      </p>
                    ) : (
                      <a
                        href={`/products/${item.product.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mt-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />Voir la fiche produit
                      </a>
                    )}
                  </div>
                </div>
              ))}
              <div className="p-3 space-y-1.5">
                <div className="flex items-baseline justify-between gap-3 text-sm text-muted-foreground">
                  <span>Sous-total</span>
                  <span>{formatPrice(subtotal(selected))}</span>
                </div>
                <div className="flex items-baseline justify-between gap-3 text-sm text-muted-foreground">
                  <span>{SERVICE_FEE_LABEL}</span>
                  <span>{formatPrice(serviceFee(subtotal(selected)))}</span>
                </div>
                <div className="flex items-baseline justify-between gap-3 pt-1.5 border-t border-border/70">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Total à régler
                  </span>
                  <span className="font-semibold text-foreground">{formatPrice(total(selected))}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-foreground">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <a href={`tel:${selected.phone}`} className="flex items-center gap-2 hover:text-foreground">
                  <Phone className="w-4 h-4 text-muted-foreground" />{selected.phone}
                </a>
                {/* Rappel du client en un clic : c'est par WhatsApp que la
                    confirmation se fait, pas par email. */}
                <a
                  href={`https://wa.me/${selected.phone.replace(/\D/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-green-700 hover:text-green-800"
                >
                  <MessageCircle className="w-4 h-4" />WhatsApp
                </a>
              </div>
              {selected.deliveryPlace && (
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />{selected.deliveryPlace}
                </p>
              )}
              {selected.email && (
                <a href={`mailto:${selected.email}`} className="flex items-center gap-2 truncate hover:text-foreground">
                  <Mail className="w-4 h-4 text-muted-foreground" />{selected.email}
                </a>
              )}
            </div>

            {selected.message && (
              <div className="text-sm text-foreground bg-muted/50 rounded-lg p-3">{selected.message}</div>
            )}

            <hr className="border-border" />

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Statut</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as Status)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {(Object.keys(STATUS) as Status[]).map((s) => (
                  <option key={s} value={s}>{STATUS[s].label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Note interne</label>
              <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Note visible uniquement en interne…"
                className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setSelected(null)}
                className="flex-1 py-2 text-sm text-foreground border border-border rounded-lg hover:bg-accent transition-colors">
                Fermer
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
