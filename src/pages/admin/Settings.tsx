import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Plus, Trash2, Loader2, Save } from 'lucide-react'

type SettingsMap = Record<string, unknown>

interface Row {
  key: string
  /** Valeur éditée en texte ; JSON si possible, sinon chaîne brute. */
  value: string
}

/** Clés suggérées si le store est vide (l'admin peut en ajouter d'autres). */
const SUGGESTED: string[] = [
  'storeName',
  'contactPhone',
  'contactEmail',
  'whatsappNumber',
  'announcement',
  'freeShippingThreshold',
]

function toText(v: unknown): string {
  if (typeof v === 'string') return v
  return JSON.stringify(v, null, 2)
}

/** Reconvertit le texte en valeur JSON (nombre, booléen, objet…) ou chaîne. */
function parseValue(text: string): unknown {
  const trimmed = text.trim()
  if (trimmed === '') return ''
  try {
    return JSON.parse(trimmed)
  } catch {
    return text
  }
}

export default function Settings() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get<SettingsMap>('/settings')
      .then((map) => {
        const entries = Object.entries(map ?? {})
        if (entries.length === 0) {
          setRows(SUGGESTED.map((key) => ({ key, value: '' })))
        } else {
          setRows(entries.map(([key, value]) => ({ key, value: toText(value) })))
        }
      })
      .catch(() => setError('Impossible de charger les paramètres.'))
      .finally(() => setLoading(false))
  }, [])

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
    setSaved(false)
  }

  function addRow() {
    setRows((rs) => [...rs, { key: '', value: '' }])
    setSaved(false)
  }

  function removeRow(i: number) {
    setRows((rs) => rs.filter((_, idx) => idx !== i))
    setSaved(false)
  }

  async function save() {
    const cleaned = rows.filter((r) => r.key.trim())
    const keys = cleaned.map((r) => r.key.trim())
    if (new Set(keys).size !== keys.length) {
      setError('Deux paramètres ont la même clé.')
      return
    }
    setSaving(true); setError(''); setSaved(false)

    const payload: SettingsMap = {}
    for (const r of cleaned) payload[r.key.trim()] = parseValue(r.value)

    try {
      await api.put('/settings', payload)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-sm text-gray-500 mt-1">Configuration clé / valeur de la boutique</p>
        </div>
        <button onClick={save} disabled={saving || loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Enregistrer
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-3 items-start">
              <input
                value={row.key}
                onChange={(e) => updateRow(i, { key: e.target.value })}
                placeholder="clé"
                className="w-48 shrink-0 px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <textarea
                value={row.value}
                onChange={(e) => updateRow(i, { value: e.target.value })}
                placeholder="valeur (texte ou JSON)"
                rows={1}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-y"
              />
              <button onClick={() => removeRow(i)}
                className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button onClick={addRow}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            <Plus className="w-4 h-4" /> Ajouter un paramètre
          </button>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-emerald-600">Paramètres enregistrés.</p>}
        </div>
      )}
    </div>
  )
}
