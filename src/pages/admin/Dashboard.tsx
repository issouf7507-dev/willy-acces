import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, LineChart, Line, XAxis, ResponsiveContainer,
  Tooltip, CartesianGrid,
} from 'recharts'
import {
  TrendingUp, TrendingDown, ShoppingBag, Package,
  Clock, ArrowRight, Download, Users,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
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

interface StatsData {
  items: Order[]
  meta: { total: number }
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

const MONTHLY_DATA = [
  { mois: 'Jan', commandes: 18, ca: 2100000 },
  { mois: 'Fév', commandes: 24, ca: 3200000 },
  { mois: 'Mar', commandes: 31, ca: 4100000 },
  { mois: 'Avr', commandes: 22, ca: 2800000 },
  { mois: 'Mai', commandes: 28, ca: 3600000 },
  { mois: 'Jun', commandes: 35, ca: 4800000 },
]

const LOCATION_DATA = [
  { pays: 'Abidjan',    pct: 72, trend: '+8.2%', up: true },
  { pays: 'Bouaké',     pct: 55, trend: '+4.1%', up: true },
  { pays: 'Yamoussoukro', pct: 38, trend: '-1.3%', up: false },
  { pays: 'San Pedro',  pct: 29, trend: '+2.7%', up: true },
  { pays: 'Korhogo',    pct: 18, trend: '+0.9%', up: true },
]

/* ─── Helpers ───────────────────────────────────────────────── */
const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
const fmtShort = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' M FCFA'
  if (n >= 1_000)    return (n / 1_000).toFixed(0) + ' k FCFA'
  return n + ' FCFA'
}
const fmtDate = (d: string) =>
  new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(d))

/* ─── Sub-components ────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, trend, trendUp, sub, iconBg }: {
  icon: React.ElementType
  label: string
  value: string | number
  trend?: string
  trendUp?: boolean
  sub?: string
  iconBg: string
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <span className={cn('flex items-center gap-0.5 text-xs font-semibold', trendUp ? 'text-emerald-600' : 'text-red-500')}>
              {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend}
            </span>
          )}
        </div>
        <div className="mt-4">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-0.5">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth()
  const [orders, setOrders]           = useState<Order[]>([])
  const [totalOrders, setTotalOrders] = useState(0)
  const [totalProducts, setTotalProducts] = useState(0)
  const [revenue, setRevenue]         = useState(0)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<StatsData>('/orders?limit=8&sortOrder=desc'),
      api.get<{ meta: { total: number } }>('/products?limit=1'),
    ])
      .then(([ordersData, productsData]) => {
        setOrders(ordersData.items)
        setTotalOrders(ordersData.meta.total)
        setTotalProducts(productsData.meta.total)
        setRevenue(ordersData.items.reduce((acc, o) => acc + Number(o.total), 0))
      })
      .finally(() => setLoading(false))
  }, [])

  const pendingCount = orders.filter(o => o.status === 'PENDING').length

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">

      {/* ── En-tête ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exporter</span>
        </Button>
      </div>

      {/* ── Hero + 3 mini KPI ────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-12">

        {/* Hero card */}
        <Card className="lg:col-span-4 bg-muted border-0 relative overflow-hidden">
          <CardContent className="p-6">
            <p className="text-xl font-bold">Félicitations {user?.name?.split(' ')[0]} ! 🎉</p>
            <p className="text-sm text-muted-foreground mt-1">Meilleure boutique du mois</p>
            <div className="mt-6 flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold">{fmtShort(revenue)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-emerald-600 font-semibold">+12%</span> vs mois dernier
                </p>
              </div>
              <Link to="/admin/orders" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Voir commandes
              </Link>
            </div>
          </CardContent>
          {/* Décoratif */}
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/5" />
          <div className="pointer-events-none absolute -right-2 -bottom-8 h-28 w-28 rounded-full bg-primary/5" />
        </Card>

        {/* 3 mini-KPI */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <p className="text-xs text-muted-foreground">Chiffre d'affaires</p>
                <span className="text-xs font-semibold text-emerald-600">+6.1%</span>
              </div>
              <p className="text-2xl font-bold">{fmtShort(revenue)}</p>
              <Link to="/admin/orders" className="text-xs text-primary flex items-center gap-1 hover:underline">
                Voir plus <ArrowRight className="w-3 h-3" />
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <p className="text-xs text-muted-foreground">Commandes</p>
                <span className="text-xs font-semibold text-emerald-600">+19.2%</span>
              </div>
              <p className="text-2xl font-bold">{totalOrders.toLocaleString('fr-FR')}</p>
              <Link to="/admin/orders" className="text-xs text-primary flex items-center gap-1 hover:underline">
                Voir plus <ArrowRight className="w-3 h-3" />
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <p className="text-xs text-muted-foreground">Croissance produits</p>
                <span className="text-xs font-semibold text-red-500">-1.2%</span>
              </div>
              <p className="text-2xl font-bold">{totalProducts.toLocaleString('fr-FR')}</p>
              <Link to="/admin/products" className="text-xs text-primary flex items-center gap-1 hover:underline">
                Voir plus <ArrowRight className="w-3 h-3" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── 4 KPI cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard icon={TrendingUp}  label="Revenus (8 dernières)"  value={fmtShort(revenue)}  trend="+12%"  trendUp  iconBg="bg-emerald-100 text-emerald-700" />
        <KpiCard icon={ShoppingBag} label="Total commandes"         value={totalOrders}          trend="+8%"   trendUp  iconBg="bg-blue-100 text-blue-700" />
        <KpiCard icon={Package}     label="Produits"                value={totalProducts}        trend="+3%"   trendUp  iconBg="bg-purple-100 text-purple-700" />
        <KpiCard icon={Users}       label="En attente"              value={pendingCount}          sub="à traiter"        iconBg="bg-yellow-100 text-yellow-700" />
      </div>

      {/* ── Graphiques ───────────────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-2">

        {/* Bar chart – Commandes mensuelles */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">Commandes mensuelles</CardTitle>
                <CardDescription>6 derniers mois</CardDescription>
              </div>
              <div className="flex gap-6 rounded-lg border p-3 text-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Total</span>
                  <span className="font-semibold">{MONTHLY_DATA.reduce((a, d) => a + d.commandes, 0)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Moy.</span>
                  <span className="font-semibold">{Math.round(MONTHLY_DATA.reduce((a, d) => a + d.commandes, 0) / MONTHLY_DATA.length)}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={MONTHLY_DATA} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(v) => [`${Number(v)} commandes`, '']}
                />
                <Bar dataKey="commandes" fill="oklch(0.205 0 0)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Line chart – CA mensuel */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">Chiffre d'affaires</CardTitle>
                <CardDescription>Évolution sur 6 mois</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{fmtShort(MONTHLY_DATA.reduce((a, d) => a + d.ca, 0))}</span>
                <Badge variant="success">+2.5%</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={MONTHLY_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(v) => [fmtShort(Number(v)), 'CA']}
                />
                <Line type="monotone" dataKey="ca" stroke="oklch(0.205 0 0)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Commandes récentes + Ventes par ville ─────────────── */}
      <div className="grid gap-4 lg:grid-cols-12">

        {/* Tableau commandes */}
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

        {/* Ventes par ville */}
        <Card className="lg:col-span-5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ventes par ville</CardTitle>
            <CardDescription>Répartition géographique</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {LOCATION_DATA.map((item) => (
              <div key={item.pays} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.pays}</span>
                    <span className={cn('text-xs font-semibold', item.up ? 'text-emerald-600' : 'text-red-500')}>
                      {item.trend}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs">{item.pct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
