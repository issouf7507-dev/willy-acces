import { describe, it, expect } from 'vitest'
import {
  DEFAULT_WHATSAPP_NUMBER,
  buildWhatsappOrderMessage,
  whatsappHref,
} from './whatsapp'

describe('whatsappHref', () => {
  it('cible le numéro par défaut au format international', () => {
    const url = new URL(whatsappHref(DEFAULT_WHATSAPP_NUMBER, 'Bonjour'))
    expect(url.host).toBe('wa.me')
    expect(url.pathname).toBe('/2250101016919')
    expect(url.searchParams.get('text')).toBe('Bonjour')
  })

  it("retire les séparateurs d'un numéro saisi en back-office", () => {
    expect(whatsappHref('+225 01 01 01 69 19', 'x')).toContain('wa.me/2250101016919')
  })
})

describe('buildWhatsappOrderMessage', () => {
  it('liste les articles, le total et les coordonnées', () => {
    const msg = buildWhatsappOrderMessage({
      items: [
        { name: 'Sac Willy', quantity: 2, lineTotal: '30 000 F CFA', variant: 'Noir' },
        { name: 'Ceinture', quantity: 1, lineTotal: '8 000 F CFA' },
      ],
      total: '38 000 F CFA',
      name: 'Aïcha Koné',
      phone: '0707070707',
      address: 'Cocody, Riviera 3',
    })

    expect(msg).toContain('• 2 x Sac Willy (Noir) — 30 000 F CFA')
    expect(msg).toContain('• 1 x Ceinture — 8 000 F CFA')
    expect(msg).toContain('Total : 38 000 F CFA')
    expect(msg).toContain('Nom : Aïcha Koné')
    expect(msg).toContain('Adresse : Cocody, Riviera 3')
  })

  it('omet les champs facultatifs non renseignés', () => {
    const msg = buildWhatsappOrderMessage({
      items: [{ name: 'Sac', quantity: 1, lineTotal: '1 F CFA' }],
      total: '1 F CFA',
    })
    expect(msg).not.toContain('Nom :')
    expect(msg).not.toContain('Code promo :')
    expect(msg).not.toContain('Note :')
  })
})
