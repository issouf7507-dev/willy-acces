import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { CartProvider, useCart, type CartItem } from './CartContext'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
)

const baseItem: Omit<CartItem, 'quantity'> = {
  id: 1,
  name: 'Barrage 22L Pack',
  price: 170,
  color: 'Black',
  gradientFrom: 'from-zinc-800',
  gradientTo: 'to-zinc-950',
}

beforeEach(() => {
  localStorage.clear()
})

describe('CartContext', () => {
  it('démarre avec un panier vide', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    expect(result.current.items).toEqual([])
    expect(result.current.itemCount).toBe(0)
    expect(result.current.total).toBe(0)
  })

  it('ajoute un article avec une quantité de 1 et ouvre le panier', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => result.current.addItem(baseItem))

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(1)
    expect(result.current.isOpen).toBe(true)
  })

  it('incrémente la quantité pour un même id + couleur', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => result.current.addItem(baseItem))
    act(() => result.current.addItem(baseItem))

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(2)
    expect(result.current.itemCount).toBe(2)
  })

  it('sépare deux lignes quand la couleur diffère', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => result.current.addItem(baseItem))
    act(() => result.current.addItem({ ...baseItem, color: 'Moss X' }))

    expect(result.current.items).toHaveLength(2)
  })

  it('retire l’article quand la quantité tombe à 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => result.current.addItem(baseItem))
    act(() => result.current.updateQuantity(1, 0))

    expect(result.current.items).toEqual([])
  })

  it('calcule le total et le nombre d’articles', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => result.current.addItem(baseItem))
    act(() => result.current.updateQuantity(1, 3))
    act(() => result.current.addItem({ ...baseItem, id: 2, color: 'Amber', price: 50 }))

    expect(result.current.itemCount).toBe(4)
    expect(result.current.total).toBe(170 * 3 + 50)
  })

  it('vide le panier avec clearCart', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => result.current.addItem(baseItem))
    act(() => result.current.clearCart())

    expect(result.current.items).toEqual([])
  })

  it('persiste le panier dans localStorage', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => result.current.addItem(baseItem))

    const stored = JSON.parse(localStorage.getItem('wa_cart') ?? '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].name).toBe('Barrage 22L Pack')
  })

  it('recharge le panier depuis localStorage au montage', () => {
    localStorage.setItem('wa_cart', JSON.stringify([{ ...baseItem, quantity: 2 }]))

    const { result } = renderHook(() => useCart(), { wrapper })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.itemCount).toBe(2)
  })
})
