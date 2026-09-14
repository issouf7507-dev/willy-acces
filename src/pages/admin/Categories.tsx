import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../../lib/api'
import { useEdgeStore } from '../../lib/edgestore'
import {
  Plus, Pencil, Trash2, Loader2, Tag, ImagePlus, Upload, Search, X, MoreHorizontal,
} from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { DataTable, type Column } from '@/components/admin/data-table'
import { Segmented } from '@/components/admin/segmented'
import { useConfirm } from '@/components/admin/confirm-dialog'
import { ErrorState } from '@/components/admin/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, Input, Label, Select } from '@/components/ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface Category {
  id: string; name: string; slug: string; isActive: boolean; parentId: string | null
  imageUrl: string | null
  _count: { products: number }; children: Category[]
}

interface FormState {
  name: string
  isActive: boolean
  /** '' = catégorie de premier niveau. */
  parentId: string
  /** '' = pas d'image ; affichée sur les cartes de catégorie de la page d'accueil. */
  imageUrl: string
}

/** Une ligne du tableau : la catégorie, et si c'est une sous-catégorie. */
interface Row { cat: Category; nested: boolean }

const FILTERS = [
  { id: 'all',      label: 'Toutes' },
  { id: 'active',   label: 'Actives' },
  { id: 'inactive', label: 'Inactives' },
] as const

type FilterId = (typeof FILTERS)[number]['id']

