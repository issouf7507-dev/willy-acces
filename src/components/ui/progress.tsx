import { cn } from '@/lib/utils'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Part remplie, de 0 à 100. Les valeurs hors bornes sont ramenées dedans. */
  value?: number
  /** Couleur de la barre. Par défaut la couleur principale du thème. */
  tone?: 'default' | 'success' | 'warning' | 'destructive'
}

const TONE: Record<NonNullable<ProgressProps['tone']>, string> = {
  default: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
}

/**
 * Barre de progression, sans dépendance : un `div` dans un `div` suffit, et le
 * composant reste lisible par un lecteur d'écran grâce aux attributs ARIA.
 */
function Progress({ className, value = 0, tone = 'default', ...props }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500', TONE[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export { Progress }
