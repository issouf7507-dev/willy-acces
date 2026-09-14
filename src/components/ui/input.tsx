import { cn } from '@/lib/utils'

/**
 * Champs de formulaire du back-office.
 *
 * Hauteur 8 (32 px) et fond transparent en clair, légèrement teinté en sombre :
 * le champ se pose sur la carte au lieu d'y découper un rectangle blanc.
 */
const field =
  'w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none ' +
  'placeholder:text-muted-foreground ' +
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ' +
  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 ' +
  'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 ' +
  'md:text-sm dark:bg-input/30 dark:disabled:bg-input/80'

function Input({ className, type, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        field,
        'h-8',
        // Les flèches des champs numériques prennent de la place pour rien dans
        // une saisie de caisse : la quantité se tape.
        '[&[type=number]]:[appearance:textfield]',
        '[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
        className,
      )}
      {...props}
    />
  )
}

function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(field, 'field-sizing-content min-h-16 py-2', className)}
      {...props}
    />
  )
}

function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        field,
        'h-8 pr-2 whitespace-nowrap select-none dark:hover:bg-input/50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        'flex items-center gap-2 text-sm font-medium leading-none select-none',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

/** Champ complet : intitulé, contrôle, et sa description éventuelle. */
function Field({
  label, htmlFor, description, children, className,
}: {
  label?: React.ReactNode
  htmlFor?: string
  description?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('grid gap-2', className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}

export { Input, Textarea, Select, Label, Field }
