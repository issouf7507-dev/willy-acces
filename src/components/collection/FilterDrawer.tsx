import { useMemo, useState } from 'react'
import { formatPrice } from '../../lib/utils'
import type { BagProduct } from '../../data/bags'

export interface ActiveFilters {
  colors: string[]
  activities: string[]
  volumes: string[]
  weather: string[]
  /** `null` = aucun plafond de prix (état par défaut). */
  priceMax: number | null
  inStockOnly: boolean
}

interface Props {
  isOpen: boolean
  onClose: () => void
  filters: ActiveFilters
  onChange: (filters: ActiveFilters) => void
  totalCount: number
  /** Catalogue complet (non filtré) : sert à construire les options proposées. */
  products: BagProduct[]
}

/**
 * Tranches de volume. C'est un découpage d'affichage, pas du contenu éditorial :
 * seules les tranches réellement occupées par un produit sont proposées.
 */
export const VOLUME_BUCKETS = [
  { id: '0-10', label: '0 – 10 L', min: 0, max: 10 },
  { id: '11-20', label: '11 – 20 L', min: 10, max: 20 },
  { id: '21-30', label: '21 – 30 L', min: 20, max: 30 },
  { id: '31+', label: '31 L et +', min: 30, max: Infinity },
] as const

export function volumeToLiters(v: string | undefined): number {
  if (!v) return 0
  const n = parseFloat(v)
  return isNaN(n) ? 0 : n
}

/** Un produit correspond-il à au moins une des tranches de volume sélectionnées ? */
export function matchesVolume(productVolume: string | undefined, selected: string[]): boolean {
  if (selected.length === 0) return true
  const liters = volumeToLiters(productVolume)
  if (liters <= 0) return false
  return selected.some((id) => {
    const b = VOLUME_BUCKETS.find((x) => x.id === id)
    return b ? liters > b.min && liters <= b.max : false
  })
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="8" height="6" viewBox="0 0 8 6" fill="none"
      className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path d="m1 1.5 3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function AccordionSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-zinc-200">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-4 text-sm font-bold uppercase tracking-wide text-left hover:opacity-70 transition-opacity"
      >
        {title}
        <ChevronIcon open={open} />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  )
}

