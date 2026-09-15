import { useEffect, useMemo, useState } from 'react'
import { Plus, Loader2, Trash2, Wallet } from 'lucide-react'
import { api } from '../../../lib/api'
import { useStoreScope } from '@/lib/store-scope'
import { PageHeader } from '@/components/admin/page-header'
import { CardShell } from '@/components/admin/stat-card'
import { EmptyState, ErrorState } from '@/components/admin/empty-state'
import { useConfirm } from '@/components/admin/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input, Select, Field } from '@/components/ui/input'

/** Une sortie de caisse de la journée : taxi, sachets, monnaie d'appoint. */
interface Expense {
  id: string
  date: string
  label: string
  amount: string | number
  store: { id: string; name: string } | null
}

const n = (v: string | number | null | undefined) => {
  const x = Number(v)
  return Number.isFinite(x) ? x : 0
}
const fcfa = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' F'

/**
 * Jour courant `YYYY-MM-DD` en heure locale. `toISOString()` bascule la veille
 * passé minuit UTC, ce qui daterait d'hier la dépense d'une fin de journée.
 */
const todayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const longDate = () =>
  new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

/**
 * Les sorties de caisse de la journée, saisies là où elles se font.
 *
 * Le comptoir ne monte pas au bureau pour noter un taxi : la vendeuse y accède
 * comme l'administration, le serveur la bornant à sa boutique et au jour même.
 * Le mois entier, lui, se corrige dans « Dépenses » (Gestion), réservé au
 * bureau.
 */
export default function DailyExpenses() {
  const { stores, storeId, setStoreId, isSeller, storeError } = useStoreScope()
  const [confirm, confirmDialog] = useConfirm()

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = (store: string) => {
    const day = todayKey()
    api.get<Expense[]>(`/gestion/finance/expenses?from=${day}&to=${day}&storeId=${store}`)
      .then(setExpenses)
      .catch(() => setExpenses([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!storeId) return
    load(storeId)
  }, [storeId])

  const total = useMemo(
    () => expenses.reduce((sum, e) => sum + n(e.amount), 0),
    [expenses],
  )

  async function add() {
    if (label.trim().length < 2) { setError('Indiquez ce qui a été payé'); return }
    if (n(amount) <= 0) { setError('Montant invalide'); return }
    setSaving(true); setError('')
    try {
      await api.post('/gestion/finance/expenses', {
        date: todayKey(),
        label: label.trim(),
        amount: n(amount),
        storeId: storeId || null,
      })
      setLabel(''); setAmount('')
      load(storeId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible')
    } finally {
      setSaving(false)
    }
  }

  async function remove(e: Expense) {
    const ok = await confirm({
      title: `Supprimer « ${e.label} » ?`,
      description: `Cette sortie de ${fcfa(n(e.amount))} ne comptera plus dans les dépenses du jour.`,
      confirmLabel: 'Supprimer',
      tone: 'danger',
    })
    if (!ok) return
    try {
      await api.delete(`/gestion/finance/expenses/${e.id}`)
      load(storeId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression impossible')
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Dépenses du jour"
        description={`Ce qui sort de la caisse aujourd'hui, ${longDate()}. Les charges du mois se saisissent dans le bilan.`}
        actions={
          // Une vendeuse n'a qu'une boutique : le sélecteur ne lui sert à rien.
          stores.length > 1 && !isSeller ? (
            <Select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              aria-label="Boutique"
              className="w-auto"
            >
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          ) : undefined
        }
      />

      {(storeError || error) && <ErrorState message={storeError || error} />}

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="space-y-4 lg:col-span-2">
          <CardShell title="Noter une dépense">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
              <Field label="Dépense" htmlFor="expense-label">
                <Input
                  id="expense-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') add() }}
                  placeholder="Taxi, sachets, eau…"
                />
              </Field>
              <Field label="Montant" htmlFor="expense-amount">
                <Input
                  id="expense-amount"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') add() }}
                  className="sm:w-32"
                />
              </Field>
              {/* `size="sm"` : 32 px, la hauteur des champs de la rangée. */}
              <Button size="sm" onClick={add} disabled={saving || !storeId}>
                {saving
                  ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  : <Plus className="mr-1.5 h-3.5 w-3.5" />}
                Ajouter
              </Button>
            </div>
          </CardShell>

          <CardShell
            title="Aujourd'hui"
            action={
              <span className="text-xs text-muted-foreground">
                {expenses.length} ligne{expenses.length > 1 ? 's' : ''}
              </span>
            }
            contentClassName="p-0"
          >
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !expenses.length ? (
              <EmptyState
                icon={Wallet}
                title="Aucune dépense aujourd'hui"
                description="Notez ici ce qui sort de la caisse dans la journée."
                className="py-8"
              />
            ) : (
              <div className="divide-y divide-border">
                {expenses.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="min-w-0 flex-1 truncate text-sm">{e.label}</span>
                    <span className="text-sm font-medium tabular-nums">{fcfa(n(e.amount))}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={`Supprimer la dépense ${e.label}`}
                      onClick={() => remove(e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardShell>
        </div>

        {/* Le cumul reste sous les yeux pendant qu'on fait défiler les lignes. */}
        <CardShell title="Total du jour" className="h-fit lg:sticky lg:top-6">
          <p className="text-3xl font-semibold tabular-nums tracking-tight">{fcfa(total)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stores.find((s) => s.id === storeId)?.name ?? '—'}
          </p>
        </CardShell>
      </div>

      {confirmDialog}
    </div>
  )
}
