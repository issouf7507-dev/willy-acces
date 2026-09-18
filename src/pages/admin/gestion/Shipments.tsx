import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { fetchAllProducts } from '../../../lib/catalog'
import {
  Plus, Trash2, Loader2, Truck, PackageCheck, Ban, ChevronRight, AlertTriangle, Layers,
} from 'lucide-react'

type Status = 'DRAFT' | 'RECEIVED' | 'CANCELLED'

interface ShipmentItem {
  id: string
  productId: string
  groupId: string | null
  storeId: string
  store: { id: string; name: string }
  quantity: number
  unitCost: string | number
  plannedPrice: string | number | null
  unitShipping: string | number | null
  landedCost: string | number | null
  product: { id: string; name: string; sku: string | null; stock: number }
}

interface ShipmentGroup {
  id: string
  code: string
  label: string | null
  shippingCost: string | number
}

interface Shipment {
  id: string
  code: string
  label: string | null
  storeId: string | null
  store: { id: string; name: string } | null
  status: Status
  orderedAt: string | null
  receivedAt: string | null
  notes: string | null
  items: ShipmentItem[]
  groups: ShipmentGroup[]
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

const totalQty = (s: Shipment) => s.items.reduce((sum, i) => sum + i.quantity, 0)
const totalPurchase = (s: Shipment) =>
  s.items.reduce((sum, i) => sum + n(i.unitCost) * i.quantity, 0)
const totalShipping = (s: Shipment) => s.groups.reduce((sum, g) => sum + n(g.shippingCost), 0)

/** Quantité du groupe : c'est elle qui divise son transport. */
const groupQty = (s: Shipment, groupId: string) =>
  s.items.filter((i) => i.groupId === groupId).reduce((sum, i) => sum + i.quantity, 0)
const groupUnitShipping = (s: Shipment, g: ShipmentGroup) => {
  const qty = groupQty(s, g.id)
  return qty > 0 ? n(g.shippingCost) / qty : 0
}

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

