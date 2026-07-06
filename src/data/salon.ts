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

export const SALON_SERVICES: SalonService[] = [
  {
    id: 'coiffure', name: 'Coiffure',
    description: 'Coupe, brushing, coloration et coiffures événementielles.',
    priceFrom: 15000, gradientFrom: 'from-rose-700', gradientTo: 'to-rose-950',
  },
  {
    id: 'tresses', name: 'Tresses & Extensions',
    description: 'Nattes, twists, tissages et poses de mèches soignées.',
    priceFrom: 20000, gradientFrom: 'from-amber-700', gradientTo: 'to-amber-950',
  },
  {
    id: 'maquillage', name: 'Maquillage',
    description: 'Make-up jour, soirée et mariage par nos maquilleuses.',
    priceFrom: 25000, gradientFrom: 'from-fuchsia-700', gradientTo: 'to-fuchsia-950',
  },
  {
    id: 'onglerie', name: 'Onglerie',
    description: 'Manucure, pédicure, pose de gel et nail art.',
    priceFrom: 10000, gradientFrom: 'from-violet-700', gradientTo: 'to-violet-950',
  },
  {
    id: 'soins', name: 'Soins du visage',
    description: 'Nettoyage de peau, gommage et soins hydratants.',
    priceFrom: 18000, gradientFrom: 'from-teal-700', gradientTo: 'to-teal-950',
  },
  {
    id: 'evenement', name: 'Forfait événement',
    description: 'Préparation complète pour mariées et cérémonies.',
    priceFrom: 60000, gradientFrom: 'from-indigo-800', gradientTo: 'to-indigo-950',
  },
]

export const GALLERY_ITEMS: GalleryItem[] = [
  { id: 1,  title: 'Chignon de mariée',        category: 'coiffure',   gradientFrom: 'from-rose-600',    gradientTo: 'to-rose-900' },
  { id: 2,  title: 'Box braids longues',       category: 'tresses',    gradientFrom: 'from-amber-600',   gradientTo: 'to-amber-900' },
  { id: 3,  title: 'Make-up glow soirée',      category: 'maquillage', gradientFrom: 'from-fuchsia-600', gradientTo: 'to-fuchsia-900' },
  { id: 4,  title: 'Nail art géométrique',     category: 'onglerie',   gradientFrom: 'from-violet-600',  gradientTo: 'to-violet-900' },
  { id: 5,  title: 'Soin éclat du teint',      category: 'soins',      gradientFrom: 'from-teal-600',    gradientTo: 'to-teal-900' },
  { id: 6,  title: 'Coloration cuivrée',       category: 'coiffure',   gradientFrom: 'from-orange-600',  gradientTo: 'to-orange-900' },
  { id: 7,  title: 'Twists élégantes',         category: 'tresses',    gradientFrom: 'from-yellow-700',  gradientTo: 'to-yellow-950' },
  { id: 8,  title: 'Maquillage mariée',        category: 'maquillage', gradientFrom: 'from-pink-600',    gradientTo: 'to-pink-900' },
  { id: 9,  title: 'Manucure french moderne',  category: 'onglerie',   gradientFrom: 'from-purple-600',  gradientTo: 'to-purple-900' },
  { id: 10, title: 'Brushing volume',          category: 'coiffure',   gradientFrom: 'from-red-700',     gradientTo: 'to-red-950' },
  { id: 11, title: 'Tissage naturel',          category: 'tresses',    gradientFrom: 'from-amber-700',   gradientTo: 'to-amber-950' },
  { id: 12, title: 'Soin hydratant profond',   category: 'soins',      gradientFrom: 'from-emerald-600', gradientTo: 'to-emerald-900' },
]

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
