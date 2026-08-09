export interface SalonService {
  id: string
  name: string
  description: string
  priceFrom: number
  gradientFrom: string
  gradientTo: string
}

export interface GalleryItem {
  id: number
  title: string
  category: string
  gradientFrom: string
  gradientTo: string
}

// Les services et la galerie du salon ne sont plus codés en dur : ils sont gérés
// depuis le back-office et chargés via fetchSalonServices() / fetchSalonCatalogues()
// (voir src/lib/storefront.ts). Seuls restent ici les libellés d'UI (filtres, devis).

export const GALLERY_FILTERS = [
  { id: 'all',        label: 'Tout' },
  { id: 'coiffure',   label: 'Coiffure' },
  { id: 'tresses',    label: 'Tresses' },
  { id: 'maquillage', label: 'Maquillage' },
  { id: 'onglerie',   label: 'Onglerie' },
  { id: 'soins',      label: 'Soins' },
]

/** Options du formulaire de devis */
export const QUOTE_PRESTATIONS = [
  'Coiffure', 'Tresses & Extensions', 'Maquillage',
  'Onglerie', 'Soins du visage', 'Forfait mariée / événement',
]

export const QUOTE_OCCASIONS = [
  'Mariage', 'Cérémonie / Fête', 'Shooting photo',
  'Événement pro', 'Au quotidien', 'Autre',
]

export const QUOTE_LOCATIONS = [
  { value: 'salon',    label: 'Au salon' },
  { value: 'domicile', label: 'À domicile' },
]

export const QUOTE_BUDGETS = [
  'Moins de 25 000 F', '25 000 – 50 000 F',
  '50 000 – 100 000 F', 'Plus de 100 000 F',
]
