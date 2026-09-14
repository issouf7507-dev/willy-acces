import { useCallback, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ConfirmOptions {
  title: string
  /** Ce que l'action va faire, et ce qu'elle ne pourra pas défaire. */
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** `danger` pour une suppression, `warning` pour un geste irréversible. */
  tone?: 'danger' | 'warning' | 'default'
}

/**
 * Confirmation d'une action, en remplacement du `confirm()` du navigateur.
 *
 * Le natif ne se met pas au thème, ne dit rien de plus que son texte, et bloque
 * l'onglet entier. Le hook garde pourtant la même forme d'appel — une promesse
 * de booléen — pour que les écrans n'aient qu'un `await` à ajouter :
 *
 *     const [confirm, confirmDialog] = useConfirm()
 *     if (!(await confirm({ title: 'Supprimer ?' }))) return
 *     …
 *     return <>{confirmDialog}…</>
 */
function useConfirm(): [(options: ConfirmOptions) => Promise<boolean>, React.ReactNode] {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((ok: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const close = useCallback((ok: boolean) => {
    resolver.current?.(ok)
    resolver.current = null
    setOptions(null)
  }, [])

  const dialog = options ? (
    <ConfirmDialog options={options} onClose={close} />
  ) : null

  return [confirm, dialog]
}

function ConfirmDialog({
  options, onClose,
}: {
  options: ConfirmOptions
  onClose: (ok: boolean) => void
}) {
  const tone = options.tone ?? 'default'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => onClose(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-3">
          {tone !== 'default' && (
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                tone === 'danger' ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning',
              )}
            >
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="font-semibold text-card-foreground">{options.title}</h2>
            {options.description && (
              <p className="mt-1 text-sm text-muted-foreground">{options.description}</p>
            )}
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onClose(false)}>
            {options.cancelLabel ?? 'Annuler'}
          </Button>
          <Button
            variant={tone === 'danger' ? 'destructive' : 'default'}
            className="flex-1"
            autoFocus
            onClick={() => onClose(true)}
          >
            {options.confirmLabel ?? 'Confirmer'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export { useConfirm }
