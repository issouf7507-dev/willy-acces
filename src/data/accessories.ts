export interface AccessoryColor {
  name: string
  hex: string
  isPattern?: boolean
}

export interface AccessoryProduct {
  id: number
  name: string
  price: number
  compareAtPrice?: number
  rating: number
  reviews: number
  category: string
  colors: AccessoryColor[]
  gradientFrom: string
  gradientTo: string
  imageUrl?: string
}

// Les sous-catégories d'accessoires (Porte-clés, Sangles…) ne sont plus listées
// ici : ce sont des catégories enfants d'« Accessoires », gérées depuis
// /admin/categories et lues via fetchCategories(). Le champ `category` ci-dessus
// porte le slug de la catégorie du produit.

export const ACCESSORY_SORT_OPTIONS = [
  { label: 'En vedette', value: 'featured' },
  { label: 'Prix : croissant', value: 'price-asc' },
  { label: 'Prix : décroissant', value: 'price-desc' },
  { label: 'Mieux notés', value: 'rating' },
  { label: 'Plus d’avis', value: 'reviews' },
]

export const ACCESSORIES: AccessoryProduct[] = [
  {
    id: 201, name: 'Mini Buckle Keychain', price: 25, rating: 4.0, reviews: 83, category: 'porte-cles',
    colors: [{ name: 'Black', hex: '#000' }, { name: 'Silver', hex: '#C0C0C0' }],
    gradientFrom: 'from-zinc-600', gradientTo: 'to-zinc-800',
  },
  {
    id: 202, name: 'Utility Carabiner', price: 18, rating: 4.5, reviews: 41, category: 'porte-cles',
    colors: [{ name: 'Black', hex: '#000' }, { name: 'Coyote X', hex: '#B8A37F' }],
    gradientFrom: 'from-neutral-600', gradientTo: 'to-neutral-800',
  },
  {
    id: 203, name: 'Key Loop Leather', price: 30, rating: 4.8, reviews: 27, category: 'porte-cles',
    colors: [{ name: 'Black Canvas Leather', hex: '#000' }, { name: 'Coyote X', hex: '#B8A37F' }],
    gradientFrom: 'from-stone-600', gradientTo: 'to-stone-800',
  },
  {
    id: 204, name: 'Adjustable Sternum Strap', price: 22, rating: 4.3, reviews: 58, category: 'sangles',
    colors: [{ name: 'Black', hex: '#000' }],
    gradientFrom: 'from-slate-600', gradientTo: 'to-slate-800',
  },
  {
    id: 205, name: 'Padded Shoulder Strap', price: 45, rating: 4.6, reviews: 34, category: 'sangles',
    colors: [{ name: 'Black', hex: '#000' }, { name: 'Steel Blue', hex: '#709C9C' }],
    gradientFrom: 'from-zinc-700', gradientTo: 'to-zinc-900',
  },
  {
    id: 206, name: 'Waist Belt Strap', price: 28, rating: 4.1, reviews: 19, category: 'sangles',
    colors: [{ name: 'Black', hex: '#000' }, { name: 'Moss X', hex: '#7a9460' }],
    gradientFrom: 'from-emerald-700', gradientTo: 'to-emerald-900',
  },
  {
    id: 207, name: 'Logo Dad Cap', price: 35, rating: 4.7, reviews: 92, category: 'casquettes',
    colors: [{ name: 'Black', hex: '#000' }, { name: 'Coyote X', hex: '#B8A37F' }, { name: 'Steel Blue', hex: '#709C9C' }],
    gradientFrom: 'from-amber-700', gradientTo: 'to-amber-900',
  },
  {
    id: 208, name: '5-Panel Camp Cap', price: 40, rating: 4.4, reviews: 46, category: 'casquettes',
    colors: [{ name: 'Black', hex: '#000' }, { name: 'Future White', hex: '#f2efe1' }],
    gradientFrom: 'from-slate-700', gradientTo: 'to-slate-900',
  },
  {
    id: 209, name: 'Beanie Knit', price: 30, rating: 4.9, reviews: 63, category: 'casquettes',
    colors: [{ name: 'Black', hex: '#000' }, { name: 'Mauve X', hex: '#de97ce' }, { name: 'Moss X', hex: '#7a9460' }],
    gradientFrom: 'from-purple-800', gradientTo: 'to-purple-950',
  },
  {
    id: 210, name: 'Insulated Bottle 750ml', price: 38, rating: 4.6, reviews: 51, category: 'gourdes',
    colors: [{ name: 'Black', hex: '#000' }, { name: 'Steel Blue', hex: '#709C9C' }],
    gradientFrom: 'from-cyan-700', gradientTo: 'to-cyan-900',
  },
  {
    id: 211, name: 'Stainless Flask 500ml', price: 32, rating: 4.2, reviews: 24, category: 'gourdes',
    colors: [{ name: 'Silver', hex: '#C0C0C0' }, { name: 'Black', hex: '#000' }],
    gradientFrom: 'from-gray-500', gradientTo: 'to-gray-700',
  },
  {
    id: 212, name: 'Pac Pouch 2L', price: 40, rating: 4.0, reviews: 33, category: 'pochettes',
    colors: [{ name: 'Matte Black', hex: '#111' }, { name: 'Black Canvas Leather', hex: '#000' }],
    gradientFrom: 'from-zinc-600', gradientTo: 'to-zinc-800',
  },
  {
    id: 213, name: 'Zip Wallet', price: 45, rating: 4.5, reviews: 38, category: 'pochettes',
    colors: [{ name: 'Black', hex: '#000' }, { name: 'Coyote X', hex: '#B8A37F' }],
    gradientFrom: 'from-stone-700', gradientTo: 'to-stone-900',
  },
  {
    id: 214, name: 'Cable Organizer Pouch', price: 20, rating: 4.3, reviews: 15, category: 'pochettes',
    colors: [{ name: 'Black', hex: '#000' }],
    gradientFrom: 'from-neutral-700', gradientTo: 'to-neutral-900',
  },
  {
    id: 215, name: 'Fabric Care Kit', price: 24, rating: 4.7, reviews: 12, category: 'entretien',
    colors: [{ name: 'Black', hex: '#000' }],
    gradientFrom: 'from-teal-700', gradientTo: 'to-teal-900',
  },
  {
    id: 216, name: 'Waterproofing Spray', price: 16, rating: 4.4, reviews: 29, category: 'entretien',
    colors: [{ name: 'Black', hex: '#000' }],
    gradientFrom: 'from-sky-700', gradientTo: 'to-sky-900',
  },
]
