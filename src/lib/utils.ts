import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formate un prix en FCFA (devise de la boutique). Ex : 25000 → "25 000 FCFA". */
export function formatPrice(value: number | string | null | undefined): string {
  const n = Number(value ?? 0)
  return `${new Intl.NumberFormat('fr-FR').format(Math.round(n))} FCFA`
}
