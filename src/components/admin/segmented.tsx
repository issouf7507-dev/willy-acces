import { cn } from '@/lib/utils'

export interface SegmentedOption<T extends string> {
  id: T
  label: React.ReactNode
  /** Compteur collé à l'intitulé, quand on connaît le nombre de lignes. */
  badge?: number | string
}

/**
 * Sélecteur d'onglets compact, pour les filtres qui s'excluent.
 *
 * Il remplace la rangée de pastilles rondes : à hauteur de champ (32 px), il
 * s'aligne avec la recherche et les boutons de la barre d'outils.
 */
function Segmented<T extends string>({
  value, options, onChange, className, ariaLabel,
}: {
  value: T
  options: readonly SegmentedOption<T>[]
  onChange: (id: T) => void
  className?: string
  ariaLabel?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'scrollbar-hide inline-flex h-8 max-w-full items-center gap-0.5 overflow-x-auto rounded-lg bg-muted p-0.5',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.id === value
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[0.8rem] font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'bg-background text-foreground shadow-2xs ring-1 ring-foreground/5'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.label}
            {opt.badge !== undefined && (
              <span className="rounded-full bg-foreground/10 px-1.5 text-[10px] tabular-nums leading-4">
                {opt.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export { Segmented }
