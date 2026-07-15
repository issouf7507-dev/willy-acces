import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AnnouncementBar from '../components/AnnouncementBar'
import Header from '../components/Header'
import Footer from '../components/Footer'
import CollectionProductCard from '../components/collection/CollectionProductCard'
import { SORT_OPTIONS, type BagProduct } from '../data/bags'
import {
  fetchCatalog,
  fetchCategories,
  rootCategories,
  categorySlugsWithDescendants,
  countInCategory,
  type StoreCategory,
} from '../lib/storefront'
import { formatPrice } from '../lib/utils'

const PAGE_SIZE = 12

interface CategoryTab {
  id: string
  label: string
  count: number
}

function Stars({ rating }: { rating: number }) {
  const n = Math.round(rating)
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width="9" height="9" viewBox="0 0 15 15" className={i < n ? 'text-zinc-800' : 'text-zinc-200'} fill="currentColor">
          <path d="M7.5 0L9.586 5.273L15 5.73L10.875 9.445L12.135 15L7.5 12.023L2.865 15L4.125 9.445L0 5.73L5.414 5.273L7.5 0Z" />
        </svg>
      ))}
    </div>
  )
}

function BestSellersStrip({ products }: { products: BagProduct[] }) {
  const top = useMemo(() => [...products].sort((a, b) => b.reviews - a.reviews).slice(0, 4), [products])
  if (top.length === 0) return null
  return (
    <section className="border-b border-zinc-100">
      <div className="max-w-[1600px] mx-auto px-5 md:px-12 py-10">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-xl font-black uppercase tracking-tight">Meilleures ventes</h2>
          <Link to="/collections/bags" className="text-xs font-bold uppercase tracking-wide text-zinc-500 hover:text-black transition-colors underline underline-offset-2">
            Voir tout
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {top.map(p => (
            <Link key={p.id} to={`/products/${p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`} className="group">
              <div className={`aspect-square bg-gradient-to-br ${p.gradientFrom} ${p.gradientTo} mb-3 overflow-hidden flex items-center justify-center`}>
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="0.6" opacity="0.2" className="transition-transform duration-500 group-hover:scale-110">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
                </svg>
              </div>
              <p className="text-xs font-bold uppercase tracking-wide truncate group-hover:underline">{p.name}</p>
              <div className="flex items-center justify-between mt-0.5">
                <Stars rating={p.rating} />
                <span className="text-xs text-zinc-500">{formatPrice(p.price)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Products() {
  const [products, setProducts] = useState<BagProduct[]>([])
  const [categories, setCategories] = useState<StoreCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  // `|| 'all'` et pas `??` : un `?category=` vide doit retomber sur "Tous".
  const activeCategory = searchParams.get('category') || 'all'
  const [sortBy, setSortBy] = useState('featured')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    Promise.all([fetchCatalog(), fetchCategories()])
      .then(([prods, cats]) => { setProducts(prods); setCategories(cats) })
      .catch(() => setError('Impossible de charger les produits.'))
      .finally(() => setLoading(false))
  }, [])

  // Onglets = catégories racines du back-office (on masque celles sans produit).
  // Le compte inclut les sous-catégories, sinon « Accessoires » afficherait 1
  // alors que ses 17 produits vivent dans ses enfants.
  const CATEGORIES: CategoryTab[] = useMemo(() => {
    const tabs = rootCategories(categories)
      .map(c => ({
        id: c.slug,
        label: c.name,
        count: countInCategory(categories, c.slug, products),
      }))
      .filter(c => c.count > 0)
    return [{ id: 'all', label: 'Tous', count: products.length }, ...tabs]
  }, [categories, products])

  const filtered = useMemo(() => {
    // Filtrer sur une racine doit ramener aussi les produits de ses enfants.
    let result = products
    if (activeCategory !== 'all') {
      const covered = new Set(categorySlugsWithDescendants(categories, activeCategory))
      result = products.filter(p => p.categorySlug && covered.has(p.categorySlug))
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      )
    }

    switch (sortBy) {
      case 'price-asc':  result = [...result].sort((a, b) => a.price - b.price); break
      case 'price-desc': result = [...result].sort((a, b) => b.price - a.price); break
      case 'rating':     result = [...result].sort((a, b) => b.rating - a.rating); break
      case 'reviews':    result = [...result].sort((a, b) => b.reviews - a.reviews); break
    }
    return result
  }, [products, categories, activeCategory, sortBy, search])

  const displayed = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = displayed.length < filtered.length

  const handleCategoryChange = (id: string) => {
    setSearchParams(id === 'all' ? {} : { category: id }, { replace: true })
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-white">
      <AnnouncementBar />
      <Header />

      {/* Hero */}
      <section className="bg-black text-white overflow-hidden relative">
        <div className="max-w-[1600px] mx-auto px-5 md:px-12 py-16 md:py-24">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-400 mb-4">Boutique</p>
          <h1 className="text-5xl md:text-7xl font-black uppercase leading-none mb-4">
            Tous les<br />
            <span className="text-zinc-400">produits</span>
          </h1>
          <p className="text-sm text-zinc-400 max-w-sm mt-6">
            {products.length} articles — sacs, slings, messagers et accessoires pour le quotidien.
          </p>
        </div>
        {/* Decorative gradient circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-zinc-800 rounded-full blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-zinc-700 rounded-full blur-3xl opacity-30 translate-y-1/2 pointer-events-none" />
      </section>

      {/* Best sellers strip */}
      <BestSellersStrip products={products} />

      {/* Main catalog */}
      <section className="max-w-[1600px] mx-auto px-5 md:px-12 py-10">

        {/* Search + Sort row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <svg width="16" height="16" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
              <circle cx="11" cy="10" r="7" /><path d="m16 15 3 3" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher un produit…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-zinc-200 focus:border-black focus:outline-none bg-zinc-50 focus:bg-white transition-colors"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setPage(1) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M1 11L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs text-zinc-400 hidden sm:block">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value); setPage(1) }}
              className="text-sm border border-zinc-200 px-3 py-2.5 focus:outline-none focus:border-black bg-white cursor-pointer"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-0 mb-8 overflow-x-auto scrollbar-hide border-b border-zinc-100">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`flex-shrink-0 px-4 py-3 text-xs font-bold uppercase tracking-wide transition-all border-b-2 -mb-px ${
                activeCategory === cat.id
                  ? 'border-black text-black'
                  : 'border-transparent text-zinc-400 hover:text-black hover:border-zinc-300'
              }`}
            >
              {cat.label}
              <span className={`ml-1.5 text-[10px] ${activeCategory === cat.id ? 'text-zinc-500' : 'text-zinc-300'}`}>
                {cat.id === 'all' ? products.length : cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="py-24 text-center text-sm text-zinc-400">Chargement des produits…</div>
        ) : error ? (
          <div className="py-24 text-center text-sm text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
                <circle cx="11" cy="10" r="7" /><path d="m16 15 3 3" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-zinc-400 font-medium mb-2">Aucun produit trouvé</p>
            <button
              onClick={() => { setSearch(''); handleCategoryChange('all') }}
              className="text-xs font-bold uppercase tracking-wide underline text-zinc-500 hover:text-black transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-12">
              {displayed.map(product => (
                <CollectionProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="mt-14 flex flex-col items-center gap-3">
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="px-12 py-4 border-2 border-black text-sm font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                >
                  Voir plus
                </button>
                <p className="text-xs text-zinc-400">
                  {displayed.length} / {filtered.length} produits
                </p>
              </div>
            )}
          </>
        )}
      </section>

      {/* Bottom banner */}
      <section className="bg-zinc-50 border-t border-zinc-100">
        <div className="max-w-[1600px] mx-auto px-5 md:px-12 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1">Besoin d'aide ?</p>
            <h3 className="text-2xl font-black uppercase">Trouvez votre sac idéal</h3>
          </div>
          <Link
            to="/collections/bags"
            className="flex-shrink-0 px-8 py-4 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
          >
            Explorer la collection
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
