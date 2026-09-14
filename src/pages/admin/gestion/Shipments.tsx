import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { fetchAllProducts } from '../../../lib/catalog'
import {
  Plus, Trash2, Loader2, Truck, PackageCheck, Ban, ChevronRight, AlertTriangle,
} from 'lucide-react'

type Status = 'DRAFT' | 'RECEIVED' | 'CANCELLED'

interface ShipmentItem {
  id: string
  productId: string
  storeId: string
  store: { id: string; name: string }
  quantity: number
  unitCost: string | number
  plannedPrice: string | number | null
  unitShipping: string | number | null
  landedCost: string | number | null
  product: { id: string; name: string; sku: string | null; stock: number }
}

interface Shipment {
  id: string
  code: string
  label: string | null
  storeId: string | null
  store: { id: string; name: string } | null
  shippingCost: string | number
  status: Status
  orderedAt: string | null
  receivedAt: string | null
  notes: string | null
  items: ShipmentItem[]
}

interface ProductOption { id: string; name: string; sku: string | null }
interface StoreOption { id: string; name: string }

/** Valeur sentinelle du sélecteur : « l'article reçu n'est pas au catalogue ». */
const NEW_PRODUCT = '__new__'

const STATUS_BADGE: Record<Status, string> = {
  DRAFT: 'bg-warning/15 text-warning',
  RECEIVED: 'bg-success/15 text-success',
  CANCELLED: 'bg-muted text-muted-foreground',
}
const STATUS_LABEL: Record<Status, string> = {
  DRAFT: 'Brouillon',
  RECEIVED: 'Réceptionné',
  CANCELLED: 'Annulé',
}

const input =
  'w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring'

const n = (v: string | number | null | undefined) => (v == null ? 0 : Number(v))
const fcfa = (v: string | number | null | undefined) =>
  n(v).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' F'

/** Quantité totale du lot : c'est elle qui divise le transport. */
const totalQty = (s: Shipment) => s.items.reduce((sum, i) => sum + i.quantity, 0)
const totalPurchase = (s: Shipment) =>
  s.items.reduce((sum, i) => sum + n(i.unitCost) * i.quantity, 0)