export default function FilterDrawer({ isOpen, onClose, filters, onChange, totalCount, products }: Props) {
  const toggle = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]

  /**
   * Toutes les options viennent du catalogue réel (donc du back-office) : on ne
   * propose jamais un filtre qui ne correspondrait à aucun produit.
   */
  const options = useMemo(() => {
    const colors = new Map<string, string>()
    const activities = new Set<string>()
    const weather = new Set<string>()
    let priceMax = 0

    for (const p of products) {
      p.colors?.forEach(c => { if (!colors.has(c.name)) colors.set(c.name, c.hex) })
      p.tags?.forEach(t => activities.add(t))
      p.weather?.forEach(w => weather.add(w))
      if (p.price > priceMax) priceMax = p.price
    }

    const volumes = VOLUME_BUCKETS.filter(b =>
      products.some(p => {
        const l = volumeToLiters(p.volume)
        return l > b.min && l <= b.max
      }),
    )

    return {
      colors: [...colors].map(([name, hex]) => ({ name, hex })),
      activities: [...activities].sort(),
      weather: [...weather].sort(),
      volumes,
      // Arrondi au millier supérieur pour un curseur lisible en FCFA.
      priceMax: priceMax > 0 ? Math.ceil(priceMax / 1000) * 1000 : 0,
    }
  }, [products])

  const priceValue = filters.priceMax ?? options.priceMax

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-white z-50 flex flex-col shadow-xl transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-none lg:h-auto lg:z-auto lg:w-56 xl:w-64 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-zinc-200">
          <p className="font-bold text-sm uppercase tracking-wide">Filtres</p>
          <button onClick={onClose} aria-label="Fermer les filtres" className="p-1.5 hover:opacity-60 transition-opacity">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Scrollable filters */}
        <div className="flex-1 overflow-y-auto px-5 lg:px-0">
          {/* Couleur */}
          {options.colors.length > 0 && (
            <AccordionSection title="Couleur" defaultOpen>
              <div className="flex flex-wrap gap-2">
                {options.colors.map(color => (
                  <button
                    key={color.name}
                    title={color.name}
                    onClick={() => onChange({ ...filters, colors: toggle(filters.colors, color.name) })}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      filters.colors.includes(color.name) ? 'border-black scale-110' : 'border-zinc-200'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </AccordionSection>
          )}

          {/* Caractéristiques (tags produit) */}
          {options.activities.length > 0 && (
            <AccordionSection title="Caractéristiques">
              <div className="space-y-2">
                {options.activities.map(activity => (
                  <label key={activity} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.activities.includes(activity)}
                      onChange={() => onChange({ ...filters, activities: toggle(filters.activities, activity) })}
                      className="w-4 h-4 rounded border-zinc-300 accent-black"
                    />
                    <span className="text-sm text-zinc-600 group-hover:text-black capitalize">
                      {activity}
                    </span>
                  </label>
                ))}
              </div>
            </AccordionSection>
          )}

          {/* Résistance aux intempéries */}
          {options.weather.length > 0 && (
            <AccordionSection title="Résistance aux intempéries">
              <div className="space-y-2">
                {options.weather.map(w => (
                  <label key={w} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.weather.includes(w)}
                      onChange={() => onChange({ ...filters, weather: toggle(filters.weather, w) })}
                      className="w-4 h-4 rounded border-zinc-300 accent-black"
                    />
                    <span className="text-sm text-zinc-600 group-hover:text-black">{w}</span>
                  </label>
                ))}
              </div>
            </AccordionSection>
          )}

          {/* Volume */}
          {options.volumes.length > 0 && (
            <AccordionSection title="Volume">
              <div className="space-y-2">
                {options.volumes.map(v => (
                  <label key={v.id} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.volumes.includes(v.id)}
                      onChange={() => onChange({ ...filters, volumes: toggle(filters.volumes, v.id) })}
                      className="w-4 h-4 rounded border-zinc-300 accent-black"
                    />
                    <span className="text-sm text-zinc-600 group-hover:text-black">{v.label}</span>
                  </label>
                ))}
              </div>
            </AccordionSection>
          )}

          {/* Prix — bornes calculées sur le catalogue réel */}
          {options.priceMax > 0 && (
            <AccordionSection title="Prix">
              <div className="space-y-3">
                <input
                  type="range"
                  min={0}
                  max={options.priceMax}
                  step={Math.max(500, Math.round(options.priceMax / 100))}
                  value={priceValue}
                  onChange={e => {
                    const v = Number(e.target.value)
                    // Curseur au maximum = pas de plafond.
                    onChange({ ...filters, priceMax: v >= options.priceMax ? null : v })
                  }}
                  className="w-full accent-black"
                />
                <div className="flex items-center justify-between text-sm text-zinc-500">
                  <span>0</span>
                  <span className="font-semibold text-black">{formatPrice(priceValue)}</span>
                </div>
              </div>
            </AccordionSection>
          )}

          {/* In Stock */}
          <div className="py-4 border-b border-zinc-200 flex items-center justify-between">
            <label htmlFor="instock" className="text-sm font-bold uppercase tracking-wide cursor-pointer">
              En stock uniquement
            </label>
            <button
              id="instock"
              role="switch"
              aria-checked={filters.inStockOnly}
              onClick={() => onChange({ ...filters, inStockOnly: !filters.inStockOnly })}
              className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${filters.inStockOnly ? 'bg-black' : 'bg-zinc-300'}`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${filters.inStockOnly ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>
        </div>

        {/* Mobile apply button */}
        <div className="lg:hidden px-5 py-4 border-t border-zinc-200">
          <button
            onClick={onClose}
            className="w-full bg-black text-white py-3.5 text-sm font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
          >
            Voir {totalCount} produits
          </button>
        </div>
      </aside>
    </>
  )
}
