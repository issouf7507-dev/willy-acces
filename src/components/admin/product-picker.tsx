import { useEffect, useMemo, useRef, useState } from 'react'
import { Package, Search, X } from 'lucide-react'
import { EmptyState } from '@/components/admin/empty-state'
import { Segmented } from '@/components/admin/segmented'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface PickableProduct {
  id: string
  name: string
  price: number | string
  stock: number
  sku?: string | null
  images?: { url: string }[]
  category?: { name: string } | null
}

const fcfa = (v: number | string) => {
  const x = Number(v)
  return (Number.isFinite(x) ? x : 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' F'
}

/** Recherche tolérante : « cle » doit trouver « Porte-clés ». */
const fold = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const ALL = '__all__'

/**
 * Choix d'un article à la caisse, en vignettes plutôt qu'en liste déroulante.
 *
 * Au comptoir on reconnaît un produit à sa photo, pas à son intitulé : une
 * liste de deux cents noms se parcourt à l'aveugle et le vendeur se trompe de
 * référence. La photo, le prix et le stock tiennent dans la même vignette, ce
 * qui évite aussi d'ouvrir le catalogue dans un autre onglet pour vérifier.
 */
export function ProductPicker({
  products, counts, onPick, onClose, multiple = false, title = 'Choisir un article',
}: {
  products: PickableProduct[]
  /** Quantité déjà au ticket, par produit : la vignette la rappelle. */
  counts?: Map<string, number>
  onPick: (product: PickableProduct) => void
  onClose: () => void
  /** Le panneau reste ouvert après chaque choix, pour composer un ticket d'un trait. */
  multiple?: boolean
  title?: string
}) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>(ALL)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    searchRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  /** Les catégories réellement présentes au catalogue, dans l'ordre alphabétique. */
  const categories = useMemo(() => {
    const names = new Set<string>()
    for (const p of products) if (p.category?.name) names.add(p.category.name)
    return [...names].sort((a, b) => a.localeCompare(b, 'fr'))
  }, [products])

  const shown = useMemo(() => {
    const q = fold(search.trim())
    return products.filter((p) => {
      if (category !== ALL && p.category?.name !== category) return false
      if (!q) return true
      return fold(p.name).includes(q) || fold(p.sku ?? '').includes(q)
    })
  }, [products, search, category])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="flex h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-xl sm:h-[85vh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-3 border-b border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading font-semibold">{title}</h2>
            <Button variant="ghost" size="icon" aria-label="Fermer" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit ou un SKU…"
              className="h-9 pl-8"
              aria-label="Rechercher un produit"
            />
          </div>

          {categories.length > 1 && (
            <Segmented
              value={category}
              onChange={setCategory}
              ariaLabel="Filtrer par catégorie"
              className="flex w-full"
              options={[
                { id: ALL, label: 'Tout', badge: products.length },
                ...categories.map((c) => ({ id: c, label: c })),
              ]}
            />
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!shown.length ? (
            <EmptyState
              icon={Package}
              title="Aucun produit"
              description={
                products.length
                  ? 'Aucun article ne correspond à cette recherche.'
                  : 'Le catalogue est vide ou indisponible.'
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {shown.map((p) => {
                const inTicket = counts?.get(p.id) ?? 0
                const out = p.stock <= 0
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onPick(p)}
                    className={cn(
                      'group relative flex flex-col overflow-hidden rounded-xl border border-border bg-background text-left transition',
                      'hover:border-foreground/30 hover:shadow-md active:scale-[0.98]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      inTicket && 'border-foreground/40 ring-1 ring-foreground/20',
                    )}
                  >
                    <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-muted">
                      {p.images?.[0] ? (
                        <img
                          src={p.images[0].url}
                          alt=""
                          loading="lazy"
                          className={cn('size-full object-cover', out && 'opacity-50')}
                        />
                      ) : (
                        <Package className="size-8 text-muted-foreground/40" />
                      )}
                      {/* Le stock se lit sur la vignette : on évite de vendre ce
                          qui n'est plus en rayon sans ouvrir la fiche produit. */}
                      <span
                        className={cn(
                          'absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums backdrop-blur-sm',
                          out
                            ? 'bg-destructive/85 text-white'
                            : p.stock <= 3
                              ? 'bg-warning/85 text-black'
                              : 'bg-black/55 text-white',
                        )}
                      >
                        {out ? 'Rupture' : `${p.stock} en stock`}
                      </span>
                      {inTicket > 0 && (
                        <span className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-foreground text-xs font-semibold tabular-nums text-background">
                          {inTicket}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5 p-2.5">
                      <p className="line-clamp-2 text-sm font-medium leading-snug">{p.name}</p>
                      <p className="mt-auto pt-1 text-sm font-semibold tabular-nums">{fcfa(p.price)}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {multiple && (
          <div className="flex items-center justify-between gap-3 border-t border-border p-4">
            <p className="text-xs text-muted-foreground">
              Touchez une vignette pour l'ajouter au ticket.
            </p>
            <Button onClick={onClose}>Terminé</Button>
          </div>
        )}
      </div>
    </div>
  )
}
