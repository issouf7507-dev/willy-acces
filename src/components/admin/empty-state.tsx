import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ElementType
  /** Ce qu'il n'y a pas, en une ligne. */
  title: string
  /** Facultatif : pourquoi c'est vide, ou quoi faire pour que ça ne le soit plus. */
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

/**
 * Ce qu'on montre quand une liste est vide.
 *
 * Chaque écran avait le sien, entre « Aucun produit » et un bloc centré de
 * hauteur différente. Un vide qui explique pourquoi il est vide vaut mieux
 * qu'un vide qui constate.
 */
function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-6 py-14 text-center', className)}>
      {Icon && <Icon className="h-8 w-8 text-muted-foreground/60" />}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/** Attente de chargement, à la même hauteur qu'un `EmptyState` pour éviter le saut. */
function LoadingState({ className, label }: { className?: string; label?: string }) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 px-6 py-14', className)}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <span className={label ? 'text-sm text-muted-foreground' : 'sr-only'}>
        {label ?? 'Chargement…'}
      </span>
    </div>
  )
}

/** Bandeau d'erreur, toujours au même endroit : juste au-dessus du contenu. */
function ErrorState({ message, className }: { message: string; className?: string }) {
  return (
    <div
      role="alert"
      className={cn(
        'mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive',
        className,
      )}
    >
      {message}
    </div>
  )
}

export { EmptyState, LoadingState, ErrorState }
