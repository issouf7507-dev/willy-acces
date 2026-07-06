export interface PreorderColor {
  name: string
  hex: string
  isPattern?: boolean
}

export interface PreorderProduct {
  id: number
  name: string
  price: number
  /** Date de disponibilité au format ISO 8601 */
  releaseDate: string
  tagline: string
  colors: PreorderColor[]
  gradientFrom: string
  gradientTo: string
}

export const PREORDERS: PreorderProduct[] = [
  {
    id: 101, name: 'Kadet Pro 12L Sling', price: 165,
    releaseDate: '2026-07-18T09:00:00',
    tagline: 'La nouvelle génération du Kadet, plus légère et plus résistante.',
    colors: [{ name: 'Black', hex: '#000' }, { name: 'Steel Blue', hex: '#709C9C' }, { name: 'Coyote X', hex: '#B8A37F' }],
    gradientFrom: 'from-zinc-700', gradientTo: 'to-zinc-900',
  },
  {
    id: 102, name: 'Barrage Summit 40L Pack', price: 260,
    releaseDate: '2026-08-01T09:00:00',
    tagline: 'Sac d’expédition étanche pour les longues aventures.',
    colors: [{ name: 'Black', hex: '#000' }, { name: 'Moss X', hex: '#7a9460' }],
    gradientFrom: 'from-emerald-800', gradientTo: 'to-emerald-950',
  },
  {
    id: 103, name: 'Citizen Pro 20L Messenger', price: 195,
    releaseDate: '2026-07-25T09:00:00',
    tagline: 'Le messager urbain repensé pour le vélotaf.',
    colors: [{ name: 'Coyote X', hex: '#B8A37F' }, { name: 'Black', hex: '#000' }],
    gradientFrom: 'from-amber-700', gradientTo: 'to-amber-900',
  },
  {
    id: 104, name: 'Urban Ex 2.0 25L Pack', price: 180,
    releaseDate: '2026-08-15T09:00:00',
    tagline: 'Roll-top 100% étanche, dos ventilé nouvelle génération.',
    colors: [{ name: 'Black', hex: '#000' }, { name: 'Future White', hex: '#f2efe1' }],
    gradientFrom: 'from-indigo-800', gradientTo: 'to-indigo-950',
  },
  {
    id: 105, name: 'Mini Buckle 3L Sling', price: 70,
    releaseDate: '2026-07-11T09:00:00',
    tagline: 'Compact, iconique, avec la boucle signature repensée.',
    colors: [{ name: 'Matte Black', hex: '#111' }, { name: 'Mauve X', hex: '#de97ce' }],
    gradientFrom: 'from-stone-700', gradientTo: 'to-stone-900',
  },
  {
    id: 106, name: 'Holman Fork Bag', price: 50,
    releaseDate: '2026-09-01T09:00:00',
    tagline: 'La gamme vélo s’agrandit avec ce sac de fourche modulaire.',
    colors: [{ name: 'Black XRF', hex: '#555' }],
    gradientFrom: 'from-cyan-700', gradientTo: 'to-cyan-900',
  },
]
