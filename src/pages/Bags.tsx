import { useState, useMemo, useEffect } from 'react'
import AnnouncementBar from '../components/AnnouncementBar'
import Header from '../components/Header'
import Footer from '../components/Footer'
import CollectionBanner from '../components/collection/CollectionBanner'
import FilterDrawer, { type ActiveFilters } from '../components/collection/FilterDrawer'
import CollectionProductCard from '../components/collection/CollectionProductCard'
import { SORT_OPTIONS, type BagProduct } from '../data/bags'
import { fetchBags } from '../lib/storefront'

const PAGE_SIZE = 12

const DEFAULT_FILTERS: ActiveFilters = {
  colors: [],
  activities: [],
  volumes: [],
  weather: [],
  priceMax: 300,
  inStockOnly: false,
}

function volumeToLiters(v: string | undefined): number {
  if (!v) return 0
  const n = parseFloat(v)
  return isNaN(n) ? 0 : n
}

function productMatchesVolume(productVolume: string | undefined, filterVolumes: string[]): boolean {
  if (filterVolumes.length === 0) return true
  const liters = volumeToLiters(productVolume)
  return filterVolumes.some(v => {
    if (v === '0 - 10 Liters') return liters > 0 && liters <= 10
    if (v === '11 - 20 Liters') return liters > 10 && liters <= 20
    if (v === '21 - 30 Liters') return liters > 20 && liters <= 30
    if (v === '31+ Liters') return liters > 30
    return false
  })
}

