import { useEffect, useState, useCallback } from 'react'
import { api } from '../../lib/api'
import { Loader2, Star, Check, Trash2, MessageSquare } from 'lucide-react'

interface PendingReview {
  id: string
  rating: number
  title: string | null
  body: string | null
  author: string
  /** Avis d'un client connecté (vs déposé depuis la boutique sans compte). */
  fromAccount: boolean
  productName: string
  createdAt: string
}

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/40'}`}
        />
      ))}
    </span>
  )
}

/**
 * File de modération des avis produits. Un avis déposé depuis la boutique
 * n'apparaît sur la fiche produit qu'après validation ici.
 */
export default function Reviews() {
  const [items, setItems] = useState<PendingReview[] | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setError('')
    api.get<PendingReview[]>('/reviews/pending')
      .then(setItems)
      .catch((e) => { setItems([]); setError(e instanceof Error ? e.message : 'Erreur de chargement') })
  }, [])

  useEffect(() => { load() }, [load])

  async function approve(id: string) {
    setBusyId(id)
    try {
      await api.patch(`/reviews/${id}/approve`, {})
      setItems((prev) => prev?.filter((r) => r.id !== id) ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approbation impossible')
    } finally {
      setBusyId(null)
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer définitivement cet avis ?')) return
    setBusyId(id)
    try {
      await api.delete(`/reviews/${id}`)
      setItems((prev) => prev?.filter((r) => r.id !== id) ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Suppression impossible')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Avis à modérer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {items === null ? '—' : `${items.length} avis en attente`} · un avis n’est visible sur la boutique qu’après approbation
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {items === null ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
            <MessageSquare className="w-8 h-8" />
            <p className="text-sm">Aucun avis en attente</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((r) => (
              <div key={r.id} className="px-6 py-4 flex gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Stars rating={r.rating} />
                    <span className="font-medium text-foreground text-sm">{r.author}</span>
                    {!r.fromAccount && (
                      <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-medium">
                        Sans compte
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {DATE_FMT.format(new Date(r.createdAt))}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1.5">{r.productName}</p>
                  {r.title && <p className="text-sm font-semibold text-foreground">{r.title}</p>}
                  {r.body && <p className="text-sm text-muted-foreground whitespace-pre-line">{r.body}</p>}
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => approve(r.id)}
                    disabled={busyId === r.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {busyId === r.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Check className="w-3.5 h-3.5" />}
                    Publier
                  </button>
                  <button
                    onClick={() => remove(r.id)}
                    disabled={busyId === r.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-muted-foreground text-xs font-medium rounded-lg hover:bg-destructive/10 hover:text-destructive hover:border-red-200 disabled:opacity-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
