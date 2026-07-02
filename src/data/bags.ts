export interface ColorOption {
  name: string
  hex: string
  isPattern?: boolean
}

export interface BagProduct {
  id: number
  name: string
  price: number
  compareAtPrice?: number
  rating: number
  reviews: number
  colors: ColorOption[]
  badge?: string
  soldOut?: boolean
  gradientFrom: string
  gradientTo: string
  tags: string[]
  volume?: string
  weather?: string[]
  inStock: boolean
}

export const BAGS: BagProduct[] = [
  {
    id: 1, name: 'Citizen 24L Messenger', price: 170, rating: 4.1, reviews: 69,
    colors: [{ name: 'Coyote X', hex: '#B8A37F' }, { name: 'Black', hex: '#000' }, { name: 'Black XRF', hex: '#555' }, { name: 'Steel Blue', hex: '#709C9C' }],
    gradientFrom: 'from-amber-700', gradientTo: 'to-amber-900',
    tags: ['courier', 'work & commute'], volume: '24L', weather: ['Weather resistant'], inStock: true,
  },
  {
    id: 2, name: 'Citizen 15L Messenger', price: 160, rating: 4.2, reviews: 39,
    colors: [{ name: 'Black', hex: '#000' }, { name: 'Steel Blue', hex: '#709C9C' }, { name: 'Black XRF', hex: '#555' }, { name: 'Coyote X', hex: '#B8A37F' }],
    gradientFrom: 'from-slate-700', gradientTo: 'to-slate-900',
    tags: ['courier', 'work & commute'], volume: '15L', weather: ['Weather resistant'], inStock: true,
  },
  {
    id: 3, name: 'Barrage 5L Sling', price: 85, rating: 4.4, reviews: 22,
    colors: [{ name: 'Black X', hex: '#000' }, { name: 'Mauve X', hex: '#de97ce' }, { name: 'Moss X', hex: '#7a9460' }],
    gradientFrom: 'from-zinc-700', gradientTo: 'to-zinc-900',
    tags: ['travel', 'work & commute'], volume: '5L', weather: ['Weather resistant'], inStock: true,
  },
  {
    id: 4, name: 'Barrage 18L Pack', price: 155, rating: 4.4, reviews: 28,
    colors: [{ name: 'Black', hex: '#000' }, { name: 'Black XRF', hex: '#555' }, { name: 'Moss X', hex: '#7a9460' }],
    gradientFrom: 'from-zinc-800', gradientTo: 'to-zinc-950',
    tags: ['weekend getaway', 'work & commute', 'rolltop'], volume: '18L', weather: ['Weather resistant with tarp liner'], inStock: true,
  },
  {
    id: 5, name: 'Kadet Max 15L Sling', price: 155, rating: 4.7, reviews: 323,
    colors: [{ name: 'Black Canvas Leather', hex: '#000' }, { name: 'J Prince', hex: '#c084fc', isPattern: true }, { name: 'Black', hex: '#000' }, { name: 'Steel Blue', hex: '#709C9C' }],
    gradientFrom: 'from-stone-700', gradientTo: 'to-stone-900',
    tags: ['travel', 'work & commute'], volume: '15L', weather: ['Weather resistant'], inStock: true,
  },
  {
    id: 6, name: 'Kadet 9L Sling', price: 100, rating: 4.7, reviews: 874,
    colors: [{ name: 'Steel Blue', hex: '#709C9C' }, { name: 'Black Canvas Leather', hex: '#000' }, { name: 'Black XRF', hex: '#555' }, { name: 'Black', hex: '#000' }],
    gradientFrom: 'from-teal-700', gradientTo: 'to-teal-900',
    tags: ['travel', 'work & commute'], volume: '9L', weather: ['Weather resistant'], inStock: true,
  },
  {
    id: 7, name: 'Mini Kadet 5L Sling', price: 80, rating: 4.6, reviews: 191,
    colors: [{ name: 'Black', hex: '#000' }, { name: 'Black XRF', hex: '#555' }, { name: 'Steel Blue', hex: '#709C9C' }, { name: 'Black Canvas Leather', hex: '#000' }],
    gradientFrom: 'from-neutral-700', gradientTo: 'to-neutral-900',
    tags: ['travel'], volume: '5L', weather: ['Weather resistant'], inStock: true,
  },
  {
    id: 8, name: 'Kadet WP Sling', price: 140, rating: 4.1, reviews: 21,
    colors: [{ name: 'Black', hex: '#000' }, { name: 'Future White', hex: '#f2efe1' }],
    gradientFrom: 'from-sky-700', gradientTo: 'to-sky-900',
    tags: ['everyday carry', 'work & commute', 'Waterproof'], volume: '9L', weather: ['Waterproof'], inStock: true,
  },
  {
    id: 9, name: 'Kadet Max WP Sling', price: 175, rating: 4.0, reviews: 46,
    colors: [{ name: 'Future White', hex: '#f2efe1' }, { name: 'Black', hex: '#000' }],
    gradientFrom: 'from-slate-600', gradientTo: 'to-slate-800',
    tags: ['work & commute', 'Waterproof'], volume: '15L', weather: ['Waterproof'], inStock: true,
  },
  {
    id: 10, name: 'Mini Kadet WP Sling', price: 110, rating: 3.9, reviews: 18,
    colors: [{ name: 'Future White', hex: '#f2efe1' }, { name: 'Black', hex: '#000' }],
    gradientFrom: 'from-indigo-700', gradientTo: 'to-indigo-900',
    tags: ['work & commute', 'Waterproof'], volume: '5L', weather: ['Waterproof'], inStock: true,
  },
  {
    id: 11, name: 'Barrage 22L Pack', price: 170, rating: 4.6, reviews: 68,
    colors: [{ name: 'Black', hex: '#000' }, { name: 'Black XRF', hex: '#555' }],
    gradientFrom: 'from-zinc-700', gradientTo: 'to-zinc-900',
    tags: ['exercise & gym', 'travel', 'weekend getaway', 'work & commute', 'rolltop'], volume: '22L', weather: ['Weather resistant with tarp liner'], inStock: true,
  },
  {
    id: 12, name: 'Barrage 2L Sling', price: 50, rating: 4.7, reviews: 16,
    compareAtPrice: 50,
    colors: [{ name: 'Black X', hex: '#000' }, { name: 'Moss X', hex: '#7a9460' }, { name: 'Mauve X', hex: '#de97ce' }],
    gradientFrom: 'from-zinc-600', gradientTo: 'to-zinc-800',
    tags: ['everyday carry', 'festivals', 'travel'], volume: '2L', weather: ['Weather resistant'], inStock: true,
  },
  {
    id: 13, name: 'Barrage 34L Pack', price: 225, rating: 4.5, reviews: 31,
    colors: [{ name: 'Black', hex: '#000' }, { name: 'Black XRF', hex: '#555' }],
    gradientFrom: 'from-stone-800', gradientTo: 'to-stone-950',
    tags: ['courier', 'travel', 'weekend getaway', 'work & commute'], volume: '34L', weather: ['Weather resistant with tarp liner'], inStock: true,
  },
  {
    id: 14, name: 'Extlek 24L Pack', price: 120, rating: 3.8, reviews: 5,
    colors: [{ name: 'Black', hex: '#000' }, { name: 'Black X', hex: '#222' }],
    gradientFrom: 'from-gray-700', gradientTo: 'to-gray-900',
    tags: [], volume: '24L', weather: ['Weather resistant'], inStock: true,
  },
  {
    id: 15, name: 'Warsaw 30L Pack', price: 165, rating: 4.2, reviews: 29,
    colors: [{ name: 'Black', hex: '#000' }, { name: 'Coyote X', hex: '#B8A37F' }, { name: 'Black XRF', hex: '#555' }],
    gradientFrom: 'from-slate-700', gradientTo: 'to-slate-900',
    tags: ['travel', 'work & commute'], volume: '30L', weather: ['Weather resistant'], inStock: true,
  },
  {
    id: 16, name: 'Urban Ex 20L Pack', price: 150, rating: 4.1, reviews: 30,
    colors: [{ name: 'Black', hex: '#000' }],
    gradientFrom: 'from-zinc-700', gradientTo: 'to-zinc-950',
    tags: ['travel', 'work & commute', 'rolltop'], volume: '20L', weather: ['Waterproof'], inStock: true,
  },
  {
    id: 17, name: 'Urban Ex 30L Pack', price: 165, rating: 3.8, reviews: 34,
    colors: [{ name: 'Black', hex: '#000' }, { name: 'Future White', hex: '#f2efe1' }],
    gradientFrom: 'from-neutral-700', gradientTo: 'to-neutral-900',
    tags: ['travel', 'work & commute', 'rolltop'], volume: '30L', weather: ['Waterproof'], inStock: true,
  },
  {
    id: 18, name: 'Pac Pouch 2L', price: 40, rating: 4.0, reviews: 3,
    colors: [{ name: 'Matte Black', hex: '#111' }, { name: 'Black Canvas Leather', hex: '#000' }],
    gradientFrom: 'from-zinc-600', gradientTo: 'to-zinc-800',
    tags: [], volume: '2L', weather: ['Weather resistant'], inStock: true,
  },
  {
    id: 19, name: 'Bot Flap 5L Sling', price: 90, rating: 4.9, reviews: 7,
    colors: [{ name: 'Matte Black', hex: '#111' }, { name: 'Black Canvas Leather', hex: '#000' }],
    gradientFrom: 'from-stone-700', gradientTo: 'to-stone-900',
    tags: [], volume: '5L', weather: ['Weather resistant'], inStock: true,
  },
  {
    id: 20, name: 'Pac Shoulder Pouch 3L', price: 65, rating: 5.0, reviews: 4,
    colors: [{ name: 'Matte Black', hex: '#111' }, { name: 'Black Canvas Leather', hex: '#000' }],
    gradientFrom: 'from-gray-600', gradientTo: 'to-gray-800',
    tags: [], volume: '3L', weather: ['Weather resistant'], inStock: true,
  },
  {
    id: 21, name: 'Holman Handlebar Bag', price: 55, rating: 5.0, reviews: 6,
    colors: [{ name: 'Black XRF', hex: '#555' }],
    gradientFrom: 'from-emerald-700', gradientTo: 'to-emerald-900',
    tags: ['bike bag', 'work & commute'], volume: '1.5L', weather: ['Weather resistant'], inStock: true,
  },
  {
    id: 22, name: 'Holman Top Tube Bag', price: 45, rating: 3.3, reviews: 6,
    colors: [{ name: 'Black XRF', hex: '#555' }],
    gradientFrom: 'from-teal-700', gradientTo: 'to-teal-900',
    tags: ['bike bag', 'work & commute'], volume: '1.5L', weather: ['Weather resistant'], inStock: true,
  },
  {
    id: 23, name: 'Holman Frame Bag L/XL', price: 65, rating: 4.8, reviews: 6,
    colors: [{ name: 'Black XRF', hex: '#555' }],
    gradientFrom: 'from-cyan-700', gradientTo: 'to-cyan-900',
    tags: ['bike bag', 'work & commute'], volume: '1.5L', weather: ['Weather resistant'], inStock: true,
  },
  {
    id: 24, name: 'Holman Frame Bag S/M', price: 60, rating: 3.0, reviews: 4,
    colors: [{ name: 'Black XRF', hex: '#555' }, { name: 'Black', hex: '#000' }],
    gradientFrom: 'from-blue-700', gradientTo: 'to-blue-900',
    tags: ['bike bag', 'work & commute'], volume: '1.5L', weather: ['Weather resistant'], inStock: true,
  },
]

