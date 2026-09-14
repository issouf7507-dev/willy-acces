import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Check, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastTone = 'success' | 'error' | 'info'

interface Toast {
  id: number
  tone: ToastTone
  message: string
}

interface ToastContextValue {
  /** Affiche un message. Retourne l'identifiant, au cas où on veuille le retirer. */
  toast: (message: string, tone?: ToastTone) => number
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

/** Les erreurs restent à l'écran ; une confirmation s'efface d'elle-même. */
const DURATION: Record<ToastTone, number | null> = {
  success: 4000,
  info: 5000,
  error: null,
}

const ICON: Record<ToastTone, React.ElementType> = {
  success: Check,
  error: AlertTriangle,
  info: Info,
}

const STYLE: Record<ToastTone, string> = {
  success: 'border-success/30 bg-success/10 text-success',
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  info: 'border-border bg-card text-card-foreground',
}

/**
 * Retours d'action du back-office.
 *
 * Les messages s'affichaient jusqu'ici en texte, à un endroit différent selon
 * l'écran — parfois sous le formulaire, donc hors de vue après un clic en haut
 * de page. Ils apparaissent désormais toujours au même endroit.
 */
function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = nextId.current++
    setToasts((list) => [...list, { id, tone, message }])
    return id
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const Icon = ICON[toast.tone]
  const duration = DURATION[toast.tone]

  useEffect(() => {
    if (duration === null) return
    const timer = setTimeout(() => onDismiss(toast.id), duration)
    return () => clearTimeout(timer)
  }, [toast.id, duration, onDismiss])

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg',
        'animate-toast-in',
        STYLE[toast.tone],
      )}
      role={toast.tone === 'error' ? 'alert' : undefined}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 break-words">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Fermer"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

/**
 * `useToast` hors du fournisseur ne lève pas : un composant de la vitrine qui
 * en appellerait un par erreur ne doit pas faire tomber la page. Le message
 * part alors dans le vide, ce qui se voit en développement.
 */
function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  return ctx ?? { toast: () => 0, dismiss: () => {} }
}

export { ToastProvider, useToast }
