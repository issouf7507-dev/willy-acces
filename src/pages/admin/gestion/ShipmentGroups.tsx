import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../../../lib/api'
import {
  Plus, Trash2, Loader2, Layers, PackageCheck, ChevronRight, AlertTriangle, Save,
} from 'lucide-react'
import {
  type Shipment, type ShipmentItem, type GroupStatus, GROUP_BADGE, GROUP_LABEL,
  input, n, fcfa, isOpen, remainingQty,
} from './shipment-utils'

interface GroupLine {
  id: string
  shipmentItemId: string
  quantity: number
  unitShipping: string | number | null
  unitCustoms: string | number | null
  landedCost: string | number | null
  shipmentItem: {
    id: string
    quantity: number
    unitCost: string | number
    product: { id: string; name: string; sku: string | null; stock: number }
    store: { id: string; name: string }
  }
}

interface Group {
  id: string
  code: string
  label: string | null
  status: GroupStatus
  shippingCost: string | number
  customsCost: string | number
  receivedAt: string | null
  createdAt: string
  shipmentId: string
  shipment: { id: string; code: string; label: string | null }
  items: GroupLine[]
}

/**
 * Livraison en cours de saisie : nouvelle (`groupId` absent) ou brouillon
 * existant. Le groupe ne porte jamais que sur `shipmentId` : un arrivage
 * compte plusieurs groupes, un groupe un seul arrivage.
 *
 * `qty` ne contient que les lignes **choisies** pour ce groupe : une clé
 * présente vaut produit coché, son absence produit hors du groupe.
 */
interface Draft {
  groupId?: string
  shipmentId: string
  label: string
  shippingCost: string
  /** Douane payée sur cette livraison, pas celle annoncée pour tout le lot. */
  customsCost: string
  qty: Record<string, string>
}

const groupQty = (g: Group) => g.items.reduce((sum, l) => sum + l.quantity, 0)

