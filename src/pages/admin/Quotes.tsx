import { useEffect, useState, useCallback } from 'react'
import { api } from '../../lib/api'
import { Loader2, FileText, Trash2, Phone, Mail, Calendar, MapPin, Users } from 'lucide-react'

type Status = 'NEW' | 'IN_REVIEW' | 'QUOTED' | 'ACCEPTED' | 'DECLINED' | 'CLOSED'

interface Quote {
  id: string
  name: string
  phone: string
  email: string | null
  services: string[]
  occasion: string | null
  eventDate: string | null
  location: string
  guests: number
  budget: string | null
  message: string | null
  status: Status
  adminNote: string | null
  createdAt: string
}

interface PageData {
  items: Quote[]
  meta: { total: number; page: number; totalPages: number }
}

const STATUS: Record<Status, { label: string; cls: string }> = {
  NEW:       { label: 'Nouveau',      cls: 'bg-blue-50 text-blue-700' },
  IN_REVIEW: { label: 'En cours',     cls: 'bg-amber-50 text-amber-700' },
  QUOTED:    { label: 'Devis envoyé', cls: 'bg-purple-50 text-purple-700' },
  ACCEPTED:  { label: 'Accepté',      cls: 'bg-green-50 text-green-700' },
  DECLINED:  { label: 'Refusé',       cls: 'bg-red-50 text-red-700' },
  CLOSED:    { label: 'Clôturé',      cls: 'bg-gray-100 text-gray-500' },
}

const FILTERS: { id: '' | Status; label: string }[] = [
  { id: '', label: 'Tous' },
  { id: 'NEW', label: 'Nouveaux' },
  { id: 'IN_REVIEW', label: 'En cours' },
  { id: 'QUOTED', label: 'Devis envoyé' },
  { id: 'ACCEPTED', label: 'Acceptés' },
  { id: 'CLOSED', label: 'Clôturés' },
]

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

export default function Quotes() {
  const [data, setData] = useState<PageData | null>(null)
  const [filter, setFilter] = useState<'' | Status>('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Quote | null>(null)
  const [status, setStatus] = useState<Status>('NEW')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '100' })
    if (filter) params.set('status', filter)
    api.get<PageData>(`/quotes?${params}`)
      .then(setData)
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  function open(q: Quote) {
    setSelected(q); setStatus(q.status); setNote(q.adminNote ?? '')
  }

  async function save() {
    if (!selected) return
    setSaving(true)
    try {
      await api.patch(`/quotes/${selected.id}`, { status, adminNote: note })
      setSelected(null); load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cette demande de devis ?')) return
    await api.delete(`/quotes/${id}`).catch((e) => alert(e.message))
    setSelected(null); load()
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Demandes de devis</h1>
        <p className="text-sm text-gray-500 mt-1">{data?.meta.total ?? '—'} demande(s)</p>
      </div>

      {/* Filtres */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide">
        {FILTERS.map((f) => (
          <button key={f.id || 'all'} onClick={() => setFilter(f.id)}
            className={`flex-shrink-0 px-3.5 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              filter === f.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
            <FileText className="w-8 h-8" /><p className="text-sm">Aucune demande</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.items.map((q) => (
              <button key={q.id} onClick={() => open(q)}
                className="w-full text-left flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{q.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS[q.status].cls}`}>{STATUS[q.status].label}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                    {q.services.join(', ')}{q.occasion ? ` · ${q.occasion}` : ''}
                  </p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{DATE_FMT.format(new Date(q.createdAt))}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Détail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-gray-900 text-lg">{selected.name}</h2>
                <p className="text-xs text-gray-400">Reçu le {DATE_FMT.format(new Date(selected.createdAt))}</p>
              </div>
              <button onClick={() => remove(selected.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
              <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" />{selected.phone}</span>
              {selected.email && <span className="flex items-center gap-2 truncate"><Mail className="w-4 h-4 text-gray-400" />{selected.email}</span>}
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" />{selected.location === 'domicile' ? 'À domicile' : 'Au salon'}</span>
              <span className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" />{selected.guests} personne(s)</span>
              {selected.eventDate && <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" />{DATE_FMT.format(new Date(selected.eventDate))}</span>}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {selected.services.map((s) => (
                <span key={s} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">{s}</span>
              ))}
            </div>

            {selected.occasion && <p className="text-sm text-gray-600"><span className="text-gray-400">Occasion :</span> {selected.occasion}</p>}
            {selected.budget && <p className="text-sm text-gray-600"><span className="text-gray-400">Budget :</span> {selected.budget}</p>}
            {selected.message && (
              <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{selected.message}</div>
            )}

            <hr className="border-gray-100" />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Statut</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as Status)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                {(Object.keys(STATUS) as Status[]).map((s) => (
                  <option key={s} value={s}>{STATUS[s].label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Note interne</label>
              <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Note visible uniquement en interne…"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setSelected(null)}
                className="flex-1 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Fermer
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
