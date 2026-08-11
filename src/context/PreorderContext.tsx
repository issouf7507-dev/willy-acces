import { createContext, useContext, useState, type ReactNode } from 'react'

/**
 * Produit tel que le formulaire de précommande en a besoin. `productId` est
 * l'identifiant côté API : c'est lui qui part au serveur, qui relit le nom et
 * le prix en base plutôt que de faire confiance au navigateur.
 */
export interface PreorderTarget {
  productId: string
  name: string
  price: number
  compareAtPrice?: number
  releaseDate?: string
  imageUrl?: string
  colors?: { name: string; hex: string }[]
  /** Coloris déjà choisi sur la fiche produit, repris comme valeur par défaut. */
  defaultColor?: string
}

interface PreorderContextType {
  target: PreorderTarget | null
  isOpen: boolean
  open: (target: PreorderTarget) => void
  close: () => void
}

const PreorderContext = createContext<PreorderContextType | null>(null)

export function PreorderProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<PreorderTarget | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  return (
    <PreorderContext.Provider
      value={{
        target,
        isOpen,
        open: (t) => { setTarget(t); setIsOpen(true) },
        close: () => setIsOpen(false),
      }}
    >
      {children}
    </PreorderContext.Provider>
  )
}

export function usePreorder() {
  const ctx = useContext(PreorderContext)
  if (!ctx) throw new Error('usePreorder doit être utilisé dans un PreorderProvider')
  return ctx
}
