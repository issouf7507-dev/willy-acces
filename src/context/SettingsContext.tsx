import { createContext, useContext, useEffect, useState } from 'react'
import { fetchSettings } from '../lib/storefront'

/**
 * Réglages boutique édités depuis /admin/settings (table `store_settings`).
 * Chargés une seule fois au montage de l'app et partagés : la barre d'annonce,
 * le pied de page et le tunnel de commande lisent tous cette même source.
 */
export interface StoreSettingsValue {
  storeName?: string
  announcement?: string
  contactEmail?: string
  contactPhone?: string
  whatsappNumber?: string
  freeShippingThreshold?: number
}

interface SettingsContextValue {
  settings: StoreSettingsValue
  /** `false` tant que l'appel API n'a pas abouti (ou échoué). */
  loaded: boolean
}

const SettingsContext = createContext<SettingsContextValue>({ settings: {}, loaded: false })

/** Les valeurs arrivent en JSON non typé : on normalise vers des chaînes/nombres. */
function asString(v: unknown): string | undefined {
  if (typeof v === 'string') return v.trim() || undefined
  if (typeof v === 'number') return String(v)
  return undefined
}

function asNumber(v: unknown): number | undefined {
  if (typeof v === 'number') return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StoreSettingsValue>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetchSettings()
      .then((raw) => {
        setSettings({
          storeName: asString(raw.storeName),
          announcement: asString(raw.announcement),
          contactEmail: asString(raw.contactEmail),
          contactPhone: asString(raw.contactPhone),
          whatsappNumber: asString(raw.whatsappNumber),
          freeShippingThreshold: asNumber(raw.freeShippingThreshold),
        })
      })
      // Réglages indisponibles : chaque consommateur masque simplement sa zone.
      .catch(() => setSettings({}))
      .finally(() => setLoaded(true))
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, loaded }}>{children}</SettingsContext.Provider>
  )
}

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext)
}
