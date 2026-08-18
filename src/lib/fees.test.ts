import { describe, it, expect } from 'vitest'
import { SERVICE_FEE_LABEL, serviceFee, totalWithServiceFee } from './fees'

describe('serviceFee', () => {
  it('prélève 1 % du montant des articles', () => {
    expect(serviceFee(30000)).toBe(300)
    expect(totalWithServiceFee(30000)).toBe(30300)
  })

  it('arrondit au franc, le FCFA n\'ayant pas de subdivision', () => {
    // 30 023 × 1 % = 300,23 → 300 ; 44 050 × 1 % = 440,50 → 441 (arrondi au plus proche).
    expect(serviceFee(30023)).toBe(300)
    expect(serviceFee(44050)).toBe(441)
    expect(Number.isInteger(serviceFee(12345))).toBe(true)
  })

  it('ne facture rien sur un panier vide', () => {
    expect(serviceFee(0)).toBe(0)
    expect(totalWithServiceFee(0)).toBe(0)
  })

  it('annonce le taux dans le libellé affiché au client', () => {
    expect(SERVICE_FEE_LABEL).toBe('Frais de service (1 %)')
  })
})
