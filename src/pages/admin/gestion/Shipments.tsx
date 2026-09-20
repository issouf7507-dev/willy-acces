import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../../lib/api'
import { fetchAllProducts } from '../../../lib/catalog'
import {
  Plus, Trash2, Loader2, Truck, Ban, ChevronRight, AlertTriangle, Layers, Lock,
} from 'lucide-react'
import {
  type Shipment, SHIPMENT_BADGE, SHIPMENT_LABEL, GROUP_BADGE, GROUP_LABEL,
  input, n, fcfa, isOpen, hasReceivedGroup, receivedQty, remainingQty, orderedTotal, receivedTotal,
  groupsCustoms,
} from './shipment-utils'

interface ProductOption { id: string; name: string; sku: string | null }
interface StoreOption { id: string; name: string }

/** Valeur sentinelle du sélecteur : « l'article commandé n'est pas au catalogue ». */
const NEW_PRODUCT = '__new__'

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

  // Formulaire de création. Tant qu'il est ouvert, rien n'existe en base :
  // l'arrivage n'est écrit qu'à l'enregistrement, pour ne pas laisser de
  // brouillons vides derrière un clic d'essai.
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState({ label: '', storeId: '', customsCost: '' })

  // Formulaire de nouvelle ligne, dans l'arrivage ouvert. `productId` vaut
  // NEW_PRODUCT quand l'article commandé n'existe pas encore au catalogue : on
  // le crée alors à la volée, à partir du nom et du prix de vente saisis ici.
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

  function openShipment(s: Shipment | null) {
    setOpen(s)
    setError('')
  }

  function startCreate() {
    setDraft({ label: '', storeId: '', customsCost: '' })
    setError('')
    setCreating(true)
  }

  async function createShipment() {
    const customsCost = Number(draft.customsCost || 0)
    if (!(customsCost >= 0)) { setError('Douane invalide'); return }
    await run(async () => {
      const created = await api.post<Shipment>('/gestion/shipments', {
        // Le libellé reste facultatif : le code (A1, A2…) est attribué par le
        // serveur et suffit à identifier l'arrivage.
        label: draft.label.trim() || undefined,
        storeId: draft.storeId || null,
        customsCost,
      })
      setCreating(false)
      openShipment(created)
    })
  }

  /** Un arrivage dont une livraison est reçue porte l'historique du stock. */
  function deleteShipment(s: Shipment) {
    if (!confirm(`Supprimer l'arrivage ${s.code} et ses groupes en brouillon ?`)) return
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
        // Créé en brouillon : l'article entre en stock à sa livraison, mais ne
        // s'affiche sur la boutique qu'une fois sa fiche complétée (photo,
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

  const editable = open ? isOpen(open) : false

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Arrivages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ce qui est commandé au fournisseur. Chaque livraison reçue forme un{' '}
            <Link to="/admin/gestion/groups" className="underline hover:text-foreground">groupe</Link>.
          </p>
        </div>
        <button onClick={startCreate} disabled={busy}
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
          <Plus className="w-4 h-4" /> Nouvel arrivage
        </button>
      </div>

      {error && !open && !creating && (
        <div className="mb-4 flex items-start gap-2 px-4 py-3 rounded-lg bg-red-50 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading && !shipments.length ? (
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
            {shipments.map((s) => {
              const ordered = orderedTotal(s)
              const received = receivedTotal(s)
              return (
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
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${SHIPMENT_BADGE[s.status]}`}>
                          {SHIPMENT_LABEL[s.status]}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {s.items.length} produit(s) · reçu <strong className="text-foreground">{received}/{ordered}</strong>
                        {s.groups.length > 0 && ` · groupes ${s.groups.map((g) => g.code).join(', ')}`}
                        {' '}· achat {fcfa(totalPurchase(s))}
                        {n(s.customsCost) > 0 && ` · douane annoncée ${fcfa(s.customsCost)}`}
                      </p>
                      {ordered > 0 && s.status !== 'CANCELLED' && (
                        <div className="mt-2 h-1.5 w-full max-w-xs rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-success" style={{ width: `${Math.min(100, (received / ordered) * 100)}%` }} />
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                  </button>
                  <div className="w-12 pr-4 flex justify-end">
                    {!hasReceivedGroup(s) && (
                      <button onClick={() => deleteShipment(s)} disabled={busy}
                        title={`Supprimer l'arrivage ${s.code}`} aria-label={`Supprimer l'arrivage ${s.code}`}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive disabled:opacity-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <form
            onSubmit={(e) => { e.preventDefault(); createShipment() }}
            className="bg-card rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 my-8"
          >
            <div>
              <h2 className="font-semibold text-foreground">Nouvel arrivage</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Son code (A1, A2…) est attribué à l'enregistrement. Les produits commandés
                s'ajoutent ensuite, dans la fiche.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Libellé</label>
              <input autoFocus value={draft.label}
                onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                maxLength={120} className={input} placeholder="Commande de septembre" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Boutique par défaut</label>
              <select value={draft.storeId}
                onChange={(e) => setDraft((d) => ({ ...d, storeId: e.target.value }))}
                className={`${input} bg-card`}>
                <option value="">Aucune — à préciser sur chaque ligne</option>
                {stores.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Douane de l'arrivage
              </label>
              <input type="number" min="0" value={draft.customsCost} placeholder="0"
                onChange={(e) => setDraft((d) => ({ ...d, customsCost: e.target.value }))}
                className={input} />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Le dédouanement annoncé pour tout le lot. Prévisionnel : la douane qui entre
                dans le coût de revient est celle saisie sur chaque groupe, à la réception.
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => { setCreating(false); setError('') }}
                className="flex-1 py-2 text-sm text-foreground border border-border rounded-lg hover:bg-accent transition-colors">
                Annuler
              </button>
              <button type="submit" disabled={busy}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-4xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-foreground">Arrivage {open.code}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${SHIPMENT_BADGE[open.status]}`}>
                  {SHIPMENT_LABEL[open.status]}
                </span>
              </div>
              <button onClick={() => openShipment(null)} className="text-sm text-muted-foreground hover:text-foreground">Fermer</button>
            </div>

            <div className="p-6 space-y-6">
              {error && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-red-50 text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Libellé</label>
                  <input value={open.label ?? ''} disabled={!editable}
                    onChange={(e) => setOpen({ ...open, label: e.target.value })}
                    onBlur={() => editable && run(() => api.patch(`/gestion/shipments/${open.id}`, { label: open.label ?? '' }))}
                    className={`${input} disabled:bg-muted/50 disabled:text-muted-foreground`} placeholder="Commande de septembre" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Boutique par défaut</label>
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
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Douane de l'arrivage
                  </label>
                  <input type="number" min="0" value={open.customsCost ?? ''} disabled={!editable}
                    placeholder="0"
                    onChange={(e) => setOpen({ ...open, customsCost: e.target.value })}
                    onBlur={() => {
                      if (!editable) return
                      const customsCost = Number(open.customsCost || 0)
                      if (!(customsCost >= 0)) { setError('Douane invalide'); return }
                      run(() => api.patch(`/gestion/shipments/${open.id}`, { customsCost }))
                    }}
                    className={`${input} disabled:bg-muted/50 disabled:text-muted-foreground`} />
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Annoncée pour tout le lot. {fcfa(groupsCustoms(open))} déjà saisis sur ses
                    groupes : c'est cette douane-là qui entre dans le coût de revient.
                  </p>
                </div>
              </div>

              {/* Produits commandés */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Produits commandés</h3>
                <div className="border border-border rounded-xl overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs text-muted-foreground">
                      <tr>
                        <th className="text-left font-medium px-4 py-2.5">Produit</th>
                        <th className="text-left font-medium px-3 py-2.5">Boutique</th>
                        <th className="text-right font-medium px-3 py-2.5">Commandé</th>
                        <th className="text-right font-medium px-3 py-2.5">Reçu</th>
                        <th className="text-right font-medium px-3 py-2.5">Reste</th>
                        <th className="text-right font-medium px-3 py-2.5">Achat/u</th>
                        <th className="px-3 py-2.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {open.items.map((i) => {
                        const received = receivedQty(open, i.id)
                        const missing = i.quantity - received
                        // Une ligne déjà dans un groupe a une boutique figée et
                        // ne se supprime plus.
                        const inGroup = remainingQty(open, i) < i.quantity
                        return (
                          <tr key={i.id}>
                            <td className="px-4 py-2.5">
                              <span className="text-foreground">{i.product.name}</span>
                              <span className="block text-xs text-muted-foreground">stock actuel : {i.product.stock}</span>
                            </td>
                            <td className="px-3 py-2.5">
                              {editable && !inGroup ? (
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
                            <td className="px-3 py-2.5 text-right tabular-nums text-success">{received}</td>
                            <td className={`px-3 py-2.5 text-right tabular-nums ${missing > 0 ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
                              {missing}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums">{fcfa(i.unitCost)}</td>
                            <td className="px-3 py-2.5 text-right">
                              {editable && !inGroup && (
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
                        <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-muted-foreground">Aucun produit</td></tr>
                      )}
                    </tbody>
                    {open.items.length > 0 && (
                      <tfoot className="bg-muted/50 text-xs text-muted-foreground">
                        <tr>
                          <td className="px-4 py-2.5 font-medium">Total</td>
                          <td />
                          <td className="px-3 py-2.5 text-right tabular-nums font-medium">{orderedTotal(open)}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums">{receivedTotal(open)}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums">{orderedTotal(open) - receivedTotal(open)}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums font-medium text-foreground">{fcfa(totalPurchase(open))}</td>
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
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Qté commandée</label>
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
                        La fiche est créée en brouillon, hors ligne : l'article entre en stock à sa
                        livraison, et n'apparaît sur la boutique qu'une fois sa fiche complétée
                        (photo, description) et activée depuis <strong>Catalogue › Produits</strong>.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Livraisons */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="text-sm font-semibold text-foreground">Groupes (livraisons)</h3>
                  {editable && open.items.length > 0 && (
                    <Link to={`/admin/gestion/groups?shipment=${open.id}`}
                      className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors">
                      <Layers className="w-3.5 h-3.5" /> Nouvelle livraison
                    </Link>
                  )}
                </div>
                {open.groups.length ? (
                  <div className="border border-border rounded-xl divide-y divide-border">
                    {open.groups.map((g) => (
                      <Link key={g.id} to={`/admin/gestion/groups?group=${g.id}`}
                        className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm hover:bg-muted/40 transition-colors">
                        <span className="font-medium text-foreground w-10">{g.code}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${GROUP_BADGE[g.status]}`}>
                          {GROUP_LABEL[g.status]}
                        </span>
                        <span className="flex-1 text-xs text-muted-foreground">
                          {g.items.reduce((sum, l) => sum + l.quantity, 0)} article(s) · transport {fcfa(g.shippingCost)}
                          {' '}· douane {fcfa(g.customsCost)}
                          {g.receivedAt ? ` · reçu le ${new Date(g.receivedAt).toLocaleDateString('fr-FR')}` : ''}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground border border-dashed border-border rounded-xl px-4 py-5 text-center">
                    Rien n'est encore arrivé.
                  </p>
                )}
              </div>

              {open.status === 'RECEIVED' && (
                <p className="text-xs text-success bg-emerald-50 rounded-lg px-4 py-3">
                  Arrivage terminé : plus aucune livraison n'est attendue.
                </p>
              )}
            </div>

            {(editable || !hasReceivedGroup(open)) && (
              <div className="flex flex-wrap gap-3 px-6 py-4 border-t border-border">
                {open.status === 'DRAFT' && (
                  <button onClick={() => run(() => api.post(`/gestion/shipments/${open.id}/cancel`, {}))} disabled={busy}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground border border-border rounded-lg hover:bg-accent transition-colors">
                    <Ban className="w-4 h-4" /> Annuler l'arrivage
                  </button>
                )}
                {open.status === 'PARTIAL' && (
                  <button
                    onClick={() => {
                      if (!confirm(`Clôturer ${open.code} ? Le reste (${orderedTotal(open) - receivedTotal(open)} article(s)) ne sera plus attendu.`)) return
                      run(() => api.post(`/gestion/shipments/${open.id}/close`, {}))
                    }}
                    disabled={busy}
                    title="Le reste de la commande ne viendra pas"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground border border-border rounded-lg hover:bg-accent transition-colors">
                    <Lock className="w-4 h-4" /> Clôturer
                  </button>
                )}
                {!hasReceivedGroup(open) && (
                  <button onClick={() => deleteShipment(open)} disabled={busy}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-destructive border border-red-100 rounded-lg hover:bg-destructive/10 transition-colors ml-auto">
                    <Trash2 className="w-4 h-4" /> Supprimer
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