export default function Categories() {
  const [confirmDelete, confirmDialog] = useConfirm()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Category | null | 'new'>(null)
  const [form, setForm] = useState<FormState>({ name: '', isActive: true, parentId: '', imageUrl: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [listError, setListError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterId>('all')
  const fileRef = useRef<HTMLInputElement>(null)
  const { edgestore } = useEdgeStore()

  async function uploadImage(file: File) {
    setUploading(true); setError('')
    try {
      const res = await edgestore.publicImages.upload({ file })
      setForm((f) => ({ ...f, imageUrl: res.url }))
    } catch {
      setError("Échec du téléchargement de l'image")
    } finally {
      setUploading(false)
    }
  }

  const load = () => {
    setLoading(true)
    api.get<Category[]>('/categories?all=true')
      .then(setCategories)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // L'API renvoie tous les niveaux à plat : on regroupe pour l'affichage.
  const roots = categories.filter(c => !c.parentId)
  const childrenOf = (id: string) => categories.filter(c => c.parentId === id)

  // Une sous-catégorie suit immédiatement sa parente : le tableau reste une
  // hiérarchie, même à plat. C'est pourquoi aucune colonne n'est triable — un
  // tri disperserait les enfants loin de leur parent.
  const rows = useMemo<Row[]>(() => {
    const q = search.trim().toLowerCase()
    const keep = (c: Category) =>
      (filter === 'all' || (filter === 'active') === c.isActive) &&
      (!q || c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q))

    return categories
      .filter(c => !c.parentId)
      .flatMap((cat) => [
        ...(keep(cat) ? [{ cat, nested: false }] : []),
        ...childrenOf(cat.id).filter(keep).map((child) => ({ cat: child, nested: true })),
      ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, search, filter])

  function openNew() {
    setForm({ name: '', isActive: true, parentId: '', imageUrl: '' })
    setEditing('new'); setError('')
  }
  function openEdit(c: Category) {
    setForm({ name: c.name, isActive: c.isActive, parentId: c.parentId ?? '', imageUrl: c.imageUrl ?? '' })
    setEditing(c); setError('')
  }

  async function save() {
    if (!form.name.trim()) { setError('Le nom est requis'); return }
    setSaving(true); setError('')
    try {
      // parentId '' => null côté API, ce qui remonte la catégorie au premier niveau.
      const payload = {
        name: form.name,
        isActive: form.isActive,
        parentId: form.parentId || null,
        // '' plutôt que null : le champ reste optionnel côté API, et une chaîne
        // vide est traitée comme « pas d'image » partout côté vitrine.
        imageUrl: form.imageUrl.trim(),
      }
      if (editing === 'new') {
        await api.post('/categories', payload)
      } else if (editing) {
        await api.patch(`/categories/${editing.id}`, payload)
      }
      setEditing(null); load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function remove(cat: Category) {
    const ok = await confirmDelete({
      title: `Supprimer « ${cat.name} » ?`,
      description: cat._count.products > 0
        ? `${cat._count.products} produit(s) y sont rattachés : l'API refusera la suppression tant qu'ils y sont.`
        : 'La catégorie disparaît du site. Les produits ne sont pas supprimés.',
      confirmLabel: 'Supprimer',
      tone: 'danger',
    })
    if (!ok) return
    setListError('')
    await api.delete(`/categories/${cat.id}`).catch((e) => setListError(e.message))
    load()
  }

  /** Ce qu'on ajoute sous le nom, quand il y a quelque chose à ajouter. */
  function subtitle(cat: Category, nested: boolean): string | null {
    if (nested) {
      const parent = categories.find((c) => c.id === cat.parentId)
      return parent ? `Sous-catégorie de ${parent.name}` : 'Sous-catégorie'
    }
    const n = childrenOf(cat.id).length
    return n > 0 ? `${n} sous-catégorie(s)` : null
  }

  const columns: Column<Row>[] = [
    {
      key: 'category',
      header: 'Catégorie',
      label: 'Catégorie',
      cell: ({ cat, nested }) => (
        <div className={cn('flex items-center gap-3', nested && 'ps-6')}>
          {nested && (
            <span className="-me-1 select-none text-muted-foreground/40" aria-hidden>└</span>
          )}
          <div
            className={cn(
              'flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted',
              nested ? 'size-8' : 'size-10',
            )}
          >
            {cat.imageUrl
              ? <img src={cat.imageUrl} alt="" className="size-full object-cover" />
              : <Tag className={cn('text-muted-foreground/40', nested ? 'size-3.5' : 'size-4')} />}
          </div>
          <div className="min-w-0">
            <p className={cn('max-w-60 truncate', nested ? 'text-foreground' : 'font-medium')}>
              {cat.name}
            </p>
            {/* Pas de seconde ligne quand il n'y a rien à en dire : une
                catégorie sans enfant tient sur une ligne. */}
            {subtitle(cat, nested) && (
              <p className="text-xs text-muted-foreground">{subtitle(cat, nested)}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'slug',
      header: 'Slug',
      label: 'Slug',
      hideOnMobile: true,
      cell: ({ cat }) => <span className="text-muted-foreground">/{cat.slug}</span>,
    },
    {
      key: 'products',
      header: 'Produits',
      label: 'Produits',
      align: 'right',
      cell: ({ cat }) => (
        <span className={cn('font-medium tabular-nums', cat._count.products === 0 && 'text-muted-foreground/40')}>
          {cat._count.products}
        </span>
      ),
    },
    {
      key: 'state',
      header: 'État',
      label: 'État',
      cell: ({ cat }) => (
        <Badge variant={cat.isActive ? 'success' : 'secondary'} className="gap-1 px-2">
          <span
            className={cn('size-1.5 rounded-full', cat.isActive ? 'bg-success' : 'bg-muted-foreground/50')}
            aria-hidden
          />
          {cat.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      cell: ({ cat }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label={`Actions sur « ${cat.name} »`}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => openEdit(cat)}>
              <Pencil className="size-3.5" /> Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem data-variant="destructive" onSelect={() => remove(cat)}>
              <Trash2 className="size-3.5" /> Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Catégories"
        description={`${categories.length} catégorie(s) · ${roots.length} principale(s)`}
        actions={
          <Button className="h-8" onClick={openNew}>
            <Plus className="size-4" /> Nouvelle catégorie
          </Button>
        }
      />

      {listError && <ErrorState message={listError} />}

      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(r) => r.cat.id}
        loading={loading}
        columnsToggle
        toolbar={
          <>
            <Segmented
              value={filter}
              options={FILTERS}
              onChange={setFilter}
              ariaLabel="Filtrer les catégories"
            />
            <div className="relative w-full max-w-56">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher une catégorie…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-8"
                aria-label="Rechercher une catégorie"
              />
            </div>
          </>
        }
        pagination={
          <span className="text-sm tabular-nums text-muted-foreground">
            {rows.length} ligne(s) affichée(s)
          </span>
        }
        empty={{
          icon: Tag,
          title: 'Aucune catégorie',
          description: search || filter !== 'all'
            ? 'Aucune catégorie ne correspond à ce filtre.'
            : 'Créez votre première catégorie avec le bouton en haut à droite.',
        }}
      />

      {/* Inline modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h2 className="font-heading font-semibold text-foreground">
                {editing === 'new' ? 'Nouvelle catégorie' : 'Modifier la catégorie'}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setEditing(null)}
                aria-label="Fermer"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <Field label="Nom *" htmlFor="cat-name">
                <Input
                  id="cat-name"
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nom de la catégorie"
                />
              </Field>

              <Field
                label="Image"
                description="Affichée sur la carte de la catégorie sur la page d'accueil."
              >
                {form.imageUrl ? (
                  <div className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted">
                    <img src={form.imageUrl} alt="" className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Retirer l'image"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => !uploading && fileRef.current?.click()}
                    className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border transition-colors hover:border-ring/40 hover:bg-accent"
                  >
                    {uploading ? (
                      <><Upload className="size-7 animate-bounce text-muted-foreground" /><span className="text-sm text-muted-foreground">Téléchargement…</span></>
                    ) : (
                      <><ImagePlus className="size-7 text-muted-foreground" /><span className="text-sm text-muted-foreground">Cliquez pour uploader une image</span></>
                    )}
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f?.type.startsWith('image/')) uploadImage(f); e.target.value = '' }}
                />
                <Input
                  value={form.imageUrl}
                  onChange={(e) => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  className="text-xs text-muted-foreground"
                  placeholder="…ou coller une URL d'image"
                />
              </Field>

              <Field
                label="Catégorie parente"
                htmlFor="cat-parent"
                description="Une sous-catégorie devient un onglet de la page de sa catégorie parente."
              >
                <Select
                  id="cat-parent"
                  value={form.parentId}
                  onChange={(e) => setForm(f => ({ ...f, parentId: e.target.value }))}
                >
                  <option value="">Aucune (catégorie principale)</option>
                  {roots
                    .filter(r => editing === 'new' || r.id !== editing?.id)
                    .map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </Select>
              </Field>

              <Label className="cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="size-4 rounded accent-primary"
                />
                Catégorie active
              </Label>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
              <Button variant="outline" className="h-8" onClick={() => setEditing(null)}>
                Annuler
              </Button>
              <Button className="h-8" onClick={save} disabled={saving || uploading}>
                {saving && <Loader2 className="size-3.5 animate-spin" />}
                {editing === 'new' ? 'Créer' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmDialog}
    </div>
  )
}
