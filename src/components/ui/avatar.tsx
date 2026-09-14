import { cn } from '@/lib/utils'

/** Initiales d'un nom : « Aya Koné » → « AK », « Admin » → « A ». */
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string | null
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
}

const SIZE = {
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
} as const

/**
 * Pastille d'identité. Sans image, les initiales : dans un back-office de
 * boutique, presque personne n'a de photo, et un rond vide n'apprend rien.
 */
function Avatar({ className, name, src, size = 'md', ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        'bg-muted font-semibold text-muted-foreground select-none',
        SIZE[size],
        className,
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={name ?? ''} className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden>{name ? initials(name) : '—'}</span>
      )}
    </div>
  )
}

export { Avatar }