export const COLOR_FILTERS = [
  { name: 'Black', hex: '#000000' },
  { name: 'Steel Blue', hex: '#709C9C' },
  { name: 'Coyote X', hex: '#B8A37F' },
  { name: 'Future White', hex: '#f2efe1' },
  { name: 'Mauve X', hex: '#de97ce' },
  { name: 'Moss X', hex: '#7a9460' },
  { name: 'Black XRF', hex: '#555555' },
  { name: 'Matte Black', hex: '#111111' },
]

export const ACTIVITY_FILTERS = [
  'bike bag', 'courier', 'everyday carry', 'exercise & gym',
  'festivals', 'travel', 'weekend getaway', 'work & commute', 'rolltop',
]

export const VOLUME_FILTERS = ['0 - 10 Liters', '11 - 20 Liters', '21 - 30 Liters', '31+ Liters']

export const WEATHER_FILTERS = [
  'Water resistant', 'Waterproof', 'Weather resistant', 'Weather resistant with tarp liner',
]

export const SORT_OPTIONS = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Best Rating', value: 'rating' },
  { label: 'Most Reviews', value: 'reviews' },
]

export const SUB_CATEGORIES = [
  { label: 'COMMUTE', href: '#commute' },
  { label: 'WATERPROOF', href: '#waterproof' },
  { label: 'TRAVEL', href: '#travel' },
  { label: 'ON-BIKE', href: '#on-bike' },
  { label: 'BAG FINDER QUIZ', href: '#quiz' },
]