  // Produits cochés dans l'arrivage ouvert, pour en faire un groupe.
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [groupShipping, setGroupShipping] = useState('')

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
      const created = await api.post<Shipment>('/gestion/shipments', {})
      openShipment(created)
    })
  }

  function openShipment(s: Shipment | null) {
    setOpen(s)
    setSelected(new Set())
    setGroupShipping('')
    setError('')
  }

  function toggle(itemId: string) {
    setSelected((cur) => {
      const next = new Set(cur)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  async function createGroup(s: Shipment) {
    if (!selected.size) { setError('Cochez les produits qui forment le groupe'); return }
    const shippingCost = Number(groupShipping || 0)
    if (!(shippingCost >= 0)) { setError('Coût de transport invalide'); return }
    await run(async () => {
      await api.post(`/gestion/shipments/${s.id}/groups`, { shippingCost, itemIds: [...selected] })
      setSelected(new Set())
      setGroupShipping('')
    })
  }

  /** Un arrivage réceptionné ne se supprime pas : il porte l'historique du stock. */
  function deleteShipment(s: Shipment) {
    if (!confirm(`Supprimer l'arrivage ${s.code} et ses groupes ?`)) return
    run(async () => {
      await api.delete(`/gestion/shipments/${s.id}`)
      if (open?.id === s.id) openShipment(null)
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
  const ungroupedCount = open ? open.items.filter((i) => !i.groupId).length : 0

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Arrivages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            On saisit ce que le cargo livre, puis on répartit les produits en groupes : le transport de
            chaque groupe est réparti à l'unité, c'est ce qui donne le vrai coût de revient.
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
              <div key={s.id} className="flex items-center hover:bg-muted/40 transition-colors">
              <button onClick={() => openShipment(s)}
                className="flex-1 min-w-0 flex items-center gap-4 pl-6 pr-3 py-4 text-left">
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
                    {s.items.length} produit(s) · {totalQty(s)} article(s) · {s.groups.length} groupe(s)
                    {s.groups.length > 0 && ` (${s.groups.map((g) => g.code).join(', ')})`} · achat {fcfa(totalPurchase(s))} · transport {fcfa(totalShipping(s))}
                    {s.receivedAt ? ` · reçu le ${new Date(s.receivedAt).toLocaleDateString('fr-FR')}` : ''}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
              </button>
              <div className="w-12 pr-4 flex justify-end">
                {s.status !== 'RECEIVED' && (
                  <button onClick={() => deleteShipment(s)} disabled={busy}
                    title={`Supprimer l'arrivage ${s.code}`} aria-label={`Supprimer l'arrivage ${s.code}`}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive disabled:opacity-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              </div>
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
              <button onClick={() => openShipment(null)} className="text-sm text-muted-foreground hover:text-foreground">Fermer</button>
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
              </div>

              {/* Produits reçus */}
              <div>
                <h3 className="text-sm font-semibold text-foreground">Produits reçus</h3>
                <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                  Tout ce que le cargo a livré.{editable && ' Cochez des produits pour en faire un groupe.'}
                </p>
              <div className="border border-border rounded-xl overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs text-muted-foreground">
                    <tr>
                      {editable && <th className="w-8 pl-4 py-2.5" />}
                      <th className="text-left font-medium px-4 py-2.5">Produit</th>
                      <th className="text-left font-medium px-3 py-2.5">Boutique</th>
                      <th className="text-left font-medium px-3 py-2.5">Groupe</th>
                      <th className="text-right font-medium px-3 py-2.5">Qté</th>
                      <th className="text-right font-medium px-3 py-2.5">Achat/u</th>
                      <th className="text-right font-medium px-3 py-2.5">Transport/u</th>
                      <th className="text-right font-medium px-3 py-2.5">Revient/u</th>
                      <th className="px-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {open.items.map((i) => {
                      // Avant réception rien n'est figé : on montre la projection
                      // d'après le groupe de la ligne.
                      const group = open.groups.find((g) => g.id === i.groupId)
                      const preview = group ? groupUnitShipping(open, group) : null
                      const shipping = i.unitShipping != null ? n(i.unitShipping) : preview
                      const landed = i.landedCost != null
                        ? n(i.landedCost)
                        : preview != null ? n(i.unitCost) + preview : null
                      return (
                        <tr key={i.id} className={selected.has(i.id) ? 'bg-primary/5' : ''}>
                          {editable && (
                            <td className="pl-4 py-2.5">
                              <input type="checkbox" checked={selected.has(i.id)} onChange={() => toggle(i.id)}
                                aria-label={`Sélectionner ${i.product.name}`} className="accent-primary" />
                            </td>
                          )}
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
                          <td className="px-3 py-2.5">
                            {editable ? (
                              <select value={i.groupId ?? ''}
                                onChange={(e) => run(() => api.patch(
                                  `/gestion/shipments/${open.id}/items/${i.id}`,
                                  { groupId: e.target.value || null },
                                ))}
                                className={`px-2 py-1 rounded-md border text-xs bg-card focus:outline-none focus:ring-2 focus:ring-ring ${i.groupId ? 'border-border' : 'border-warning text-warning'}`}>
                                <option value="">Sans groupe</option>
                                {open.groups.map((g) => <option key={g.id} value={g.id}>{g.code}</option>)}
                              </select>
                            ) : (
                              <span className="text-muted-foreground">{group?.code ?? '—'}</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums">{i.quantity}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums">{fcfa(i.unitCost)}</td>
                          <td className={`px-3 py-2.5 text-right tabular-nums ${i.unitShipping == null ? 'text-muted-foreground italic' : ''}`}>
                            {shipping == null ? '—' : fcfa(shipping)}
                          </td>
                          <td className={`px-3 py-2.5 text-right tabular-nums font-medium ${i.landedCost == null ? 'text-muted-foreground italic' : 'text-foreground'}`}>
                            {landed == null ? '—' : fcfa(landed)}
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
                      <tr><td colSpan={editable ? 9 : 8} className="px-4 py-6 text-center text-sm text-muted-foreground">Aucune ligne</td></tr>
                    )}
                  </tbody>
                  {open.items.length > 0 && (
                    <tfoot className="bg-muted/50 text-xs text-muted-foreground">
                      <tr>
                        {editable && <td />}
                        <td className="px-4 py-2.5 font-medium">Total</td>
                        <td />
                        <td />
                        <td className="px-3 py-2.5 text-right tabular-nums font-medium">{totalQty(open)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{fcfa(totalPurchase(open))}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{fcfa(totalShipping(open))}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-medium text-foreground">
                          {fcfa(totalPurchase(open) + totalShipping(open))}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
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

              {/* Groupes */}
              <div>
                <h3 className="text-sm font-semibold text-foreground">Groupes</h3>
                <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                  Chaque groupe porte son transport, réparti à l'unité sur ses seuls produits.
                </p>

                {editable && open.items.length > 0 && (
                  <div className="flex flex-wrap items-end gap-2 mb-3 bg-muted/50 border border-border rounded-lg p-3">
                    <div className="flex-1 min-w-[10rem]">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Transport du groupe</label>
                      <input type="number" min="0" value={groupShipping} placeholder="0"
                        onChange={(e) => setGroupShipping(e.target.value)} className={`${input} py-2 bg-card`} />
                    </div>
                    <button onClick={() => createGroup(open)} disabled={busy || !selected.size}
                      className="flex items-center gap-1.5 px-3 py-2.5 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
                      <Layers className="w-4 h-4" />
                      Créer un groupe{selected.size ? ` avec ${selected.size} produit(s)` : ''}
                    </button>
                  </div>
                )}

                {open.groups.length ? (
                  <div className="border border-border rounded-xl divide-y divide-border">
                    {open.groups.map((g) => {
                      const products = open.items.filter((i) => i.groupId === g.id)
                      return (
                        <div key={g.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                          <span className="font-medium text-foreground w-10">{g.code}</span>
                          <div className="flex-1 min-w-[12rem] text-xs text-muted-foreground">
                            {products.length
                              ? products.map((i) => `${i.product.name} ×${i.quantity}`).join(', ')
                              : <span className="text-warning">Groupe vide</span>}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Transport</span>
                            {editable ? (
                              <input type="number" min="0" defaultValue={String(n(g.shippingCost))}
                                key={`${g.id}-${g.shippingCost}`}
                                onBlur={(e) => {
                                  const shippingCost = Number(e.target.value || 0)
                                  if (shippingCost !== n(g.shippingCost)) {
                                    run(() => api.patch(`/gestion/shipments/${open.id}/groups/${g.id}`, { shippingCost }))
                                  }
                                }}
                                className="w-28 px-2 py-1 rounded-md border border-border text-xs text-right focus:outline-none focus:ring-2 focus:ring-ring" />
                            ) : (
                              <span className="tabular-nums text-foreground">{fcfa(g.shippingCost)}</span>
                            )}
                            <span className="text-muted-foreground tabular-nums">
                              · {groupQty(open, g.id)} art. · {fcfa(groupUnitShipping(open, g))}/u
                            </span>
                          </div>
                          {editable && (
                            <button onClick={() => run(() => api.delete(`/gestion/shipments/${open.id}/groups/${g.id}`))}
                              title="Supprimer le groupe (les produits restent dans l'arrivage)"
                              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground border border-dashed border-border rounded-xl px-4 py-5 text-center">
                    Aucun groupe
                  </p>
                )}

                {editable && ungroupedCount > 0 && (
                  <p className="text-xs text-warning mt-2">
                    {ungroupedCount} produit(s) sans groupe : à répartir avant la réception.
                  </p>
                )}
              </div>

              {open.status === 'RECEIVED' && (
                <p className="text-xs text-success bg-emerald-50 rounded-lg px-4 py-3">
                  Réceptionné : le stock a été incrémenté et le coût de revient moyen des produits recalculé.
                  Pour corriger, passez par un mouvement de stock d'ajustement.
                </p>
              )}
            </div>

            {open.status !== 'RECEIVED' && (
              <div className="flex flex-wrap gap-3 px-6 py-4 border-t border-border">
                {editable && (<>
                <button onClick={() => run(() => api.post(`/gestion/shipments/${open.id}/receive`, {}))}
                  disabled={busy || !open.items.length || ungroupedCount > 0}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />}
                  Réceptionner
                </button>
                <button onClick={() => run(() => api.post(`/gestion/shipments/${open.id}/cancel`, {}))} disabled={busy}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground border border-border rounded-lg hover:bg-accent transition-colors">
                  <Ban className="w-4 h-4" /> Annuler l'arrivage
                </button>
                </>)}
                <button onClick={() => deleteShipment(open)} disabled={busy}
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
