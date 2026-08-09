import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCategories, childCategories, type StoreCategory } from '../../lib/storefront'

interface Props {
  title: string
  description: string
  totalCount: number
  /**
   * Slug de la catégorie racine dont on affiche les sous-catégories sous le titre.
   * Elles viennent de /admin/categories — aucune n'est codée en dur.
   */
  parentSlug?: string
}

export default function CollectionBanner({ title, description, totalCount, parentSlug }: Props) {
  const [subCategories, setSubCategories] = useState<StoreCategory[]>([])

  useEffect(() => {
    if (!parentSlug) return
    fetchCategories()
      .then(cats => setSubCategories(childCategories(cats, parentSlug)))
      .catch(() => setSubCategories([]))
  }, [parentSlug])

  return (
    <div style={{ backgroundColor: '#f1f1f1' }}>
      {/* Breadcrumbs */}
      <div className="max-w-[1600px] mx-auto px-5 md:px-12 pt-6 pb-0">
        <nav aria-label="Breadcrumbs" className="text-xs text-zinc-500 flex items-center gap-1.5">
          <Link to="/" className="hover:text-black transition-colors">Accueil</Link>
          <span>/</span>
          <span className="text-black font-medium">{title}</span>
        </nav>
      </div>

      {/* Title */}
      <div className="max-w-[1600px] mx-auto px-5 md:px-12 py-8 text-center">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-zinc-900 mb-2">
          {title}
        </h1>
        <p className="text-sm text-zinc-500">{description}</p>
      </div>

      {/* Sous-catégories réelles — masquées s'il n'y en a aucune en base */}
      {subCategories.length > 0 && (
        <div className="border-t border-zinc-300">
          <div className="max-w-[1600px] mx-auto px-5 md:px-12">
            <div className="flex items-center justify-center gap-0 overflow-x-auto scrollbar-hide">
              {subCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/products?category=${encodeURIComponent(cat.slug)}`}
                  className="text-xs font-bold tracking-widest uppercase text-zinc-600 hover:text-black px-4 md:px-6 py-3.5 border-b-2 border-transparent hover:border-black transition-all whitespace-nowrap"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile product count */}
      <div className="md:hidden border-t border-zinc-300 px-5 py-2.5 text-center text-sm text-zinc-500">
        {totalCount} produit{totalCount > 1 ? 's' : ''}
      </div>
    </div>
  )
}
