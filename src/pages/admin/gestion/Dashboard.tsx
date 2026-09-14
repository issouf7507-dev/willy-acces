import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../../lib/api'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts'
import {
  Loader2, TrendingUp, Wallet, AlertTriangle, Flame, Trophy, ArrowRight, CalendarDays,
} from 'lucide-react'

interface DashboardData {
  today: number
  month: string
  monthRevenue: number
  netProfit: number | null
  monthClosed: boolean
  restockCount: number
  promoCount: number
  byStore: { storeId: string; name: string; revenue: number }[]
  bestStore: string | null
  monthly: { month: string; byStore: Record<string, number> }[]
}

const fcfa = (v: number | null) =>
  v === null ? '—' : v.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' F'

/** Format court pour l'axe : « 120 k » plutôt que « 120 000 ». */
const short = (v: number) =>
  Math.abs(v) >= 1000 ? `${Math.round(v / 1000)} k` : String(v)

const monthShort = (m: string) =>
  new Date(`${m}-01T12:00:00`).toLocaleDateString('fr-FR', { month: 'short' })

const monthLong = (m: string) =>
  new Date(`${m}-01T12:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

/**
 * Une teinte par boutique, prise dans les couleurs de graphique du thème :
 * elles sont relevées en version sombre, là où une palette figée resterait
 * terne sur fond noir.
 */
const COLORS = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)',
  'var(--chart-4)', 'var(--chart-5)',
]

function Tile({
  label, value, hint, icon: Icon, tone = 'default', to,
}: {
  label: string
  value: string
  hint?: string
  icon: typeof TrendingUp
  tone?: 'default' | 'warn' | 'promo'
  to?: string
}) {
  const toneClass =
    tone === 'warn' ? 'text-warning' : tone === 'promo' ? 'text-warning' : 'text-foreground'
  const body = (
    <div className="bg-card rounded-xl border border-border p-5 h-full hover:border-input transition-colors">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <p className={`text-2xl font-bold tabular-nums mt-2 ${toneClass}`}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  )
  return to ? <Link to={to} className="block">{body}</Link> : body
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<DashboardData>('/gestion/reports/dashboard')
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center h-64 bg-card rounded-xl border border-border">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return <div className="p-6 lg:p-8"><p className="text-sm text-destructive">{error || 'Erreur'}</p></div>
  }

  // Une boutique qui n'a rien vendu sur 6 mois n'ajoute qu'une série plate.
  const chartStores = data.byStore.filter((s) =>
    data.monthly.some((m) => (m.byStore[s.storeId] ?? 0) !== 0),
  )
  const chartData = data.monthly.map((m) => ({
    month: monthShort(m.month),
    ...Object.fromEntries(chartStores.map((s) => [s.name, m.byStore[s.storeId] ?? 0])),
  }))
  const hasChart = chartStores.length > 0


  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground mt-1 capitalize">{monthLong(data.month)}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Tile label="Recette du jour" value={fcfa(data.today)} icon={CalendarDays} />
        <Tile label="Recette du mois" value={fcfa(data.monthRevenue)} icon={TrendingUp} to="/admin/gestion/revenue" />
        <Tile
          label="Bénéfice net"
          value={fcfa(data.netProfit)}
          hint={data.monthClosed ? undefined : 'Charges du mois à saisir'}
          icon={Wallet}
          to="/admin/gestion/balance"
        />
        <Tile
          label="À commander"
          value={String(data.restockCount)}
          hint={data.restockCount ? 'produits sous le seuil' : 'aucune alerte'}
          icon={AlertTriangle}
          tone={data.restockCount ? 'warn' : 'default'}
          to="/admin/gestion/stock"
        />
        <Tile
          label="À promouvoir"
          value={String(data.promoCount)}
          hint={data.promoCount ? 'stock dormant' : 'rien à signaler'}
          icon={Flame}
          tone={data.promoCount ? 'promo' : 'default'}
          to="/admin/gestion/stock"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-1">Recette du mois par boutique</h2>
          {data.bestStore ? (
            <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" /> Meilleure boutique : {data.bestStore}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mb-4">Aucune vente ce mois-ci</p>
          )}
          <div className="space-y-3">
            {data.byStore.map((s) => {
              const share = data.monthRevenue > 0 ? s.revenue / data.monthRevenue : 0
              return (
                <div key={s.storeId}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-foreground truncate">{s.name}</span>
                    <span className="tabular-nums text-foreground font-medium">{fcfa(s.revenue)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-gray-900 transition-all"
                      style={{ width: `${Math.round(share * 100)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4">Comparatif des boutiques — 6 mois</h2>
          {!hasChart ? (
            <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
              Pas encore assez de ventes pour comparer
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/60" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false}
                    tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis tickFormatter={short} tickLine={false} axisLine={false}
                    tick={{ fontSize: 12 }} width={48} className="fill-muted-foreground" />
                  <Tooltip
                    formatter={(v) => fcfa(typeof v === 'number' ? v : Number(v) || 0)}
                    cursor={{ className: 'fill-muted/40' }}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      background: 'var(--popover)',
                      color: 'var(--popover-foreground)',
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {chartStores.map((s, i) => (
                    <Bar key={s.storeId} dataKey={s.name} fill={COLORS[i % COLORS.length]}
                      radius={[3, 3, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {[
          { to: '/admin/caisse', label: 'Encaisser une vente' },
          { to: '/admin/gestion/shipments', label: 'Saisir un arrivage' },
          { to: '/admin/gestion/expenses', label: 'Noter une dépense' },
          { to: '/admin/gestion/targets', label: 'Objectifs du mois' },
        ].map((l) => (
          <Link key={l.to} to={l.to}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground hover:border-input hover:text-foreground transition-colors">
            {l.label} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ))}
      </div>
    </div>
  )
}