export default function Shipments() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [stores, setStores] = useState<StoreOption[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<Shipment | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Formulaire de nouvelle ligne, dans l'arrivage ouvert. `productId` vaut
  // NEW_PRODUCT quand l'article reçu n'existe pas encore au catalogue : on le
  // crée alors à la volée, à partir du nom et du prix de vente saisis ici.
  const [line, setLine] = useState({
    productId: '', quantity: '', unitCost: '', plannedPrice: '', name: '', storeId: '',
  })
  const creatingProduct = line.productId === NEW_PRODUCT

  const load = () => {
    setLoading(true)
    api.get<Shipment[]>('/gestion/shipments')
      .then((list) => {
        setShipments(list)
        // Garde le panneau ouvert synchronisé après une action.
        setOpen((cur) => (cur ? list.find((s) => s.id === cur.id) ?? null : null))
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    fetchAllProducts<ProductOption>()
      .then(setProducts)
      .catch((e) => setError(e instanceof Error ? e.message : 'Catalogue indisponible'))
    api.get<StoreOption[]>('/gestion/stores')
      .then(setStores)
      .catch(() => setStores([]))
  }, [])

  async function run(fn: () => Promise<unknown>) {
    setBusy(true); setError('')
    try {
      await fn()
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  async function createShipment() {
    await run(async () => {
      const created = await api.post<Shipment>('/gestion/shipments', { shippingCost: 0 })
      setOpen(created)
    })
  }

  async function addLine(s: Shipment) {
    if (!line.productId) { setError('Choisissez un produit'); return }
    const quantity = Number(line.quantity)
    const unitCost = Number(line.unitCost)
    const plannedPrice = line.plannedPrice ? Number(line.plannedPrice) : undefined
    if (!Number.isInteger(quantity) || quantity <= 0) { setError('Quantité invalide'); return }
    if (!(unitCost >= 0)) { setError("Prix d'achat invalide"); return }

    if (creatingProduct) {
      if (line.name.trim().length < 2) { setError('Donnez un nom au nouveau produit'); return }
      if (!plannedPrice || plannedPrice <= 0) { setError('Indiquez le prix de vente prévu'); return }
    }

    // Sans boutique sur la ligne, celle du lot s'applique.
    const storeId = line.storeId || s.storeId || ''
    if (!storeId) { setError('Choisissez la boutique qui reçoit cet article'); return }

    await run(async () => {
      let productId = line.productId

      if (creatingProduct) {
        // Créé en brouillon : l'article reçu entre en stock tout de suite, mais
        // ne s'affiche sur la boutique qu'une fois sa fiche complétée (photo,
        // description, catégorie) et cochée active.
        const created = await api.post<ProductOption>('/products', {
          name: line.name.trim(),
          price: plannedPrice,
          isActive: false,
        })
        productId = created.id
        // Disponible immédiatement pour les lignes suivantes du même lot.
        setProducts((list) => [...list, created].sort((a, b) => a.name.localeCompare(b.name)))
      }

      await api.post(`/gestion/shipments/${s.id}/items`, {
        productId,
        storeId,
        quantity,
        unitCost,
        plannedPrice,
      })
      setLine({ productId: '', quantity: '', unitCost: '', plannedPrice: '', name: '', storeId: '' })
    })
  }

  const editable = open?.status === 'DRAFT'
  // Aperçu en direct : ce que donnera la réception si on la lançait maintenant.
  const previewUnitShipping =
    open && totalQty(open) > 0 ? n(open.shippingCost) / totalQty(open) : 0

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Arrivages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Le transport du lot est réparti à l'unité : c'est ce qui donne le vrai coût de revient.
          </p>
        </div>
        <button onClick={createShipment} disabled={busy}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
          <Plus className="w-4 h-4" /> Nouvel arrivage
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 px-4 py-3 rounded-lg bg-red-50 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !shipments.length ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
            <Truck className="w-8 h-8" />
            <p className="text-sm">Aucun arrivage</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {shipments.map((s) => (
              <button key={s.id} onClick={() => { setOpen(s); setError('') }}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition-colors text-left">
                <div className="shrink-0 w-11 h-11 rounded-lg bg-muted flex items-center justify-center">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{s.code}</span>
                    {s.label && <span className="text-sm text-muted-foreground">{s.label}</span>}
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_BADGE[s.status]}`}>
                      {STATUS_LABEL[s.status]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.items.length} ligne(s) · {totalQty(s)} article(s) · achat {fcfa(totalPurchase(s))} · transport {fcfa(s.shippingCost)}
                    {s.receivedAt ? ` · reçu le ${new Date(s.receivedAt).toLocaleDateString('fr-FR')}` : ''}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
              </button>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-3xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-foreground">Arrivage {open.code}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_BADGE[open.status]}`}>
                  {STATUS_LABEL[open.status]}
                </span>
              </div>
              <button onClick={() => setOpen(null)} className="text-sm text-muted-foreground hover:text-foreground">Fermer</button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Libellé</label>
                  <input value={open.label ?? ''} disabled={!editable}
                    onChange={(e) => setOpen({ ...open, label: e.target.value })}
                    onBlur={() => editable && run(() => api.patch(`/gestion/shipments/${open.id}`, { label: open.label ?? '' }))}
                    className={`${input} disabled:bg-muted/50 disabled:text-muted-foreground`} placeholder="Lot de septembre" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Boutique du lot</label>
                  <select value={open.storeId ?? ''} disabled={!editable}
                    onChange={(e) => {
                      const storeId = e.target.value || null
                      setOpen({ ...open, storeId })
                      run(() => api.patch(`/gestion/shipments/${open.id}`, { storeId }))
                    }}
                    className={`${input} bg-card disabled:bg-muted/50 disabled:text-muted-foreground`}>
                    <option value="">Aucune — à préciser sur chaque ligne</option>
                    {stores.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Reprise par défaut sur chaque ligne. Un lot partagé se répartit ligne par ligne.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Coût de transport du lot</label>
                  <input type="number" min="0" value={String(n(open.shippingCost))} disabled={!editable}
                    onChange={(e) => setOpen({ ...open, shippingCost: e.target.value })}
                    onBlur={() => editable && run(() => api.patch(`/gestion/shipments/${open.id}`, { shippingCost: n(open.shippingCost) }))}
                    className={`${input} disabled:bg-muted/50 disabled:text-muted-foreground`} />
                </div>
              </div>

              {/* Lignes */}
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs text-muted-foreground">
                    <tr>
                      <th className="text-left font-medium px-4 py-2.5">Produit</th>
                      <th className="text-left font-medium px-3 py-2.5">Boutique</th>
                      <th className="text-right font-medium px-3 py-2.5">Qté</th>
                      <th className="text-right font-medium px-3 py-2.5">Achat/u</th>
                      <th className="text-right font-medium px-3 py-2.5">Transport/u</th>
                      <th className="text-right font-medium px-3 py-2.5">Revient/u</th>
                      <th className="px-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {open.items.map((i) => {
                      // Avant réception rien n'est figé : on montre la projection.
                      const shipping = i.unitShipping != null ? n(i.unitShipping) : previewUnitShipping
                      const landed = i.landedCost != null ? n(i.landedCost) : n(i.unitCost) + previewUnitShipping
                      return (
                        <tr key={i.id}>
                          <td className="px-4 py-2.5">
                            <span className="text-foreground">{i.product.name}</span>
                            <span className="block text-xs text-muted-foreground">stock actuel : {i.product.stock}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            {editable ? (
                              <select value={i.storeId}
                                onChange={(e) => run(() => api.patch(
                                  `/gestion/shipments/${open.id}/items/${i.id}`,
                                  { storeId: e.target.value },
                                ))}
                                className="px-2 py-1 rounded-md border border-border text-xs bg-card focus:outline-none focus:ring-2 focus:ring-ring">
                                {stores.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
                              </select>
                            ) : (
                              <span className="text-muted-foreground">{i.store?.name ?? '—'}</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums">{i.quantity}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums">{fcfa(i.unitCost)}</td>
                          <td className={`px-3 py-2.5 text-right tabular-nums ${i.unitShipping == null ? 'text-muted-foreground italic' : ''}`}>
                            {fcfa(shipping)}
                          </td>
                          <td className={`px-3 py-2.5 text-right tabular-nums font-medium ${i.landedCost == null ? 'text-muted-foreground italic' : 'text-foreground'}`}>
                            {fcfa(landed)}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {editable && (
                              <button onClick={() => run(() => api.delete(`/gestion/shipments/${open.id}/items/${i.id}`))}
                                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                    {!open.items.length && (
                      <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-muted-foreground">Aucune ligne</td></tr>
                    )}
                  </tbody>
                  {open.items.length > 0 && (
                    <tfoot className="bg-muted/50 text-xs text-muted-foreground">
                      <tr>
                        <td className="px-4 py-2.5 font-medium">Total</td>
                        <td />
                        <td className="px-3 py-2.5 text-right tabular-nums font-medium">{totalQty(open)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{fcfa(totalPurchase(open))}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{fcfa(open.shippingCost)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-medium text-foreground">
                          {fcfa(totalPurchase(open) + n(open.shippingCost))}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {editable && (
                <div className="space-y-2">
                  <div className="grid sm:grid-cols-6 gap-2 items-end">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Produit</label>
                      <select value={line.productId} onChange={(e) => setLine(l => ({ ...l, productId: e.target.value }))}
                        className={`${input} bg-card py-2`}>
                        <option value="">Choisir…</option>
                        <option value={NEW_PRODUCT}>+ Article pas encore au catalogue</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Boutique</label>
                      <select value={line.storeId || open.storeId || ''}
                        onChange={(e) => setLine(l => ({ ...l, storeId: e.target.value }))}
                        className={`${input} bg-card py-2`}>
                        <option value="">Choisir…</option>
                        {stores.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Quantité</label>
                      <input type="number" min="1" value={line.quantity}
                        onChange={(e) => setLine(l => ({ ...l, quantity: e.target.value }))} className={`${input} py-2`} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Achat/u</label>
                      <input type="number" min="0" value={line.unitCost}
                        onChange={(e) => setLine(l => ({ ...l, unitCost: e.target.value }))} className={`${input} py-2`} />
                    </div>
                    <button onClick={() => addLine(open)} disabled={busy}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
                      <Plus className="w-4 h-4" /> Ajouter
                    </button>
                  </div>

                  {/* Article nouveau : sa fiche produit est créée avec la ligne. */}
                  {creatingProduct && (
                    <div className="grid sm:grid-cols-5 gap-2 items-end bg-muted/50 border border-border rounded-lg p-3">
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Nom de l'article *</label>
                        <input value={line.name} autoFocus
                          onChange={(e) => setLine(l => ({ ...l, name: e.target.value }))}
                          className={`${input} py-2`} placeholder="Casque bluetooth" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Prix de vente prévu *</label>
                        <input type="number" min="0" value={line.plannedPrice}
                          onChange={(e) => setLine(l => ({ ...l, plannedPrice: e.target.value }))}
                          className={`${input} py-2`} placeholder="15000" />
                      </div>
                      <p className="sm:col-span-5 text-xs text-muted-foreground">
                        La fiche est créée en brouillon, hors ligne : l'article entre en stock à la
                        réception, et n'apparaît sur la boutique qu'une fois sa fiche complétée
                        (photo, description) et activée depuis <strong>Catalogue › Produits</strong>.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {editable && open.items.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  À la réception : {fcfa(open.shippingCost)} de transport répartis sur {totalQty(open)} article(s),
                  soit <strong>{fcfa(previewUnitShipping)}</strong> par unité ajoutés au prix d'achat.
                </p>
              )}

              {open.status === 'RECEIVED' && (
                <p className="text-xs text-success bg-emerald-50 rounded-lg px-4 py-3">
                  Réceptionné : le stock a été incrémenté et le coût de revient moyen des produits recalculé.
                  Pour corriger, passez par un mouvement de stock d'ajustement.
                </p>
              )}
            </div>

            {editable && (
              <div className="flex flex-wrap gap-3 px-6 py-4 border-t border-border">
                <button onClick={() => run(() => api.post(`/gestion/shipments/${open.id}/receive`, {}))}
                  disabled={busy || !open.items.length}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />}
                  Réceptionner
                </button>
                <button onClick={() => run(() => api.post(`/gestion/shipments/${open.id}/cancel`, {}))} disabled={busy}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground border border-border rounded-lg hover:bg-accent transition-colors">
                  <Ban className="w-4 h-4" /> Annuler l'arrivage
                </button>
                <button
                  onClick={() => {
                    if (!confirm(`Supprimer l'arrivage ${open.code} ?`)) return
                    run(async () => { await api.delete(`/gestion/shipments/${open.id}`); setOpen(null) })
                  }}
                  disabled={busy}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-destructive border border-red-100 rounded-lg hover:bg-destructive/10 transition-colors ml-auto">
                  <Trash2 className="w-4 h-4" /> Supprimer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
