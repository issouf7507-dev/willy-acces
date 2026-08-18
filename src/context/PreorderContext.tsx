import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

/**
 * Produit tel que le panier de précommande en a besoin. `productId` est
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

export interface PreorderItem extends PreorderTarget {
  /** Coloris retenu pour cette ligne, modifiable depuis le panier. */
  color: string
  quantity: number
}

interface PreorderContextType {
  items: PreorderItem[]
  isOpen: boolean
  /** Ajoute le produit au panier de précommande et ouvre le panier. */
  open: (target: PreorderTarget) => void
  /** Ajoute sans ouvrir le panier, pour enchaîner plusieurs réservations. */
  add: (target: PreorderTarget) => void
  openCart: () => void
  close: () => void
  setColor: (productId: string, color: string) => void
  setQuantity: (productId: string, quantity: number) => void
  remove: (productId: string) => void
  clear: () => void
  total: number
  itemCount: number
}

const PreorderContext = createContext<PreorderContextType | null>(null)

/** Distinct du panier classique (`wa_cart`) : les deux tunnels ne se mélangent pas. */
const STORAGE_KEY = 'wa_preorder_cart'

function loadInitial(): PreorderItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as PreorderItem[]) : []
  } catch {
    return []
  }
}

export function PreorderProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<PreorderItem[]>(loadInitial)
  const [isOpen, setIsOpen] = useState(false)

  // Persistance entre les visites : une précommande se décide rarement d'un coup.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* quota / mode privé : on ignore */
    }
  }, [items])

  /**
   * Une ligne par produit : un même produit ajouté deux fois incrémente la
   * quantité plutôt que de créer un doublon. Le coloris se change ensuite dans
   * le panier, ce qui évite de multiplier les lignes pour un même article.
   */
  const add = (target: PreorderTarget, openCart = false) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === target.productId)
      if (existing) {
        return prev.map((i) =>
          i.productId === target.productId ? { ...i, quantity: Math.min(i.quantity + 1, 50) } : i,
        )
      }
      const color = target.defaultColor || target.colors?.[0]?.name || ''
      return [...prev, { ...target, color, quantity: 1 }]
    })
    if (openCart) setIsOpen(true)
  }

  const remove = (productId: string) =>
    setItems((prev) => prev.filter((i) => i.productId !== productId))

  const setQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) { remove(productId); return }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.min(quantity, 50) } : i)),
    )
  }

  const setColor = (productId: string, color: string) =>
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, color } : i)))

  const { total, itemCount } = useMemo(
    () => ({
      total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    [items],
  )

  return (
    <PreorderContext.Provider
      value={{
        items,
        isOpen,
        open: (target) => add(target, true),
        add: (target) => add(target),
        openCart: () => setIsOpen(true),
        close: () => setIsOpen(false),
        setColor,
        setQuantity,
        remove,
        clear: () => setItems([]),
        total,
        itemCount,
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
