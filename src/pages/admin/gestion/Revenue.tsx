import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { Loader2, TrendingUp, CalendarDays } from 'lucide-react'

interface DailyReport {
  from: string
  to: string
  stores: { id: string; name: string }[]
  days: { date: string; byStore: Record<string, number>; total: number }[]
  total: number
}

const fcfa = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' F'

/** Date du jour et d'il y a `days` jours, au format attendu par l'API. */
function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

const RANGES = [
  { label: '7 jours', days: 7 },
  { label: '30 jours', days: 30 },
  { label: '90 jours', days: 90 },
]

export default function Revenue() {
  const [report, setReport] = useState<DailyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [range, setRange] = useState(30)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ from: isoDaysAgo(range), to: isoDaysAgo(0) })
    api.get<DailyReport>(`/gestion/reports/daily?${params}`)
      .then(setReport)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [range])

  // Une boutique sans la moindre vente sur la période n'ajoute qu'une colonne
  // de zéros : on ne garde que celles qui ont vendu.
  const activeStores = report
    ? report.stores.filter((s) => report.days.some((d) => (d.byStore[s.id] ?? 0) !== 0))
    : []
  const unassigned = report?.days.some((d) => (d.byStore.unassigned ?? 0) !== 0)

  const storeTotal = (id: string) =>
    report?.days.reduce((sum, d) => sum + (d.byStore[id] ?? 0), 0) ?? 0

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recettes journalières</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Calculé à partir des ventes — rien à saisir ici. Montants nets de remise.
          </p>
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {RANGES.map((r) => (
            <button key={r.days} onClick={() => setRange(r.days)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                range === r.days ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {report && !loading && (
        <div className="mb-6 inline-flex items-center gap-3 px-5 py-4 bg-card rounded-xl border border-border">
          <TrendingUp className="w-5 h-5 text-success" />
          <div>
            <p className="text-xs text-muted-foreground">Total sur la période</p>
            <p className="text-xl font-bold text-foreground tabular-nums">{fcfa(report.total)}</p>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !report?.days.length ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
            <CalendarDays className="w-8 h-8" />
            <p className="text-sm">Aucune vente sur la période</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Date</th>
                  {activeStores.map((s) => (
                    <th key={s.id} className="text-right font-medium px-4 py-3 whitespace-nowrap">{s.name}</th>
                  ))}
                  {unassigned && <th className="text-right font-medium px-4 py-3">Sans boutique</th>}
                  <th className="text-right font-medium px-5 py-3">Total du jour</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.days.map((d) => (
                  <tr key={d.date} className="hover:bg-muted/40">
                    <td className="px-5 py-3 text-foreground whitespace-nowrap">
                      {new Date(`${d.date}T12:00:00`).toLocaleDateString('fr-FR', {
                        weekday: 'short', day: '2-digit', month: 'short',
                      })}
                    </td>
                    {activeStores.map((s) => (
                      <td key={s.id} className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {d.byStore[s.id] ? fcfa(d.byStore[s.id]) : <span className="text-muted-foreground/40">—</span>}
                      </td>
                    ))}
                    {unassigned && (
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {d.byStore.unassigned ? fcfa(d.byStore.unassigned) : <span className="text-muted-foreground/40">—</span>}
                      </td>
                    )}
                    <td className="px-5 py-3 text-right tabular-nums font-medium text-foreground">{fcfa(d.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50 text-xs">
                <tr>
                  <td className="px-5 py-3 font-medium text-muted-foreground">Total</td>
                  {activeStores.map((s) => (
                    <td key={s.id} className="px-4 py-3 text-right tabular-nums font-medium text-foreground">
                      {fcfa(storeTotal(s.id))}
                    </td>
                  ))}
                  {unassigned && (
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-foreground">
                      {fcfa(storeTotal('unassigned'))}
                    </td>
                  )}
                  <td className="px-5 py-3 text-right tabular-nums font-bold text-foreground">{fcfa(report.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
