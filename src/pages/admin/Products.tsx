import { useEffect, useState, useCallback } from 'react'
import { api } from '../../lib/api'
import {
  Plus, Search, Pencil, Trash2, Loader2, Package, MoreHorizontal,
  ChevronLeft, ChevronRight, Eye, EyeOff,
} from 'lucide-react'
import ProductFormModal from '../../components/admin/ProductFormModal'
import { PageHeader } from '@/components/admin/page-header'
import { DataTable, type Column } from '@/components/admin/data-table'
import { Segmented } from '@/components/admin/segmented'
import { useConfirm } from '@/components/admin/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface ProductImage { url: string }
interface Product {
  id: string
  name: string
  slug: string
  price: number | string
  stock: number
  isActive: boolean
  isFeatured: boolean
  isNew: boolean
  isPreorder: boolean
  releaseDate: string | null
  sku: string | null
  images: ProductImage[]
  category: { name: string } | null
  /** Lien TikTok du produit, édité dans la modale. */
  tiktokUrl?: string | null
}

const FILTERS = [
  { id: 'all',      label: 'Tous' },
  { id: 'preorder', label: 'Précommandes' },
  { id: 'featured', label: 'Mis en avant' },
  { id: 'new',      label: 'Nouveaux' },
  { id: 'inactive', label: 'Inactifs' },
] as const

type FilterId = (typeof FILTERS)[number]['id']

/** Choix de densité du tableau : on lit 20 lignes par défaut. */
const PAGE_SIZES = [10, 20, 50] as const

interface PageData {
  items: Product[]
  meta: { total: number; page: number; totalPages: number }
}

