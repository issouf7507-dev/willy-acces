import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from './api'
import { resolveCartToOrder } from './storefront'

vi.mock('./api', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}))

const mockedGet = vi.mocked(api.get)

// fetchAll() ne lit que { id, name } de chaque produit → on fournit le minimum.
const catalogue = {
  items: [
    { id: 'cuid_barrage', name: 'Barrage 22L Pack' },
    { id: 'cuid_kadet', name: 'Kadet Sling' },
  ],
  meta: { total: 2, page: 1, limit: 100, totalPages: 1 },
}

beforeEach(() => {
  mockedGet.mockReset()
  mockedGet.mockResolvedValue(catalogue as never)
})

describe('resolveCartToOrder', () => {
  it('utilise le productId porté par l’article sans interroger l’API', async () => {
    const res = await resolveCartToOrder([
      { productId: 'cuid_direct', name: 'Peu importe', quantity: 2 },
    ])

    expect(res.orderItems).toEqual([{ productId: 'cuid_direct', quantity: 2 }])
    expect(res.unresolved).toEqual([])
    expect(mockedGet).not.toHaveBeenCalled()
  })

  it('résout le productId par nom (insensible à la casse et aux espaces)', async () => {
    const res = await resolveCartToOrder([
      { name: '  barrage 22l pack ', quantity: 1 },
    ])

    expect(res.orderItems).toEqual([{ productId: 'cuid_barrage', quantity: 1 }])
    expect(res.unresolved).toEqual([])
    expect(mockedGet).toHaveBeenCalledOnce()
  })

  it('signale les articles introuvables au lieu de les inclure', async () => {
    const res = await resolveCartToOrder([
      { name: 'Produit fantôme', quantity: 3 },
    ])

    expect(res.orderItems).toEqual([])
    expect(res.unresolved).toEqual(['Produit fantôme'])
  })

  it('gère un panier mixte : porté, par nom, et non résolu', async () => {
    const res = await resolveCartToOrder([
      { productId: 'cuid_direct', name: 'Direct', quantity: 1 },
      { name: 'Kadet Sling', quantity: 2 },
      { name: 'Inconnu', quantity: 1 },
    ])

    expect(res.orderItems).toEqual([
      { productId: 'cuid_direct', quantity: 1 },
      { productId: 'cuid_kadet', quantity: 2 },
    ])
    expect(res.unresolved).toEqual(['Inconnu'])
  })
})