export default function ShipmentGroups() {
  const [groups, setGroups] = useState<Group[]>([])
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [viewing, setViewing] = useState<Group | null>(null)
  const [params, setParams] = useSearchParams()

  const load = () =>
    Promise.all([
      api.get<Group[]>('/gestion/shipment-groups'),
      api.get<Shipment[]>('/gestion/shipments'),
    ])
      .then(([g, s]) => {
        setGroups(g)
        setShipments(s)
        return { groups: g, shipments: s }
      })
      .catch((e) => { setError(e.message); return null })
      .finally(() => setLoading(false))

  // Ouverture directe depuis la page Arrivages : ?shipment=… pour une
  // nouvelle livraison, ?group=… pour un groupe existant.
  useEffect(() => {
    load().then((data) => {
      if (!data) return
      const shipmentId = params.get('shipment')
      const groupId = params.get('group')
      if (shipmentId) {
        const s = data.shipments.find((x) => x.id === shipmentId)
        if (s && isOpen(s)) startNew(s)
      } else if (groupId) {
        const g = data.groups.find((x) => x.id === groupId)
        if (g) openGroup(g)
      }
      if (shipmentId || groupId) setParams({}, { replace: true })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openShipments = shipments.filter(
    (s) => isOpen(s) && s.items.some((i) => remainingQty(s, i) > 0),
  )
  const draftShipment = draft ? shipments.find((s) => s.id === draft.shipmentId) ?? null : null

  /**
   * Nouvelle livraison : aucun produit coché. C'est le client qui désigne, dans
   * les seuls produits de l'arrivage choisi, ceux qui sont arrivés.
   */
  function startNew(s: Shipment | null) {
    setError('')
    setViewing(null)
    setDraft({ shipmentId: s?.id ?? '', label: '', shippingCost: '', customsCost: '', qty: {} })
  }

  /**
   * Coche ou décoche un produit de l'arrivage. Cochée, la ligne arrive avec
   * tout son reste à recevoir — quantité ensuite ajustable ; décochée, elle
   * sort du groupe.
   */
  function toggleLine(item: ShipmentItem, remaining: number) {
    if (!draft) return
    const qty = { ...draft.qty }
    if (item.id in qty) delete qty[item.id]
    else qty[item.id] = String(remaining)
    setDraft({ ...draft, qty })
  }

  /** Coche tout ce qui reste à recevoir sur l'arrivage, ou vide la sélection. */
  function toggleAll(s: Shipment, all: boolean) {
    if (!draft) return
    setDraft({
      ...draft,
      qty: all
        ? Object.fromEntries(
            s.items
              .map((i) => [i.id, remainingQty(s, i, draft.groupId)] as const)
              .filter(([, remaining]) => remaining > 0)
              .map(([id, remaining]) => [id, String(remaining)]),
          )
        : {},
    })
  }

  function openGroup(g: Group) {
    setError('')
    if (g.status === 'RECEIVED') {
      setDraft(null)
      setViewing(g)
      return
    }
    setViewing(null)
    setDraft({
      groupId: g.id,
      shipmentId: g.shipmentId,
      label: g.label ?? '',
      shippingCost: String(n(g.shippingCost)),
      customsCost: String(n(g.customsCost)),
      qty: Object.fromEntries(g.items.map((l) => [l.shipmentItemId, String(l.quantity)])),
    })
  }

  function close() {
    setDraft(null)
    setViewing(null)
    setError('')
  }

  async function run(fn: () => Promise<unknown>) {
    setBusy(true); setError('')
    try {
      await fn()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  /** Enregistre la livraison saisie ; renvoie son id. */
  async function save(d: Draft): Promise<string> {
    const items = Object.entries(d.qty).map(([shipmentItemId, q]) => ({
      shipmentItemId,
      quantity: Number(q || 0),
    }))
    if (!items.length) throw new Error('Choisissez au moins un produit de l’arrivage')
    if (items.some((l) => !Number.isInteger(l.quantity) || l.quantity <= 0)) {
      throw new Error('Indiquez une quantité reçue pour chaque produit coché')
    }
    const shippingCost = Number(d.shippingCost || 0)
    if (!(shippingCost >= 0)) throw new Error('Coût de transport invalide')
    const customsCost = Number(d.customsCost || 0)
    if (!(customsCost >= 0)) throw new Error('Douane invalide')

    const body = { label: d.label, shippingCost, customsCost, items }
    if (d.groupId) {
      await api.patch(`/gestion/shipment-groups/${d.groupId}`, body)
      return d.groupId
    }
    const created = await api.post<Group>('/gestion/shipment-groups', { ...body, shipmentId: d.shipmentId })
    return created.id
  }

  function saveDraft(d: Draft) {
    run(async () => { await save(d); close() })
  }

  function saveAndReceive(d: Draft) {
    if (!confirm('Réceptionner cette livraison ? Le stock sera crédité et les coûts figés : l’opération est définitive.')) return
    run(async () => {
      const id = await save(d)
      await api.post(`/gestion/shipment-groups/${id}/receive`, {})
      close()
    })
  }

  function removeGroup(g: { id: string; code: string }) {
    if (!confirm(`Supprimer le groupe ${g.code} ?`)) return
    run(async () => { await api.delete(`/gestion/shipment-groups/${g.id}`); close() })
  }

  // Produits de l'arrivage encore livrables, et état de la sélection.
  const pickable = draftShipment
    ? draftShipment.items.filter((i) => remainingQty(draftShipment, i, draft?.groupId) > 0)
    : []
  const pickedCount = draft ? Object.keys(draft.qty).length : 0
  const allPicked = pickable.length > 0 && pickable.every((i) => !!draft && i.id in draft.qty)

  // Aperçu du coût : transport et douane de la livraison répartis à l'unité
  // sur ses seuls articles, comme le fera la réception.
  const draftTotal = draft
    ? Object.values(draft.qty).reduce((sum, q) => sum + (Number(q) > 0 ? Number(q) : 0), 0)
    : 0
  const draftUnitShipping = draftTotal > 0 ? Number(draft?.shippingCost || 0) / draftTotal : 0
  const draftUnitCustoms = draftTotal > 0 ? Number(draft?.customsCost || 0) / draftTotal : 0
  const draftUnitExtra = draftUnitShipping + draftUnitCustoms

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Groupes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Chaque livraison d'un <Link to="/admin/gestion/shipments" className="underline hover:text-foreground">arrivage</Link>{' '}
            forme un groupe, avec son transport et sa douane. Le stock est crédité à sa réception.
            Un arrivage peut compter plusieurs groupes, mais un groupe ne concerne qu'un seul arrivage.
          </p>
        </div>
        <button onClick={() => startNew(openShipments.length === 1 ? openShipments[0] : null)}
          disabled={busy || !openShipments.length}
          title={openShipments.length ? undefined : 'Aucun arrivage n’attend de livraison'}
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
          <Plus className="w-4 h-4" /> Nouvelle livraison
        </button>
      </div>

      {error && !draft && !viewing && (
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
        ) : !groups.length ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
            <Layers className="w-8 h-8" />
            <p className="text-sm">Aucun groupe</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {groups.map((g) => (
              <div key={g.id} className="flex items-center hover:bg-muted/40 transition-colors">
                <button onClick={() => openGroup(g)}
                  className="flex-1 min-w-0 flex items-center gap-4 pl-6 pr-3 py-4 text-left">
                  <div className="shrink-0 w-11 h-11 rounded-lg bg-muted flex items-center justify-center">
                    <Layers className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{g.code}</span>
                      <span className="text-sm text-muted-foreground">
                        arrivage {g.shipment.code}{g.shipment.label ? ` · ${g.shipment.label}` : ''}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${GROUP_BADGE[g.status]}`}>
                        {GROUP_LABEL[g.status]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {groupQty(g)} article(s) · transport {fcfa(g.shippingCost)} · douane {fcfa(g.customsCost)}
                      {g.receivedAt ? ` · reçu le ${new Date(g.receivedAt).toLocaleDateString('fr-FR')}` : ''}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                </button>
                <div className="w-12 pr-4 flex justify-end">
                  {g.status === 'DRAFT' && (
                    <button onClick={() => removeGroup(g)} disabled={busy}
                      title={`Supprimer le groupe ${g.code}`} aria-label={`Supprimer le groupe ${g.code}`}
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

      {/* Saisie d'une livraison */}
      {draft && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-4xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">
                {draft.groupId
                  ? `Groupe ${groups.find((g) => g.id === draft.groupId)?.code ?? ''}`
                  : 'Nouvelle livraison'}
              </h2>
              <button onClick={close} className="text-sm text-muted-foreground hover:text-foreground">Fermer</button>
            </div>

            <div className="p-6 space-y-5">
              {error && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-red-50 text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Arrivage</label>
                  <select value={draft.shipmentId} disabled={!!draft.groupId}
                    onChange={(e) => {
                      const s = shipments.find((x) => x.id === e.target.value) ?? null
                      startNew(s)
                    }}
                    className={`${input} bg-card disabled:bg-muted/50 disabled:text-muted-foreground`}>
                    <option value="">Choisir…</option>
                    {(draft.groupId && draftShipment ? [draftShipment] : openShipments).map((s) => (
                      <option key={s.id} value={s.id}>{s.code}{s.label ? ` — ${s.label}` : ''}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    {draft.groupId
                      ? 'L’arrivage d’un groupe ne change plus après sa création.'
                      : 'Un seul arrivage par groupe : changer d’arrivage vide la sélection.'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Transport de la livraison</label>
                  <input type="number" min="0" value={draft.shippingCost} placeholder="0"
                    onChange={(e) => setDraft({ ...draft, shippingCost: e.target.value })} className={input} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Douane de la livraison</label>
                  <input type="number" min="0" value={draft.customsCost} placeholder="0"
                    onChange={(e) => setDraft({ ...draft, customsCost: e.target.value })} className={input} />
                  {draftShipment && (
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      Ce qui a été payé au dédouanement de <strong>ce</strong> groupe.
                      {n(draftShipment.customsCost) > 0
                        ? ` Arrivage ${draftShipment.code} : ${fcfa(draftShipment.customsCost)} annoncés pour le lot entier.`
                        : ''}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Libellé</label>
                  <input value={draft.label} placeholder="1er envoi"
                    onChange={(e) => setDraft({ ...draft, label: e.target.value })} className={input} />
                </div>
              </div>

              {draftShipment && (
                <div className="border border-border rounded-xl overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs text-muted-foreground">
                      <tr>
                        <th className="w-10 px-4 py-2.5">
                          <input type="checkbox" checked={allPicked} disabled={!pickable.length}
                            onChange={(e) => toggleAll(draftShipment, e.target.checked)}
                            title="Tout sélectionner" aria-label="Sélectionner tous les produits livrables"
                            className="w-4 h-4 rounded border-border accent-primary align-middle disabled:opacity-40" />
                        </th>
                        <th className="text-left font-medium px-2 py-2.5">Produit</th>
                        <th className="text-left font-medium px-3 py-2.5">Boutique</th>
                        <th className="text-right font-medium px-3 py-2.5">Commandé</th>
                        <th className="text-right font-medium px-3 py-2.5">Reste</th>
                        <th className="text-right font-medium px-3 py-2.5">Reçu ici</th>
                        <th className="text-right font-medium px-3 py-2.5">Achat/u</th>
                        <th className="text-right font-medium px-3 py-2.5">Transport/u</th>
                        <th className="text-right font-medium px-3 py-2.5">Douane/u</th>
                        <th className="text-right font-medium px-3 py-2.5">Revient/u</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {draftShipment.items.map((i) => {
                        const remaining = remainingQty(draftShipment, i, draft.groupId)
                        const picked = i.id in draft.qty
                        const q = Number(draft.qty[i.id] || 0)
                        const over = q > remaining
                        return (
                          <tr key={i.id}
                            className={`${picked ? 'bg-primary/5' : ''} ${remaining === 0 && !picked ? 'opacity-50' : ''}`}>
                            <td className="px-4 py-2.5">
                              <input type="checkbox" checked={picked} disabled={remaining === 0 && !picked}
                                onChange={() => toggleLine(i, remaining)}
                                aria-label={`Inclure ${i.product.name} dans ce groupe`}
                                className="w-4 h-4 rounded border-border accent-primary align-middle disabled:opacity-40" />
                            </td>
                            <td className="px-2 py-2.5 text-foreground">{i.product.name}</td>
                            <td className="px-3 py-2.5 text-muted-foreground">{i.store?.name}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums">{i.quantity}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums">{remaining}</td>
                            <td className="px-3 py-2.5 text-right">
                              <input type="number" min="1" max={remaining} value={draft.qty[i.id] ?? ''}
                                disabled={!picked} placeholder="—"
                                onChange={(e) => setDraft({ ...draft, qty: { ...draft.qty, [i.id]: e.target.value } })}
                                aria-label={`Quantité reçue de ${i.product.name}`}
                                className={`w-20 px-2 py-1 rounded-md border text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted/50 ${over ? 'border-destructive text-destructive' : 'border-border'}`} />
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums">{fcfa(i.unitCost)}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground italic">
                              {q > 0 ? fcfa(draftUnitShipping) : '—'}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground italic">
                              {q > 0 ? fcfa(draftUnitCustoms) : '—'}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums font-medium">
                              {q > 0 ? fcfa(n(i.unitCost) + draftUnitExtra) : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {draftShipment && (
                <p className="text-xs text-muted-foreground">
                  {pickedCount === 0
                    ? 'Cochez les produits de cet arrivage qui sont arrivés dans ce groupe.'
                    : `${pickedCount} produit(s) choisi(s) sur les ${draftShipment.items.length} de l’arrivage ${draftShipment.code}, ${draftTotal} article(s) au total.`}
                  {draftTotal > 0 && (
                    <>
                      {' '}{fcfa(draft.shippingCost)} de transport et {fcfa(draft.customsCost)} de douane
                      répartis sur ces {draftTotal} article(s), soit{' '}
                      <strong>{fcfa(draftUnitExtra)}</strong> par unité ajoutés au prix d'achat
                      ({fcfa(draftUnitShipping)} + {fcfa(draftUnitCustoms)}).
                    </>
                  )}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => saveAndReceive(draft)} disabled={busy || !draftShipment || pickedCount === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />}
                Réceptionner
              </button>
              <button onClick={() => saveDraft(draft)} disabled={busy || !draftShipment || pickedCount === 0}
                title="Garder la livraison en brouillon, sans toucher au stock"
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground border border-border rounded-lg hover:bg-accent disabled:opacity-50 transition-colors">
                <Save className="w-4 h-4" /> Enregistrer en brouillon
              </button>
              {draft.groupId && (
                <button onClick={() => removeGroup({ id: draft.groupId!, code: groups.find((g) => g.id === draft.groupId)?.code ?? '' })}
                  disabled={busy}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-destructive border border-red-100 rounded-lg hover:bg-destructive/10 transition-colors ml-auto">
                  <Trash2 className="w-4 h-4" /> Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Livraison réceptionnée : lecture seule */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-3xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-foreground">Groupe {viewing.code}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${GROUP_BADGE[viewing.status]}`}>
                  {GROUP_LABEL[viewing.status]}
                </span>
              </div>
              <button onClick={close} className="text-sm text-muted-foreground hover:text-foreground">Fermer</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Arrivage <strong className="text-foreground">{viewing.shipment.code}</strong>
                {viewing.label ? ` · ${viewing.label}` : ''} · transport {fcfa(viewing.shippingCost)}
                {' '}· douane {fcfa(viewing.customsCost)}
                {viewing.receivedAt ? ` · reçu le ${new Date(viewing.receivedAt).toLocaleDateString('fr-FR')}` : ''}
              </p>
              <div className="border border-border rounded-xl overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs text-muted-foreground">
                    <tr>
                      <th className="text-left font-medium px-4 py-2.5">Produit</th>
                      <th className="text-left font-medium px-3 py-2.5">Boutique</th>
                      <th className="text-right font-medium px-3 py-2.5">Qté</th>
                      <th className="text-right font-medium px-3 py-2.5">Achat/u</th>
                      <th className="text-right font-medium px-3 py-2.5">Transport/u</th>
                      <th className="text-right font-medium px-3 py-2.5">Douane/u</th>
                      <th className="text-right font-medium px-3 py-2.5">Revient/u</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {viewing.items.map((l) => (
                      <tr key={l.id}>
                        <td className="px-4 py-2.5 text-foreground">{l.shipmentItem.product.name}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{l.shipmentItem.store?.name}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{l.quantity}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{fcfa(l.shipmentItem.unitCost)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{fcfa(l.unitShipping)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{fcfa(l.unitCustoms)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-medium text-foreground">{fcfa(l.landedCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-success bg-emerald-50 rounded-lg px-4 py-3">
                Réceptionné : le stock a été crédité et le coût de revient moyen des produits recalculé.
                Pour corriger, passez par un mouvement de stock d'ajustement.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
