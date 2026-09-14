import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  /** Une phrase qui dit à quoi sert l'écran, pas ce qu'il affiche. */
  description?: React.ReactNode
  /** Filtres, sélecteur de période, boutons — alignés à droite du titre. */
  actions?: React.ReactNode
  className?: string
}

/**
 * En-tête commun à tous les écrans du back-office.
 *
 * Chaque page avait le sien, avec des marges et des tailles légèrement
 * différentes : d'un écran à l'autre, le titre ne tombait pas au même endroit.
 */
function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6 flex flex-wrap items-center justify-between gap-4', className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-foreground lg:text-2xl">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export { PageHeader }
