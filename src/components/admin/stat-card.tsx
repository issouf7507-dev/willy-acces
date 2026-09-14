import { Link } from 'react-router-dom'
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  /** Déjà formatée : le composant ne décide pas de l'unité. */
  value: string | number
  /** Une ligne sous le chiffre : comparaison, précision, avertissement. */
  hint?: React.ReactNode
  /**
   * Variation en pourcentage. `null` quand elle n'a pas de sens — une évolution
   * depuis zéro n'en a pas — et rien ne s'affiche alors.
   */
  trend?: number | null
  /** Sens de lecture : pour une dépense, une hausse n'est pas une bonne nouvelle. */
  trendIsGood?: 'up' | 'down'
  /** Destination du lien de pied. Sans elle, la carte n'a pas de pied. */
  to?: string
  linkLabel?: string
  tone?: 'default' | 'success' | 'warning' | 'destructive'
  className?: string
}

const TONE = {
  default: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
} as const

/** Enveloppe commune : carte mate, panneau de contenu détaché à l'intérieur. */
export function CardShell({
  title, description, action, headerBelow, children, className, contentClassName,
}: {
  title?: React.ReactNode
  /** Intitulé discret, quand le chiffre en dessous porte l'information. */
  description?: React.ReactNode
  action?: React.ReactNode
  /** Rangée supplémentaire dans le bandeau, sous le titre. */
  headerBelow?: React.ReactNode
  children: React.ReactNode
  className?: string
  /** Pour le contenu qui gère lui-même ses marges — un tableau pleine largeur. */
  contentClassName?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 overflow-hidden rounded-xl bg-muted/40 text-sm text-card-foreground',
        'ring-1 ring-foreground/10 [--card-spacing:--spacing(4)]',
        className,
      )}
    >
      {(title || description || action || headerBelow) && (
        <div
          className={cn(
            'grid min-h-13 auto-rows-min content-center items-center gap-1 px-(--card-spacing) py-2.5',
            action && 'grid-cols-[1fr_auto]',
          )}
        >
          {title && (
            <div className="truncate font-heading text-sm font-semibold leading-snug">{title}</div>
          )}
          {description && !title && (
            <div className="text-sm text-muted-foreground">{description}</div>
          )}
          {action && <div className="col-start-2 row-start-1 justify-self-end">{action}</div>}
          {headerBelow && <div className="col-start-1 -col-end-1">{headerBelow}</div>}
        </div>
      )}
      {/*
        Le contenu est un panneau à part, posé dans la carte : c'est ce
        décrochement qui donne la profondeur, plutôt qu'une ombre portée.
      */}
      <div
        className={cn(
          'flex-1 overflow-hidden rounded-lg bg-card p-(--card-spacing) shadow-2xs ring-1 ring-foreground/5',
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function StatCard({
  label, value, hint, trend, trendIsGood = 'up', to, linkLabel = 'Voir plus',
  tone = 'default', className,
}: StatCardProps) {
  const hasTrend = trend !== null && trend !== undefined
  const good = hasTrend && (trendIsGood === 'up' ? trend >= 0 : trend <= 0)

  return (
    <CardShell title={label} className={className}>
      <div className="flex items-center gap-2">
        <span className={cn('text-3xl font-semibold tabular-nums tracking-tight', TONE[tone])}>
          {value}
        </span>
        {hasTrend && (
          <Badge variant={good ? 'success' : 'destructive'} className="gap-0.5 rounded-full px-2">
            {trend >= 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
            {Math.abs(trend)}%
          </Badge>
        )}
      </div>

      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}

      {to && (
        <>
          <div className="my-3 h-px w-full shrink-0 bg-border" role="none" />
          <Link
            to={to}
            className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {linkLabel} <ArrowRight className="size-3" />
          </Link>
        </>
      )}
    </CardShell>
  )
}

/**
 * Carte de tête : le chiffre qui résume le mois, avec une action à droite.
 *
 * Elle occupe le tiers gauche de la première rangée. Le fond est plus marqué
 * que celui des cartes voisines — c'est ce qui la désigne comme le point
 * d'entrée de l'écran.
 */
export function HeroCard({
  title, subtitle, value, hint, action, className,
}: {
  title: string
  subtitle?: string
  value: string
  hint?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative flex flex-col gap-1 overflow-hidden rounded-xl bg-muted text-sm text-card-foreground',
        'ring-1 ring-foreground/10 [--card-spacing:--spacing(4)]',
        className,
      )}
    >
      {/* Halo discret : il éclaire le coin sans ajouter d'image à charger. */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/5 blur-2xl"
        aria-hidden
      />
      <div className="relative flex-1 overflow-hidden rounded-lg bg-card p-(--card-spacing) shadow-2xs ring-1 ring-foreground/5">
        <div className="mb-4 space-y-2">
          <div className="font-heading text-2xl font-semibold">{title}</div>
          {subtitle && <div className="text-muted-foreground">{subtitle}</div>}
        </div>
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="text-3xl font-semibold tabular-nums tracking-tight">{value}</div>
            {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
          </div>
          {action}
        </div>
      </div>
    </div>
  )
}
