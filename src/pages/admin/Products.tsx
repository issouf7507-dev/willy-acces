import { useEffect, useState, useCallback } from 'react'
import { api } from '../../lib/api'
import { Plus, Search, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, Package } from 'lucide-react'
import ProductFormModal from '../../components/admin/ProductFormModal'

interface ProductImage { url: string }
interface Product {
  id: string
  name: string
  slug: string
  price: number | string
  stock: number
  isActive: boolean
  isFeatured: boolean
  sku: string | null
  images: ProductImage[]
  category: { name: string } | null
}

interface PageData {
  items: Product[]
  meta: { total: number; page: number; totalPages: number }
}

export default function Products() {
  const [data, setData] = useState<PageData | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [editProduct, setEditProduct] = useState<Product | null | 'new'>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    api.get<PageData>(`/products?${params}`)
      .then(setData)
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => { load() }, [load])

  async function toggleActive(product: Product) {
    await api.patch(`/products/${product.id}`, { isActive: !product.isActive })
    load()
  }

  async function deleteProduct(id: string) {
    if (!confirm('Supprimer ce produit ?')) return
    setDeleting(id)
    try {
      await api.delete(`/products/${id}`)
      load()
    } finally {
      setDeleting(null)
    }
  }

  const fmt = (n: number | string) => new Intl.NumberFormat('fr-FR').format(Number(n)) + ' FCFA'

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produits</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.meta.total ?? '—'} produit(s) au total</p>
        </div>
        <button
          onClick={() => setEditProduct('new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nouveau produit
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un produit…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
            <Package className="w-8 h-8" />
            <p className="text-sm">Aucun produit trouvé</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Produit</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Catégorie</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prix</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Stock</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.items.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                            {p.images[0] ? (
                              <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-gray-300 m-auto mt-2.5" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 line-clamp-1">{p.name}</p>
                            {p.sku && <p className="text-xs text-gray-400">SKU : {p.sku}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                        {p.category?.name ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{fmt(p.price)}</td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        <span className={`font-medium ${p.stock <= 5 ? 'text-red-600' : 'text-gray-900'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleActive(p)} className="text-gray-400 hover:text-gray-700 transition-colors">
                          {p.isActive
                            ? <ToggleRight className="w-5 h-5 text-green-600" />
                            : <ToggleLeft className="w-5 h-5" />
                          }
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditProduct(p)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProduct(p.id)}
                            disabled={deleting === p.id}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            {deleting === p.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Page {data.meta.page} / {data.meta.totalPages}
                </p>
                <div className="flex gap-1">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >Précédent</button>
                  <button
                    disabled={page >= data.meta.totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >Suivant</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {editProduct && (
        <ProductFormModal
          product={editProduct === 'new' ? null : editProduct}
          onClose={() => setEditProduct(null)}
          onSaved={() => { setEditProduct(null); load() }}
        />
      )}
    </div>
  )
}
