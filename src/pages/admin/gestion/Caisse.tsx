import { useEffect, useMemo, useState } from 'react'
import { api } from '../../../lib/api'
import { fetchAllProducts } from '../../../lib/catalog'
import {
  Plus, Trash2, Loader2, Check, Receipt, Clock, X, Package, ChevronRight,
} from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/admin/empty-state'
import { useToast } from '@/components/admin/toast'
import { CardShell } from '@/components/admin/stat-card'
import { Button } from '@/components/ui/button'
import { Input, Select, Field } from '@/components/ui/input'
import { ProductPicker } from '@/components/admin/product-picker'
import { useStoreScope } from '@/lib/store-scope'
import { cn } from '@/lib/utils'

type PaymentMethod = 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CARD' | 'OTHER'

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Espèces',
  MOBILE_MONEY: 'Mobile Money',
  BANK_TRANSFER: 'Virement',
  CARD: 'Carte',
  OTHER: 'Autre',
}


interface ProductOption {
  id: string
  name: string
  price: number | string
  stock: number
  sku?: string | null
  images?: { url: string }[]
  category?: { name: string } | null
}

interface Line {
  /** Clé locale : plusieurs lignes peuvent porter le même produit. */
  key: number
  productId: string
  quantity: string
  unitPrice: string
  discountAmount: string
  discountReason: string
}

interface Sale {
  id: string
  orderNumber: string
  total: string | number
  createdAt: string
  store: { name: string } | null
  seller: { name: string } | null
  customer: { name: string } | null
}

/** Commande du site en attente de règlement : on ne paie pas sur la plateforme. */
interface UnpaidOrder extends Sale {
  customerName?: string | null
  items: { id: string; name: string; quantity: number; total: string | number }[]
}

const n = (v: string | number | null | undefined) => {
  const x = Number(v)
  return Number.isFinite(x) ? x : 0
}
const fcfa = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' F'

let nextKey = 1
const emptyLine = (): Line => ({
  key: nextKey++, productId: '', quantity: '1', unitPrice: '', discountAmount: '', discountReason: '',
})

