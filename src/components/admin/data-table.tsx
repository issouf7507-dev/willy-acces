import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown, Columns3, Search } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CardShell } from './stat-card'
import { EmptyState, LoadingState } from './empty-state'
import { cn } from '@/lib/utils'

export interface Column<T> {
  /** Identifiant de colonne, unique dans le tableau. */
  key: string
  header: React.ReactNode
  /** Contenu de la cellule. */
  cell: (row: T) => React.ReactNode
  align?: 'left' | 'right' | 'center'
  /**
   * Valeur servant au tri. Son absence rend la colonne non triable : une
   * colonne d'icônes ou d'actions n'a rien à trier.
   */
  sortBy?: (row: T) => string | number | null
  /**
   * Intitulé en clair. Seules les colonnes qui en ont un peuvent être masquées
   * depuis le menu « Colonnes » : une colonne d'actions n'a pas à en sortir.
   */
  label?: string
  /** Masquée sous `sm`, pour que le tableau reste lisible au téléphone. */
  hideOnMobile?: boolean
  className?: string
}

interface DataTableProps<T> {
  rows: T[]
  columns: Column<T>[]
  getRowId: (row: T) => string
  loading?: boolean
  onRowClick?: (row: T) => void
  /** Affiche un champ de filtre. Le texte est cherché dans ces valeurs. */
  searchIn?: (row: T) => (string | null | undefined)[]
  searchPlaceholder?: string
  /** Titre de la carte. Sans lui, le tableau commence à sa barre d'outils. */
  title?: React.ReactNode
  /** Contrôles de la barre d'outils : onglets, filtres, période. */
  toolbar?: React.ReactNode
  /** Menu « Colonnes », pour masquer ce dont on n'a pas besoin. */
  columnsToggle?: boolean
  /** Pied de carte : nombre de lignes, pagination. */
  pagination?: React.ReactNode
  /** Ligne de totaux, rendue dans le pied du tableau. */
  footer?: React.ReactNode
  empty?: { icon?: React.ElementType; title: string; description?: React.ReactNode }
  className?: string
}

type SortState = { key: string; dir: 'asc' | 'desc' } | null

/**
 * Tableau de données du back-office : filtre, tri et états vides au même
 * endroit, au lieu d'être réécrits à chaque écran.
 *
 * Le tri et le filtre travaillent sur les lignes **déjà chargées** : c'est un
 * confort de lecture, pas une pagination serveur. Les écrans qui affichent
 * beaucoup de lignes gardent leurs propres filtres côté API.
 */
function DataTable<T>({
  rows, columns, getRowId, loading, onRowClick, searchIn, searchPlaceholder,
  title, toolbar, columnsToggle, pagination, footer, empty, className,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortState>(null)
  const [hidden, setHidden] = useState<string[]>([])

  const shown = useMemo(
    () => columns.filter((c) => !hidden.includes(c.key)),
    [columns, hidden],
  )

  const filtered = useMemo(() => {
    if (!searchIn || !query.trim()) return rows
    const q = query.trim().toLowerCase()
    return rows.filter((row) =>
      searchIn(row).some((v) => v?.toLowerCase().includes(q)),
    )
  }, [rows, query, searchIn])

  const sorted = useMemo(() => {
    if (!sort) return filtered
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortBy) return filtered

    const sign = sort.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const va = col.sortBy!(a)
      const vb = col.sortBy!(b)
      // Les valeurs absentes tombent en fin de liste, quel que soit le sens :
      // un trou n'est ni le plus grand ni le plus petit, il n'a pas de rang.
      if (va === null || va === undefined) return 1
      if (vb === null || vb === undefined) return -1
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * sign
      return String(va).localeCompare(String(vb), 'fr') * sign
    })
  }, [filtered, sort, columns])

  function toggleSort(col: Column<T>) {
    if (!col.sortBy) return
    setSort((cur) =>
      cur?.key !== col.key
        ? { key: col.key, dir: 'asc' }
        : cur.dir === 'asc'
          ? { key: col.key, dir: 'desc' }
          : null,
    )
  }

  const hideable = columns.filter((c) => c.label)
  const hasToolbar = Boolean(searchIn || toolbar || (columnsToggle && hideable.length > 0))

  return (
    <CardShell title={title} className={className} contentClassName="p-0">
      {hasToolbar && (
        <div className="flex min-h-14 flex-wrap items-center gap-2 border-b border-border px-(--card-spacing) py-3">
          {/* Les onglets et filtres d'abord, la recherche ensuite : même ordre
              de lecture sur tous les écrans, qu'ils cherchent côté serveur ou
              dans les lignes déjà chargées. */}
          {toolbar}

          {searchIn && (
            <div className="relative w-full max-w-56">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder ?? 'Rechercher…'}
                className="ps-8"
              />
            </div>
          )}

          {columnsToggle && hideable.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ms-auto h-8">
                  <Columns3 className="size-3.5" />
                  <span className="hidden sm:inline">Colonnes</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Colonnes affichées</DropdownMenuLabel>
                {hideable.map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.key}
                    checked={!hidden.includes(col.key)}
                    onCheckedChange={(on) =>
                      setHidden((cur) =>
                        on ? cur.filter((k) => k !== col.key) : [...cur, col.key],
                      )
                    }
                  >
                    {col.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={empty?.icon}
          title={
            query.trim() && rows.length > 0
              ? `Aucun résultat pour « ${query.trim()} »`
              : empty?.title ?? 'Rien à afficher'
          }
          description={query.trim() && rows.length > 0 ? undefined : empty?.description}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {shown.map((col) => {
                const active = sort?.key === col.key
                return (
                  <TableHead
                    key={col.key}
                    data-align={col.align}
                    className={cn(col.hideOnMobile && 'hidden sm:table-cell', col.className)}
                  >
                    {col.sortBy ? (
                      // Bouton fantôme décalé vers la gauche : l'intitulé reste
                      // aligné sur la colonne, la zone cliquable déborde.
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort(col)}
                        className={cn(
                          '-ms-2.5 h-7 text-[0.8rem] font-medium',
                          active ? 'text-foreground' : 'text-muted-foreground',
                          // À droite, le bouton déborde de l'autre côté : la
                          // flèche reste collée à l'intitulé, jamais à la
                          // colonne voisine.
                          col.align === 'right' && 'ms-0 -me-2.5',
                        )}
                      >
                        {col.header}
                        {!active ? (
                          <ChevronsUpDown className="size-3.5 opacity-50" />
                        ) : sort.dir === 'asc' ? (
                          <ArrowUp className="size-3.5" />
                        ) : (
                          <ArrowDown className="size-3.5" />
                        )}
                      </Button>
                    ) : (
                      col.header
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>

          <TableBody>
            {sorted.map((row) => (
              <TableRow
                key={getRowId(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? 'cursor-pointer' : undefined}
              >
                {shown.map((col) => (
                  <TableCell
                    key={col.key}
                    data-align={col.align}
                    className={cn(col.hideOnMobile && 'hidden sm:table-cell', col.className)}
                  >
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>

          {footer && <TableFooter>{footer}</TableFooter>}
        </Table>
      )}

      {pagination && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-(--card-spacing) py-3">
          {pagination}
        </div>
      )}
    </CardShell>
  )
}

export { DataTable }
