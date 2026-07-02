import { createContext, useContext, useState, type ReactNode } from 'react'

export interface QuickBuyColor {
  name: string
  hex: string
  isPattern?: boolean
  available?: boolean
}

export interface QuickBuyProduct {
  id: number
  name: string
  price: number
  compareAtPrice?: number
  rating: number
  reviews: number
  gradientFrom: string
  gradientTo: string
  colors: QuickBuyColor[]
}

interface QuickBuyContextType {
  product: QuickBuyProduct | null
  isOpen: boolean
  open: (product: QuickBuyProduct) => void
  close: () => void
}

const QuickBuyContext = createContext<QuickBuyContextType | null>(null)

export function QuickBuyProvider({ children }: { children: ReactNode }) {
  const [product, setProduct] = useState<QuickBuyProduct | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  return (
    <QuickBuyContext.Provider value={{
      product,
      isOpen,
      open: (p) => { setProduct(p); setIsOpen(true) },
      close: () => setIsOpen(false),
    }}>
      {children}
    </QuickBuyContext.Provider>
  )
}

export function useQuickBuy() {
  const ctx = useContext(QuickBuyContext)
  if (!ctx) throw new Error('useQuickBuy must be used inside QuickBuyProvider')
  return ctx
}