export default function Bags() {
  const [products, setProducts] = useState<BagProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [filters, setFilters] = useState<ActiveFilters>(DEFAULT_FILTERS)
  const [sortBy, setSortBy] = useState('featured')
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchBags()
      .then(setProducts)
      .catch(() => setLoadError('Impossible de charger les sacs.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let result = [...products]

    if (filters.colors.length > 0) {
      result = result.filter(p => p.colors.some(c => filters.colors.includes(c.name)))
    }
    if (filters.activities.length > 0) {
      result = result.filter(p => filters.activities.some(a => p.tags.includes(a)))
    }
    if (filters.weather.length > 0) {
      result = result.filter(p => p.weather?.some(w => filters.weather.includes(w)))
    }
    if (filters.volumes.length > 0) {
      result = result.filter(p => productMatchesVolume(p.volume, filters.volumes))
    }
    if (filters.inStockOnly) {
      result = result.filter(p => p.inStock && !p.soldOut)
    }
    result = result.filter(p => p.price <= filters.priceMax)

    switch (sortBy) {
      case 'price-asc': result.sort((a, b) => a.price - b.price); break
      case 'price-desc': result.sort((a, b) => b.price - a.price); break
      case 'rating': result.sort((a, b) => b.rating - a.rating); break
      case 'reviews': result.sort((a, b) => b.reviews - a.reviews); break
    }

    return result
  }, [products, filters, sortBy])

  const displayed = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = displayed.length < filtered.length

  const activeFilterCount =
    filters.colors.length +
    filters.activities.length +
    filters.weather.length +
    filters.volumes.length +
    (filters.inStockOnly ? 1 : 0) +
    (filters.priceMax < 300 ? 1 : 0)

  const clearAll = () => {
    setFilters(DEFAULT_FILTERS)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-white">
      <AnnouncementBar />
      <Header />

      <CollectionBanner
        title="Sacs"
        description="Éprouvés depuis des années. Robustes, résistants aux intempéries et conçus pour tout emporter."
        totalCount={filtered.length}
      />

      <div className="max-w-[1600px] mx-auto px-5 md:px-12 py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            {/* Filter button */}
            <button
              onClick={() => setFilterDrawerOpen(true)}
              className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide border border-zinc-300 px-4 py-2.5 hover:border-black transition-colors lg:hidden"
            >
              <svg width="18" height="12" viewBox="0 0 20 14" fill="none" className="flex-shrink-0">
                <path d="M1 2C0.448 2 0 2.448 0 3s.448 1 1 1h4V2H1zm14 0h-9v2h9V2zm4 0h-3v2h3c.552 0 1-.448 1-1s-.448-1-1-1zM1 10c-.552 0-1 .448-1 1s.448 1 1 1h10v-2H1zm14 0v2h5c.552 0 1-.448 1-1s-.448-1-1-1h-5z" fill="currentColor" />
                <circle cx="7" cy="3" r="2" stroke="currentColor" strokeWidth="1.5" fill="white" />
                <circle cx="13" cy="11" r="2" stroke="currentColor" strokeWidth="1.5" fill="white" />
              </svg>
              Filtrer & trier
              {activeFilterCount > 0 && (
                <span className="bg-black text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Desktop filter toggle label */}
            <span className="hidden lg:flex items-center gap-2 text-sm text-zinc-500">
              <svg width="16" height="12" viewBox="0 0 20 14" fill="none">
                <path d="M1 2h4v-1.5A.5.5 0 004.5 0h-3A.5.5 0 001 .5V2zm0 2h4v6h-4V4zm6-4h7v.5a.5.5 0 01-.5.5H7.5A.5.5 0 017 .5V0zm0 2h7v6H7V2z" fill="currentColor" opacity=".4" />
              </svg>
              {filtered.length} products
            </span>

            {/* Active filter pills */}
            {activeFilterCount > 0 && (
              <div className="hidden lg:flex items-center gap-2 flex-wrap">
                {filters.colors.map(c => (
                  <button
                    key={c}
                    onClick={() => setFilters(f => ({ ...f, colors: f.colors.filter(v => v !== c) }))}
                    className="flex items-center gap-1 text-xs border border-zinc-300 px-2.5 py-1 hover:border-black transition-colors"
                  >
                    {c}
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M1 11L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </button>
                ))}
                {filters.inStockOnly && (
                  <button
                    onClick={() => setFilters(f => ({ ...f, inStockOnly: false }))}
                    className="flex items-center gap-1 text-xs border border-zinc-300 px-2.5 py-1 hover:border-black transition-colors"
                  >
                    In stock
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M1 11L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </button>
                )}
                <button
                  onClick={clearAll}
                  className="text-xs underline text-zinc-500 hover:text-black transition-colors"
                >
                  Tout effacer
                </button>
              </div>
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-500 hidden md:block shrink-0">Trier par</label>
            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value); setPage(1) }}
              className="text-sm border border-zinc-300 px-3 py-2 focus:outline-none focus:border-black bg-white cursor-pointer"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Layout: filters + grid */}
        <div className="flex gap-10">
          {/* Desktop filters sidebar */}
          <div className="hidden lg:block w-56 xl:w-64 flex-shrink-0">
            <FilterDrawer
              isOpen={false}
              onClose={() => {}}
              filters={filters}
              onChange={(f) => { setFilters(f); setPage(1) }}
              totalCount={filtered.length}
            />
          </div>

          {/* Product grid + mobile filter drawer */}
          <div className="flex-1 min-w-0">
            {/* Mobile filter drawer */}
            <FilterDrawer
              isOpen={filterDrawerOpen}
              onClose={() => setFilterDrawerOpen(false)}
              filters={filters}
              onChange={(f) => { setFilters(f); setPage(1) }}
              totalCount={filtered.length}
            />

            {/* Product count - desktop */}
            <p className="hidden lg:block text-sm text-zinc-500 mb-5">{filtered.length} products</p>

            {loading ? (
              <div className="py-24 text-center text-sm text-zinc-400">Chargement des sacs…</div>
            ) : loadError ? (
              <div className="py-24 text-center text-sm text-red-600">{loadError}</div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center text-zinc-400">
                <p className="text-lg font-medium mb-2">Aucun produit trouvé</p>
                <button onClick={clearAll} className="text-sm underline hover:text-black transition-colors">
                  Effacer tous les filtres
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-5 md:gap-y-10">
                  {displayed.map(product => (
                    <CollectionProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Load more */}
                {hasMore && (
                  <div className="mt-12 text-center">
                    <button
                      onClick={() => setPage(p => p + 1)}
                      className="px-10 py-3.5 border-2 border-black text-sm font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                    >
                      Voir plus
                    </button>
                    <p className="mt-3 text-xs text-zinc-400">
                      {displayed.length} sur {filtered.length} produits
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile floating filter button */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        <button
          onClick={() => setFilterDrawerOpen(true)}
          className="flex items-center gap-2.5 bg-black text-white text-sm font-bold uppercase tracking-widest px-6 py-3.5 shadow-xl rounded-full"
        >
          <svg width="16" height="12" viewBox="0 0 20 14" fill="none">
            <path d="M1 2C0.448 2 0 2.448 0 3s.448 1 1 1h4V2H1zm8 8H1v2h8v-2zm10-8h-9v2h9V2zM7 0C6.448 0 6 .448 6 1v4c0 .552.448 1 1 1h2c.552 0 1-.448 1-1V1c0-.552-.448-1-1-1H7zm6 8c-.552 0-1 .448-1 1v4c0 .552.448 1 1 1h2c.552 0 1-.448 1-1V9c0-.552-.448-1-1-1h-2z" fill="currentColor" />
          </svg>
          Filtrer &amp; trier
          {activeFilterCount > 0 && (
            <span className="bg-white text-black text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <Footer />
    </div>
  )
}
