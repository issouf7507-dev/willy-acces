import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronRight, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NavItemData {
  id: string
  title: string
  icon: React.ElementType
  /** Absent pour un parent : il ne mène nulle part, il ouvre ses enfants. */
  to?: string
  exact?: boolean
  /** Rôles voyant l'entrée. Absent = tout le personnel du back-office. */
  roles?: readonly string[]
  /** Compteur à droite. Rien ne s'affiche sans valeur réelle à mettre dedans. */
  badge?: number | string
  children?: NavItemData[]
}

export interface NavGroupData {
  heading?: string
  items: NavItemData[]
}

const OPEN_KEY = 'admin_nav_open'

function loadOpen(): string[] {
  try {
    const raw = localStorage.getItem(OPEN_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

/** Une entrée n'est visible que si le rôle courant y a droit. */
function visible(item: NavItemData, role?: string): boolean {
  if (item.roles && !(role && item.roles.includes(role))) return false
  if (!item.children) return true
  // Un parent dont tous les enfants sont filtrés n'a plus de raison d'être.
  return item.children.some((c) => visible(c, role))
}

function matches(item: NavItemData, pathname: string): boolean {
  if (item.to) {
    return item.exact ? pathname === item.to : pathname.startsWith(item.to)
  }
  return item.children?.some((c) => matches(c, pathname)) ?? false
}

function NavItem({
  item, role, level = 0, open, onToggle, onNavigate,
}: {
  item: NavItemData
  role?: string
  level?: number
  open: string[]
  onToggle: (id: string) => void
  onNavigate: () => void
}) {
  const { pathname } = useLocation()
  const children = item.children?.filter((c) => visible(c, role)) ?? []
  const hasChildren = children.length > 0

  // Un parent qui contient la page ouverte reste déplié : sinon l'écran
  // courant devient invisible dans le menu.
  const holdsCurrent = matches(item, pathname)
  const isOpen = hasChildren && (open.includes(item.id) || holdsCurrent)

  const row = (active: boolean) => (
    <>
      <div className="flex min-w-0 items-center gap-2.5">
        <item.icon
          className={cn(
            'h-4 w-4 shrink-0 transition-colors',
            active ? 'text-foreground' : 'text-muted-foreground/70 group-hover:text-foreground/70',
          )}
          strokeWidth={1.5}
        />
        <span className="truncate text-[13px] tracking-wide">{item.title}</span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {item.badge !== undefined && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
            {item.badge}
          </span>
        )}
        {hasChildren && (
          <ChevronRight
            className={cn(
              'h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-200',
              isOpen && 'rotate-90',
            )}
            strokeWidth={2}
          />
        )}
      </div>
    </>
  )

  const rowClass =
    'group flex select-none items-center justify-between rounded-[6px] px-2.5 py-[7px] transition-colors ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring'

  return (
    <div className="flex w-full flex-col">
      {hasChildren ? (
        <button
          type="button"
          onClick={() => onToggle(item.id)}
          aria-expanded={isOpen}
          style={{ paddingLeft: `${level * 12 + 10}px` }}
          className={cn(
            rowClass,
            'w-full cursor-pointer',
            holdsCurrent
              ? 'text-foreground'
              : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground/90',
          )}
        >
          {row(holdsCurrent)}
        </button>
      ) : (
        <NavLink
          to={item.to!}
          end={item.exact}
          onClick={onNavigate}
          style={{ paddingLeft: `${level * 12 + 10}px` }}
          className={({ isActive }) =>
            cn(
              rowClass,
              isActive
                ? 'bg-foreground/10 font-medium text-foreground'
                : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground/90',
            )
          }
        >
          {({ isActive }) => row(isActive)}
        </NavLink>
      )}

      {hasChildren && (
        // Grille 0fr → 1fr : l'ouverture s'anime sans hauteur codée en dur,
        // donc quel que soit le nombre d'enfants.
        <div
          className={cn(
            'grid transition-[grid-template-rows,opacity] duration-300 ease-in-out',
            isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="relative mt-0.5 flex min-h-0 flex-col gap-0.5 overflow-hidden">
            {/* Ligne de guidage : elle rattache visuellement les enfants au parent. */}
            <div
              className="absolute bottom-0 top-0 border-l border-foreground/10"
              style={{ left: `${level * 12 + 17.5}px` }}
              aria-hidden
            />
            {children.map((child) => (
              <NavItem
                key={child.id}
                item={child}
                role={role}
                level={level + 1}
                open={open}
                onToggle={onToggle}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Navigation du back-office.
 *
 * Les rubriques peu fréquentées (catalogue, contenu, salon) sont repliées sous
 * un parent : les 28 entrées à plat noyaient celles qu'on ouvre tous les jours.
 * L'état d'ouverture est mémorisé d'une visite à l'autre.
 */
export function SidebarNav({
  groups, bottom, role, header, onNavigate, onLogout, className,
}: {
  groups: NavGroupData[]
  bottom: NavItemData[]
  role?: string
  header: React.ReactNode
  onNavigate: () => void
  onLogout: () => void
  className?: string
}) {
  const [open, setOpen] = useState<string[]>(loadOpen)

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_KEY, JSON.stringify(open))
    } catch {
      // Stockage refusé : l'état vaut pour la session.
    }
  }, [open])

  const toggle = (id: string) =>
    setOpen((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))

  return (
    <div
      className={cn(
        'flex h-full w-[260px] flex-col border-r border-border bg-card/50 p-3 text-foreground',
        className,
      )}
    >
      {header}

      <nav className="scrollbar-hide mt-2 flex flex-1 flex-col gap-4 overflow-y-auto">
        {groups.map((group, i) => {
          const items = group.items.filter((item) => visible(item, role))
          if (items.length === 0) return null
          return (
            <div key={group.heading ?? i} className="flex flex-col gap-0.5">
              {group.heading && (
                <span className="mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                  {group.heading}
                </span>
              )}
              {items.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  role={role}
                  open={open}
                  onToggle={toggle}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-0.5 border-t border-border pt-3">
        {bottom.filter((item) => visible(item, role)).map((item) => (
          <NavItem
            key={item.id}
            item={item}
            role={role}
            open={open}
            onToggle={toggle}
            onNavigate={onNavigate}
          />
        ))}
        <button
          type="button"
          onClick={onLogout}
          className="group flex select-none items-center gap-2.5 rounded-[6px] px-2.5 py-[7px] pl-[10px] text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <LogOut
            className="h-4 w-4 shrink-0 text-muted-foreground/70 transition-colors group-hover:text-foreground/70"
            strokeWidth={1.5}
          />
          <span className="text-[13px] tracking-wide">Déconnexion</span>
        </button>
      </div>
    </div>
  )
}