export default function Caisse() {
  const { toast } = useToast()
  // Une vendeuse encaisse pour sa seule boutique : la règle est la même à la
  // caisse, aux dépenses du jour et au stock, donc elle vit à un seul endroit.
  const { stores, storeId, setStoreId, isSeller, storeError } = useStoreScope()
  const [products, setProducts] = useState<ProductOption[]>([])
  const [sales, setSales] = useState<Sale[]>([])

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [lines, setLines] = useState<Line[]>([emptyLine()])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  /** Ligne à remplir par le sélecteur ; `null` = on compose le ticket d'un trait. */
  const [picker, setPicker] = useState<{ lineKey: number | null } | null>(null)

  const [unpaid, setUnpaid] = useState<UnpaidOrder[]>([])
  const [cashing, setCashing] = useState<UnpaidOrder | null>(null)

  const loadSales = () => {
    api.get<Sale[]>('/gestion/sales?limit=15')
      .then(setSales)
      .catch(() => setSales([]))
    api.get<UnpaidOrder[]>('/gestion/sales/unpaid')
      .then(setUnpaid)
      .catch(() => setUnpaid([]))
  }

  useEffect(() => {
    fetchAllProducts<ProductOption>()
      .then(setProducts)
      .catch((e) => setError(e instanceof Error ? e.message : 'Catalogue indisponible'))
    loadSales()
  }, [])

  const productById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  )

  function setLine(key: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }

  /** Encaisse une commande du site : elle devient la vente, sans ressaisie. */
  async function cashIn(order: UnpaidOrder) {
    if (!storeId) { setError('Choisissez la boutique qui fournit la marchandise'); return }
    setSaving(true); setError('')
    try {
      const sale = await api.post<Sale>(`/gestion/sales/${order.id}/cash-in`, {
        storeId,
        paymentMethod,
      })
      toast(`Commande ${sale.orderNumber} encaissée — ${fcfa(n(sale.total))}`)
      setCashing(null)
      loadSales()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Encaissement impossible')
    } finally {
      setSaving(false)
    }
  }

  /** Choisir un produit préremplit son prix courant, qui reste modifiable. */
  function pickProduct(key: number, productId: string) {
    const p = productById.get(productId)
    setLine(key, { productId, unitPrice: p ? String(n(p.price)) : '' })
  }

  /** Quantité déjà au ticket, par produit : le sélecteur la rappelle sur la vignette. */
  const countById = useMemo(() => {
    const m = new Map<string, number>()
    for (const l of lines) {
      if (!l.productId) continue
      m.set(l.productId, (m.get(l.productId) ?? 0) + n(l.quantity))
    }
    return m
  }, [lines])

  /**
   * Ajout au ticket depuis le sélecteur.
   *
   * Toucher deux fois la même vignette incrémente la ligne existante plutôt que
   * d'en empiler une seconde — sauf si elle porte une remise, auquel cas la
   * séparation est voulue et le motif ne vaudrait plus pour la quantité ajoutée.
   */
  function addProduct(p: ProductOption) {
    setLines((ls) => {
      const blank = ls.find((l) => !l.productId)
      if (blank) {
        return ls.map((l) =>
          l.key === blank.key ? { ...l, productId: p.id, unitPrice: String(n(p.price)) } : l,
        )
      }
      const same = ls.find((l) => l.productId === p.id && !n(l.discountAmount))
      if (same) {
        return ls.map((l) =>
          l.key === same.key ? { ...l, quantity: String(n(l.quantity) + 1) } : l,
        )
      }
      return [...ls, { ...emptyLine(), productId: p.id, unitPrice: String(n(p.price)) }]
    })
  }

  const totals = useMemo(() => {
    let subtotal = 0
    let discount = 0
    for (const l of lines) {
      if (!l.productId) continue
      subtotal += n(l.unitPrice) * n(l.quantity)
      discount += n(l.discountAmount)
    }
    return { subtotal, discount, total: subtotal - discount }
  }, [lines])

  function reset() {
    setLines([emptyLine()])
    setCustomerName('')
    setCustomerPhone('')
    setPaymentMethod('CASH')
  }

  async function submit() {
    const filled = lines.filter((l) => l.productId)
    if (!storeId) { setError('Choisissez une boutique'); return }
    if (!filled.length) { setError('Ajoutez au moins un article'); return }
    for (const l of filled) {
      if (!Number.isInteger(n(l.quantity)) || n(l.quantity) <= 0) {
        setError('Quantité invalide'); return
      }
    }

    setSaving(true); setError('')
    try {
      const sale = await api.post<Sale>('/gestion/sales', {
        storeId,
        // Le client est facultatif : une vente anonyme reste une vente.
        customer: customerName.trim()
          ? { name: customerName.trim(), phone: customerPhone.trim() || undefined }
          : undefined,
        paymentMethod,
        items: filled.map((l) => ({
          productId: l.productId,
          quantity: n(l.quantity),
          unitPrice: n(l.unitPrice),
          discountAmount: n(l.discountAmount),
          discountReason: l.discountReason.trim() || undefined,
        })),
      })
      toast(`Vente ${sale.orderNumber} enregistrée — ${fcfa(n(sale.total))}`)
      reset()
      loadSales()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const storeName = stores.find((s) => s.id === storeId)?.name ?? '—'

  const hasContent = lines.some((l) => l.productId) || customerName || customerPhone

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Pas de largeur max : la caisse occupe le même cadre que les autres
          écrans du back-office, qui s'appuient tous sur le seul `main`. */}
      <div className="space-y-4 lg:space-y-6">
        <div className="mb-4 flex flex-col justify-between space-y-4 lg:flex-row lg:items-center lg:space-y-2">
          <div>
            <h1 className="text-2xl font-bold">Caisse</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Une vente au comptoir alimente les mêmes chiffres que les commandes du site.
            </p>
          </div>
          {/* Les deux gestes de la vente, au même endroit que dans le reste du
              back-office : abandonner à gauche, valider à droite. */}
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={reset} disabled={saving || !hasContent}>
              Vider
            </Button>
            <Button size="sm" onClick={submit} disabled={saving || totals.total < 0}>
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}
              Encaisser {totals.total > 0 && fcfa(totals.total)}
            </Button>
          </div>
        </div>

        {(storeError || error) && <ErrorState message={storeError || error} />}

        <div className="grid gap-4 lg:grid-cols-6">
          <div className="space-y-4 lg:col-span-4">
            {/* Le contexte de la vente : où, comment, pour qui. */}
            <CardShell title="La vente">
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <Field
                    label="Boutique *"
                    htmlFor="caisse-store"
                    description={isSeller ? 'Votre boutique de rattachement.' : undefined}
                  >
                    <Select
                      id="caisse-store"
                      value={storeId}
                      disabled={isSeller}
                      onChange={(e) => setStoreId(e.target.value)}
                    >
                      {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                  </Field>
                  <Field label="Paiement" htmlFor="caisse-payment">
                    <Select
                      id="caisse-payment"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    >
                      {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((m) => (
                        <option key={m} value={m}>{PAYMENT_LABEL[m]}</option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <Field label="Client" htmlFor="caisse-customer">
                    <Input
                      id="caisse-customer"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Facultatif"
                    />
                  </Field>
                  <Field
                    label="Téléphone"
                    htmlFor="caisse-phone"
                    description="Le même numéro retrouve la fiche du client."
                  >
                    <Input
                      id="caisse-phone"
                      type="tel"
                      inputMode="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            </CardShell>

            {/*
              Un bloc par article plutôt qu'une grille de 12 colonnes : au
              comptoir l'écran est un téléphone, et une ligne de six champs
              devient illisible sous 600 px.
            */}
            <CardShell
              title="Articles"
              action={
                <Button variant="outline" size="sm" onClick={() => setPicker({ lineKey: null })}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter
                </Button>
              }
            >
              <div className="space-y-3">
            {lines.map((l, index) => {
              const p = productById.get(l.productId)
              const lineTotal = n(l.unitPrice) * n(l.quantity) - n(l.discountAmount)
              const short = p && p.stock <= n(l.quantity) && n(l.quantity) > 0

              return (
                <div key={l.key} className="space-y-4 rounded-lg border border-border p-3">
                    <Field label={`Article ${index + 1}`} htmlFor={`line-${l.key}-product`}>
                      <div className="flex items-center gap-2">
                        {/* La vignette remplace la liste déroulante : au comptoir
                            on reconnaît l'article à sa photo, pas à son nom. */}
                        <button
                          type="button"
                          id={`line-${l.key}-product`}
                          onClick={() => setPicker({ lineKey: l.key })}
                          className={cn(
                            'flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2 text-left transition',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            p
                              ? 'border border-border bg-background hover:border-foreground/30'
                              : 'border border-dashed border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                          )}
                        >
                          <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                            {p?.images?.[0] ? (
                              <img src={p.images[0].url} alt="" className="size-full object-cover" />
                            ) : (
                              <Package className="size-4 text-muted-foreground/40" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {p ? p.name : 'Choisir un article'}
                            </span>
                            <span
                              className={cn(
                                'block truncate text-xs',
                                short ? 'text-warning' : 'text-muted-foreground',
                              )}
                            >
                              {p
                                ? `${fcfa(n(p.price))} · stock ${p.stock}${short ? ' — au plus juste' : ''}`
                                : 'Photo, prix et stock sous les yeux'}
                            </span>
                          </span>
                          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                        </button>
                        {/* Centrée sur la vignette : un décalage fixe la laissait
                            flotter au-dessus dès que la hauteur du bloc changeait. */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          aria-label={`Retirer l'article ${index + 1}`}
                          disabled={lines.length === 1}
                          onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((x) => x.key !== l.key) : ls))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Field>

                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Qté" htmlFor={`line-${l.key}-qty`}>
                        <Input
                          id={`line-${l.key}-qty`}
                          type="number"
                          inputMode="numeric"
                          min="1"
                          value={l.quantity}
                          onChange={(e) => setLine(l.key, { quantity: e.target.value })}
                        />
                      </Field>
                      <Field label="Prix/u" htmlFor={`line-${l.key}-price`}>
                        <Input
                          id={`line-${l.key}-price`}
                          type="number"
                          inputMode="numeric"
                          min="0"
                          value={l.unitPrice}
                          onChange={(e) => setLine(l.key, { unitPrice: e.target.value })}
                        />
                      </Field>
                      <Field label="Remise" htmlFor={`line-${l.key}-discount`}>
                        <Input
                          id={`line-${l.key}-discount`}
                          type="number"
                          inputMode="numeric"
                          min="0"
                          value={l.discountAmount}
                          onChange={(e) => setLine(l.key, { discountAmount: e.target.value })}
                        />
                      </Field>
                    </div>

                    {/* Le motif n'apparaît qu'avec une remise : un champ grisé
                        occupe une place qu'un téléphone n'a pas. */}
                    {n(l.discountAmount) > 0 && (
                      <Field label="Motif de la remise" htmlFor={`line-${l.key}-reason`}>
                        <Input
                          id={`line-${l.key}-reason`}
                          value={l.discountReason}
                          onChange={(e) => setLine(l.key, { discountReason: e.target.value })}
                          placeholder="Client fidèle"
                        />
                      </Field>
                    )}

                    {l.productId && (
                      <p className="border-t border-border pt-2 text-right text-sm">
                        <span className="text-muted-foreground">Total de la ligne </span>
                        <span className="font-semibold tabular-nums">{fcfa(lineTotal)}</span>
                      </p>
                    )}
                </div>
              )
            })}
              </div>
            </CardShell>
          </div>

          {/* Récapitulatif */}
          <div className="space-y-4 lg:col-span-2">
            {/* Reste sous les yeux pendant qu'on fait défiler les articles. */}
            <CardShell title="Total" className="lg:sticky lg:top-6">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Sous-total</dt>
                  <dd className="tabular-nums">{fcfa(totals.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Remises</dt>
                  <dd className="tabular-nums text-warning">− {fcfa(totals.discount)}</dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-border pt-3">
                  <dt className="font-medium">À payer</dt>
                  <dd className="text-2xl font-bold tabular-nums">{fcfa(totals.total)}</dd>
                </div>
              </dl>
              <Button
                className="mt-4 w-full"
                onClick={submit}
                disabled={saving || totals.total < 0}
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Encaisser
              </Button>
            </CardShell>

          {unpaid.length > 0 && (
            <CardShell
              title={
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-warning" /> À encaisser
                </span>
              }
              action={
                <span className="text-xs text-muted-foreground">
                  {unpaid.length} commande{unpaid.length > 1 ? 's' : ''}
                </span>
              }
              className="ring-warning/30"
            >
              <div className="-m-(--card-spacing) max-h-72 divide-y divide-border overflow-y-auto">
                {unpaid.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setCashing(o)}
                    className="w-full px-4 py-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm">
                        {o.customer?.name ?? o.customerName ?? 'Client de passage'}
                      </span>
                      <span className="text-sm font-medium tabular-nums">{fcfa(n(o.total))}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {o.orderNumber} · {o.items.length} article{o.items.length > 1 ? 's' : ''} ·{' '}
                      {new Date(o.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </p>
                  </button>
                ))}
              </div>
            </CardShell>
          )}

          <CardShell
            title={
              <span className="flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5 text-muted-foreground" /> Dernières ventes
              </span>
            }
          >
            {!sales.length ? (
              <EmptyState
                icon={Receipt}
                title="Aucune vente enregistrée"
                description="Les ventes encaissées ici apparaîtront dans cette liste."
                className="py-8"
              />
            ) : (
              <div className="-m-(--card-spacing) max-h-96 divide-y divide-border overflow-y-auto">
                {sales.map((s) => (
                  <div key={s.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm">{s.customer?.name ?? 'Client de passage'}</span>
                      <span className="text-sm font-medium tabular-nums">{fcfa(n(s.total))}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {s.store?.name ?? '—'} · {s.seller?.name ?? '—'} ·{' '}
                      {new Date(s.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardShell>
        </div>
      </div>
      </div>

      {picker && (
        <ProductPicker
          products={products}
          counts={countById}
          multiple={picker.lineKey === null}
          title={picker.lineKey === null ? 'Ajouter des articles' : 'Choisir un article'}
          onClose={() => setPicker(null)}
          onPick={(prod) => {
            if (picker.lineKey === null) {
              addProduct(prod as ProductOption)
            } else {
              pickProduct(picker.lineKey, prod.id)
              setPicker(null)
            }
          }}
        />
      )}

      {cashing && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={() => !saving && setCashing(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-border bg-card p-6 shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold">Encaisser {cashing.orderNumber}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {cashing.customer?.name ?? cashing.customerName ?? 'Client de passage'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Fermer"
                onClick={() => setCashing(null)}
                disabled={saving}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="divide-y divide-border rounded-xl border border-border">
              {cashing.items.map((i) => (
                <div key={i.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="truncate text-muted-foreground">{i.quantity} × {i.name}</span>
                  <span className="tabular-nums">{fcfa(n(i.total))}</span>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{fcfa(n(cashing.total))}</span>
              </div>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              La marchandise sortira du stock de <strong className="text-foreground">{storeName}</strong>,
              en <strong className="text-foreground">{PAYMENT_LABEL[paymentMethod]}</strong>. Changez la
              boutique ou le paiement dans le formulaire si besoin.
            </p>

            {error && <ErrorState message={error} className="mt-4 mb-0" />}

            <div className="mt-5 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setCashing(null)} disabled={saving}>
                Annuler
              </Button>
              <Button className="flex-1" onClick={() => cashIn(cashing)} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Encaisser
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