export default function Products() {
  const [confirm, confirmDialog] = useConfirm()
  const [data, setData] = useState<PageData | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterId>('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<number>(20)
  const [loading, setLoading] = useState(true)
  const [editProduct, setEditProduct] = useState<Product | null | 'new'>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.set('search', search)
    if (filter === 'preorder') params.set('isPreorder', 'true')
    else if (filter === 'featured') params.set('isFeatured', 'true')
    else if (filter === 'new') params.set('isNew', 'true')
    else if (filter === 'inactive') params.set('isActive', 'false')
    api.get<PageData>(`/products?${params}`)
      .then(setData)
      .finally(() => setLoading(false))
  }, [page, limit, search, filter])

  useEffect(() => { load() }, [load])

  async function toggleActive(product: Product) {
    await api.patch(`/products/${product.id}`, { isActive: !product.isActive })
    load()
  }

  async function deleteProduct(p: Product) {
    const ok = await confirm({
      title: `Supprimer « ${p.name} » ?`,
      description: 'Le produit disparaît du catalogue et du site. Son historique de ventes est conservé.',
      confirmLabel: 'Supprimer',
      tone: 'danger',
    })
    if (!ok) return
    setDeleting(p.id)
    try {
      await api.delete(`/products/${p.id}`)
      load()
    } finally {
      setDeleting(null)
    }
  }

  const fmt = (n: number | string) => new Intl.NumberFormat('fr-FR').format(Number(n)) + ' FCFA'

  const columns: Column<Product>[] = [
    {
      key: 'product',
      header: 'Produit',
      label: 'Produit',
      sortBy: (p) => p.name,
      cell: (p) => (
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
            {p.images[0] ? (
              <img src={p.images[0].url} alt="" className="size-full object-cover" />
            ) : (
              <Package className="size-4 text-muted-foreground/40" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="max-w-60 truncate font-medium">{p.name}</p>
              {p.isPreorder && (
                <Badge variant="purple" className="px-1.5 py-0 text-[10px]">
                  Précommande{p.releaseDate ? ` · ${new Date(p.releaseDate).toLocaleDateString('fr-FR')}` : ''}
                </Badge>
              )}
              {p.isFeatured && <Badge variant="warning" className="px-1.5 py-0 text-[10px]">Mis en avant</Badge>}
              {p.isNew && <Badge variant="info" className="px-1.5 py-0 text-[10px]">Nouveau</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">
              {p.sku ? `SKU : ${p.sku}` : p.slug}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Catégorie',
      label: 'Catégorie',
      hideOnMobile: true,
      sortBy: (p) => p.category?.name ?? null,
      cell: (p) => p.category?.name ?? <span className="text-muted-foreground/40">—</span>,
    },
    {
      key: 'price',
      header: 'Prix',
      label: 'Prix',
      align: 'right',
      sortBy: (p) => Number(p.price),
      cell: (p) => <span className="font-medium tabular-nums">{fmt(p.price)}</span>,
    },
    {
      key: 'stock',
      header: 'Stock',
      label: 'Stock',
      align: 'right',
      hideOnMobile: true,
      sortBy: (p) => p.stock,
      cell: (p) => (
        <span className={cn('font-medium tabular-nums', p.stock <= 5 && 'text-destructive')}>
          {p.stock}
        </span>
      ),
    },
    {
      key: 'active',
      header: 'État',
      label: 'État',
      sortBy: (p) => (p.isActive ? 1 : 0),
      cell: (p) => (
        <Badge variant={p.isActive ? 'success' : 'secondary'} className="gap-1 px-2">
          <span
            className={cn('size-1.5 rounded-full', p.isActive ? 'bg-success' : 'bg-muted-foreground/50')}
            aria-hidden
          />
          {p.isActive ? 'En ligne' : 'Masqué'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      cell: (p) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              disabled={deleting === p.id}
              aria-label={`Actions sur « ${p.name} »`}
            >
              {deleting === p.id
                ? <Loader2 className="size-4 animate-spin" />
                : <MoreHorizontal className="size-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditProduct(p)}>
              <Pencil className="size-3.5" /> Modifier
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toggleActive(p)}>
              {p.isActive
                ? <><EyeOff className="size-3.5" /> Retirer du site</>
                : <><Eye className="size-3.5" /> Publier sur le site</>}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              data-variant="destructive"
              onSelect={() => deleteProduct(p)}
            >
              <Trash2 className="size-3.5" /> Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const total = data?.meta.total ?? 0
  const shownCount = data?.items.length ?? 0
  const first = shownCount === 0 ? 0 : (page - 1) * limit + 1
  const last = shownCount === 0 ? 0 : first + shownCount - 1

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Produits"
        description={`${data?.meta.total ?? '—'} produit(s) au total`}
        actions={
          <Button className="h-8" onClick={() => setEditProduct('new')}>
            <Plus className="size-4" /> Nouveau produit
          </Button>
        }
      />

      <DataTable
        rows={data?.items ?? []}
        columns={columns}
        getRowId={(p) => p.id}
        loading={loading}
        columnsToggle
        toolbar={
          <>
            <Segmented
              value={filter}
              options={FILTERS}
              onChange={(id) => { setFilter(id); setPage(1) }}
              ariaLabel="Filtrer les produits"
            />
            <div className="relative w-full max-w-56">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher un produit…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="ps-8"
                aria-label="Rechercher un produit"
              />
            </div>
          </>
        }
        pagination={
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hidden sm:inline">Lignes par page</span>
              <Select
                value={String(limit)}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}
                className="w-auto"
                aria-label="Lignes par page"
              >
                {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm tabular-nums text-muted-foreground">
                {first} – {last} sur {total}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                aria-label="Page précédente"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={!data || page >= data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Page suivante"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </>
        }
        empty={{
          icon: Package,
          title: 'Aucun produit trouvé',
          description: search || filter !== 'all'
            ? 'Aucun produit ne correspond à cette recherche.'
            : 'Créez votre premier produit avec le bouton en haut à droite.',
        }}
      />

      {editProduct && (
        <ProductFormModal
          product={editProduct === 'new' ? null : editProduct}
          onClose={() => setEditProduct(null)}
          onSaved={() => { setEditProduct(null); load() }}
        />
      )}

      {confirmDialog}
    </div>
  )
}
