import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, LineChart, Line, XAxis } from 'recharts'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/chart'
import { ArrowRight, Clock, Store as StoreIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard, HeroCard, CardShell } from '@/components/admin/stat-card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/* ─── Types ────────────────────────────────────────────────── */
interface Order {
  id: string
  orderNumber: string
  total: number | string
  status: string
  createdAt: string
  customerName: string | null
}

interface OrdersPage {
  items: Order[]
  meta: { total: number }
}

/**
 * Chiffres du back-office, tous calculés en base. `revenue` n'est renseigné que
 * pour un super administrateur : c'est la même règle que dans la Gestion, où
 * recettes et bénéfice ne sortent pas de ce rôle.
 */
interface Stats {
  totalOrders: number
  pendingOrders: number
  monthly: { month: string; orders: number; revenue?: number }[]
  byStore: { id: string; name: string; orders: number; revenue?: number }[]
  withRevenue: boolean
}

/* ─── Constantes ────────────────────────────────────────────── */
const STATUS_BADGE: Record<string, { variant: 'success' | 'warning' | 'info' | 'purple' | 'indigo' | 'destructive' | 'secondary'; label: string }> = {
  PENDING:    { variant: 'warning',     label: 'En attente' },
  CONFIRMED:  { variant: 'info',        label: 'Confirmée' },
  PROCESSING: { variant: 'purple',      label: 'En cours' },
  SHIPPED:    { variant: 'indigo',      label: 'Expédiée' },
  DELIVERED:  { variant: 'success',     label: 'Livrée' },
  CANCELLED:  { variant: 'destructive', label: 'Annulée' },
  REFUNDED:   { variant: 'secondary',   label: 'Remboursée' },
}

/* ─── Helpers ───────────────────────────────────────────────── */
const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
const fmtShort = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' M FCFA'
  if (n >= 1_000)    return (n / 1_000).toFixed(0) + ' k FCFA'
  return n + ' FCFA'
}
const fmtDate = (d: string) =>
  new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(d))

/** « 2026-09 » → « sept. ». */
const monthLabel = (m: string) => {
  const [y, mo] = m.split('-').map(Number)
  return new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(new Date(y, mo - 1, 1))
}

/**
 * Évolution d'un mois sur l'autre, en pourcentage. `null` quand le mois
 * précédent est à zéro : une variation depuis rien ne veut rien dire, et on
 * préfère ne rien afficher qu'un « +100 % » trompeur.
 */
