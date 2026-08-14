import { useEffect, useState, useCallback } from 'react'
import { api } from '../../lib/api'
import { Loader2, BellRing, Trash2, Copy, Check, Search } from 'lucide-react'

interface Subscriber {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string | null
  createdAt: string
}

interface PageData {
  items: Subscriber[]
  meta: { total: number; page: number; totalPages: number }
}

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

/**
 * Inscrits à la communauté (notifications, promos, jeux) — table `subscribers`,
 * alimentée par la page publique /inscription.
 */
export default function Subscribers() {
  const [data, setData] = useState<PageData | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<'phones' | 'emails' | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '200' })
    if (search.trim()) params.set('search', search.trim())
    api
      .get<PageData>(`/subscribers?${params}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [search])

  // Recherche à la frappe : on laisse retomber la saisie avant d'appeler l'API.
  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  async function remove(s: Subscriber) {
    if (!confirm(`Retirer ${s.firstName} ${s.lastName} de la liste ?`)) return
    try {
      await api.delete(`/subscribers/${s.id}`)
      load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur')
    }
  }

  /** Copie la liste pour la coller dans un outil d'envoi (WhatsApp, SMS, mailing). */
  async function copyList(kind: 'phones' | 'emails') {
    const items = data?.items ?? []
    const values =
      kind === 'phones'
        ? items.map((s) => s.phone)
        : items.map((s) => s.email).filter((e): e is string => Boolean(e))
    if (!values.length) return
    await navigator.clipboard.writeText(values.join('\n'))
    setCopied(kind)
    setTimeout(() => setCopied(null), 2000)
  }

  const emailCount = (data?.items ?? []).filter((s) => s.email).length

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inscrits</h1>
        <p className="text-sm text-gray-500 mt-1">
          {data?.meta.total ?? '—'} inscrit(s) — notifications, promotions et jeux
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, téléphone ou e-mail…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <button
          onClick={() => copyList('phones')}
          disabled={!data?.items.length}
          className="flex items-center gap-2 px-3.5 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {copied === 'phones' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          Copier les numéros
        </button>
        <button
          onClick={() => copyList('emails')}
          disabled={!emailCount}
          className="flex items-center gap-2 px-3.5 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {copied === 'emails' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          Copier les e-mails ({emailCount})
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
            <BellRing className="w-8 h-8" />
            <p className="text-sm">{search ? 'Aucun inscrit ne correspond' : 'Aucun inscrit pour le moment'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.items.map((s) => (
              <div key={s.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">
                    {s.firstName} {s.lastName}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {s.phone}
                    {s.email ? ` · ${s.email}` : ''}
                  </p>
                </div>
                <span className="text-xs text-gray-400 shrink-0 hidden sm:block">
                  {DATE_FMT.format(new Date(s.createdAt))}
                </span>
                <button
                  onClick={() => remove(s)}
                  aria-label={`Retirer ${s.firstName} ${s.lastName}`}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
