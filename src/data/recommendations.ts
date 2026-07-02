export interface RecoProduct {
  id: number
  name: string
  price: number
  compareAtPrice?: number
  gradient: string
}

export const RECOMMENDATIONS: RecoProduct[] = [
  { id: 101, name: 'Mini Buckle Keychain', price: 25, gradient: 'bg-zinc-200' },
  { id: 102, name: 'Logo Snapback Hat', price: 35, gradient: 'bg-stone-200' },
  { id: 103, name: 'Chrome Purist Water Bottle', price: 15, gradient: 'bg-slate-100' },
  { id: 104, name: 'Mini Buckle Sternum Strap', price: 30, gradient: 'bg-zinc-100' },
  { id: 105, name: 'Large Utility Pouch', price: 18, gradient: 'bg-neutral-200' },
  { id: 106, name: 'Merino Crew Socks', price: 18.75, compareAtPrice: 25, gradient: 'bg-gray-100' },
  { id: 107, name: 'Cycling Gloves 2.0', price: 37, gradient: 'bg-zinc-200' },
  { id: 108, name: 'Reflective Laces', price: 4.99, compareAtPrice: 10, gradient: 'bg-slate-100' },
  { id: 109, name: 'Seatbelt Buckle LG (2")', price: 38, gradient: 'bg-stone-100' },
  { id: 110, name: 'Seatbelt Buckle MD (1.5")', price: 32, gradient: 'bg-zinc-100' },
]