function growth(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

/**
 * Libellé et couleur de chaque série. `ChartContainer` s'en sert pour teinter
 * les marques et pour nommer les valeurs dans l'infobulle — plus de couleur
 * écrite en dur dans le JSX, donc un rendu juste dans les deux thèmes.
 */
/**
 * Séries des graphiques. `ChartContainer` s'en sert pour teinter les marques et
 * nommer les valeurs dans l'infobulle : plus aucune couleur écrite dans le JSX,
 * donc un rendu juste dans les deux thèmes.
 */
const ORDERS_CHART = {
  orders: { label: 'Commandes', color: 'var(--chart-3)' },
} satisfies ChartConfig

const REVENUE_CHART = {
  revenue: { label: 'Recette', color: 'var(--chart-1)' },
} satisfies ChartConfig

/* ─── Page ───────────────────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<OrdersPage>('/orders?limit=8&sortOrder=desc'),
      api.get<{ meta: { total: number } }>('/products?limit=1'),
      api.get<Stats>('/orders/stats'),
    ])
      .then(([ordersData, productsData, statsData]) => {
        setOrders(ordersData.items)
        setTotalProducts(productsData.meta.total)
        setStats(statsData)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const monthly = stats?.monthly ?? []
  const thisMonth = monthly[monthly.length - 1]
  const lastMonth = monthly[monthly.length - 2]

  const ordersTrend = thisMonth && lastMonth ? growth(thisMonth.orders, lastMonth.orders) : null
  const revenueTrend =
    stats?.withRevenue && thisMonth && lastMonth
      ? growth(thisMonth.revenue ?? 0, lastMonth.revenue ?? 0)
      : null

  /*
   * Un tableau par graphique, et non un seul partagé : sans axe Y déclaré,
   * Recharts calcule le domaine à partir de **toutes** les valeurs numériques
   * des données. Mélanger `orders` (1 à 14) et `revenue` (jusqu'à 300 000)
   * écrasait les barres de commandes au ras de l'axe.
   */
  const ordersData = monthly.map((m) => ({ label: monthLabel(m.month), orders: m.orders }))
  const revenueData = monthly.map((m) => ({ label: monthLabel(m.month), revenue: m.revenue ?? 0 }))
  const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
    .format(new Date())
  const storeMax = Math.max(1, ...(stats?.byStore.map((s) => s.orders) ?? [1]))
  const activeStores = stats?.byStore.filter((s) => s.orders > 0) ?? []

  return (
    <div className="space-y-6 p-6 lg:p-8">

      {/* ── En-tête ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bonjour {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
        </p>
      </div>

      {/* ── Rangée de tête ───────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
        {/*
          Le chiffre de tête dépend du rôle : la recette pour un super
          administrateur, le nombre de commandes pour les autres, qui n'ont pas
          accès aux montants.
        */}
        {stats?.withRevenue ? (
          <HeroCard
            className="md:col-span-12 lg:col-span-4"
            title="Recette ce mois"
            subtitle={monthName}
            value={fmtShort(thisMonth?.revenue ?? 0)}
            hint={
              lastMonth ? (
                <>
                  {revenueTrend !== null && (
                    <span className={revenueTrend >= 0 ? 'text-success' : 'text-destructive'}>
                      {revenueTrend >= 0 ? '+' : ''}{revenueTrend}%
                    </span>
                  )}{' '}
                  vs {fmtShort(lastMonth.revenue ?? 0)} le mois dernier
                </>
              ) : undefined
            }
            action={
              <Link
                to="/admin/gestion/sales"
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                Voir les ventes
              </Link>
            }
          />
        ) : (
          <HeroCard
            className="md:col-span-12 lg:col-span-4"
            title="Commandes ce mois"
            subtitle={monthName}
            value={String(thisMonth?.orders ?? 0)}
            hint={lastMonth ? `${lastMonth.orders} le mois dernier` : undefined}
            action={
              <Link to="/admin/orders" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Voir les commandes
              </Link>
            }
          />
        )}

        <div className="md:col-span-12 lg:col-span-8">
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
            <StatCard
              label="Commandes ce mois"
              value={thisMonth?.orders ?? 0}
              trend={ordersTrend}
              hint={lastMonth ? `${lastMonth.orders} le mois dernier` : undefined}
              to="/admin/orders"
            />
            <StatCard
              label="En attente"
              value={stats?.pendingOrders ?? 0}
              hint="à traiter"
              tone={(stats?.pendingOrders ?? 0) > 0 ? 'warning' : 'default'}
              to="/admin/orders"
            />
            <StatCard
              label="Produits au catalogue"
              value={totalProducts.toLocaleString('fr-FR')}
              hint={`${(stats?.totalOrders ?? 0).toLocaleString('fr-FR')} commandes au total`}
              to="/admin/products"
            />
          </div>
        </div>
      </div>

      {/* ── Graphiques ───────────────────────────────────────── */}
      <div
        className={cn(
          'space-y-4 lg:space-y-6',
          stats?.withRevenue && 'xl:grid xl:grid-cols-2 xl:gap-6 xl:space-y-0',
        )}
      >
        <CardShell
          title="Commandes par mois"
          action={
            <div className="flex items-center gap-6">
              <div className="flex items-baseline gap-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Total</span>
                <span className="text-lg leading-none tabular-nums">
                  {monthly.reduce((a, d) => a + d.orders, 0)}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Moy.</span>
                <span className="text-lg leading-none tabular-nums">
                  {Math.round(monthly.reduce((a, d) => a + d.orders, 0) / Math.max(1, monthly.length))}
                </span>
              </div>
            </div>
          }
        >
          <ChartContainer config={ORDERS_CHART} className="aspect-[21/9] w-full lg:h-[300px]">
            <BarChart data={ordersData}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator />} />
              <Bar dataKey="orders" fill="var(--color-orders)" radius={8} />
            </BarChart>
          </ChartContainer>
        </CardShell>

        {/* Les montants ne sortent pas du super administrateur. */}
        {stats?.withRevenue && (
          <CardShell
            description="Recette par mois"
            headerBelow={
              <div className="flex items-center gap-2">
                <div className="text-2xl font-semibold tabular-nums">
                  {fmtShort(monthly.reduce((a, d) => a + (d.revenue ?? 0), 0))}
                </div>
                {revenueTrend !== null && (
                  <Badge
                    variant="outline"
                    className={cn('rounded-full', revenueTrend >= 0 ? 'text-success' : 'text-destructive')}
                  >
                    {revenueTrend >= 0 ? '+' : ''}{revenueTrend}%
                  </Badge>
                )}
              </div>
            }
          >
            <ChartContainer config={REVENUE_CHART} className="aspect-[21/9] w-full lg:h-[300px]">
              <LineChart data={revenueData}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(v) => fmtShort(Number(v))} />}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </CardShell>
        )}
      </div>

      {/* ── Dernières commandes + répartition par boutique ────── */}
      <div className="grid gap-4 lg:grid-cols-12">

        <Card className="lg:col-span-7">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Dernières commandes</CardTitle>
            <Link to="/admin/orders" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-1' })}>
              Voir tout <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {orders.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                Aucune commande pour le moment
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">N°</th>
                      <th className="px-3 py-3 text-left font-medium text-muted-foreground">Client</th>
                      <th className="px-3 py-3 text-left font-medium text-muted-foreground">Montant</th>
                      <th className="px-3 py-3 text-left font-medium text-muted-foreground">Statut</th>
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.map((order) => {
                      const s = STATUS_BADGE[order.status]
                      return (
                        <tr key={order.id} className="hover:bg-muted/40 transition-colors">
                          <td className="px-6 py-3">
                            <span className="font-mono text-xs text-muted-foreground">{order.orderNumber}</span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0">
                                {(order.customerName ?? 'A')[0].toUpperCase()}
                              </div>
                              <span className="text-sm truncate max-w-[120px]">{order.customerName ?? '—'}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 font-semibold whitespace-nowrap">{fmt(Number(order.total))}</td>
                          <td className="px-3 py-3">
                            <Badge variant={s?.variant ?? 'secondary'}>{s?.label ?? order.status}</Badge>
                          </td>
                          <td className="px-6 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {fmtDate(order.createdAt)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Commandes par boutique</CardTitle>
            <CardDescription>6 derniers mois</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {activeStores.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune commande rattachée à une boutique sur la période.
              </p>
            ) : (
              activeStores.map((s) => (
                <div key={s.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <StoreIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      {s.name}
                    </span>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {s.orders} commande{s.orders > 1 ? 's' : ''}
                      {stats?.withRevenue && ` · ${fmtShort(s.revenue ?? 0)}`}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.round((s.orders / storeMax) * 100)}%` }} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
