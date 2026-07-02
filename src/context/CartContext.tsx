import { createContext, useContext, useState, type ReactNode } from 'react'

export interface CartItem {
  id: number
  name: string
  price: number
  compareAtPrice?: number
  color: string
  quantity: number
  gradientFrom: string
  gradientTo: string
}

interface CartContextType {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, qty: number) => void
  openCart: () => void
  closeCart: () => void
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([
    {
      id: 11,
      name: 'Barrage 22L Pack',
      price: 170,
      color: 'Black',
      quantity: 1,
      gradientFrom: 'from-zinc-700',
      gradientTo: 'to-zinc-900',
    },
  ])
  const [isOpen, setIsOpen] = useState(false)

  const addItem = (newItem: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === newItem.id && i.color === newItem.color)
      if (existing) {
        return prev.map(i =>
          i.id === newItem.id && i.color === newItem.color
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { ...newItem, quantity: 1 }]
    })
    setIsOpen(true)
  }

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const updateQuantity = (id: number, qty: number) => {
    if (qty <= 0) { removeItem(id); return }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i))
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{
      items, isOpen, addItem, removeItem, updateQuantity,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      total, itemCount,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
