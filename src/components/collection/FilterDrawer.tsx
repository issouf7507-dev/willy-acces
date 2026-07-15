import { useState } from 'react'
import { formatPrice } from '../../lib/utils'
import { COLOR_FILTERS, ACTIVITY_FILTERS, VOLUME_FILTERS, WEATHER_FILTERS } from '../../data/bags'

export interface ActiveFilters {
  colors: string[]
  activities: string[]
  volumes: string[]
  weather: string[]
  priceMax: number
  inStockOnly: boolean
}

interface Props {
  isOpen: boolean
  onClose: () => void
  filters: ActiveFilters
  onChange: (filters: ActiveFilters) => void
  totalCount: number
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

export default function FilterDrawer({ isOpen, onClose, filters, onChange, totalCount }: Props) {
  const toggle = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]

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
          {/* Color */}
          <AccordionSection title="Couleur" defaultOpen>
            <div className="flex flex-wrap gap-2">
              {COLOR_FILTERS.map(color => (
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

          {/* Activity & Features */}
          <AccordionSection title="Activité & Caractéristiques">
            <div className="space-y-2">
              {ACTIVITY_FILTERS.map(activity => (
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

          {/* Weather Resistance */}
          <AccordionSection title="Résistance aux intempéries">
            <div className="space-y-2">
              {WEATHER_FILTERS.map(w => (
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

          {/* Volume */}
          <AccordionSection title="Volume">
            <div className="space-y-2">
              {VOLUME_FILTERS.map(v => (
                <label key={v} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.volumes.includes(v)}
                    onChange={() => onChange({ ...filters, volumes: toggle(filters.volumes, v) })}
                    className="w-4 h-4 rounded border-zinc-300 accent-black"
                  />
                  <span className="text-sm text-zinc-600 group-hover:text-black">{v}</span>
                </label>
              ))}
            </div>
          </AccordionSection>

          {/* Price */}
          <AccordionSection title="Prix">
            <div className="space-y-3">
              <input
                type="range"
                min="0"
                max="300"
                value={filters.priceMax}
                onChange={e => onChange({ ...filters, priceMax: Number(e.target.value) })}
                className="w-full accent-black"
              />
              <div className="flex items-center justify-between text-sm text-zinc-500">
                <span>0</span>
                <span className="font-semibold text-black">{formatPrice(filters.priceMax)}</span>
              </div>
            </div>
          </AccordionSection>

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
