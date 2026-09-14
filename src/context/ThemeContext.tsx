import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  /** Ce que la personne a choisi, `system` compris. */
  theme: Theme
  /** Ce qui s'applique réellement — `system` résolu. */
  resolved: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'admin_theme'

function readStored(): Theme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'dark'
  } catch {
    // Navigation privée ou stockage refusé : on démarre en sombre, qui est le
    // thème par défaut du back-office.
    return 'dark'
  }
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-color-scheme: dark)').matches === true
}

/**
 * Thème du back-office.
 *
 * Il ne touche pas à `<html>` : la classe est posée par `AdminLayout` sur son
 * propre conteneur, pour que la vitrine garde son apparence quoi qu'il arrive.
 * C'est aussi pour ça que « système » est résolu ici en JavaScript plutôt que
 * par une media query CSS, qui s'appliquerait à tout le site.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStored)
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  // La préférence système peut changer pendant la session (coucher du soleil,
  // bascule manuelle de macOS) : on suit le média plutôt que de le lire une fois.
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Le choix vaut alors pour la session en cours.
    }
  }, [])

  const resolved: 'light' | 'dark' =
    theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  const value = useMemo(() => ({ theme, resolved, setTheme }), [theme, resolved, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/**
 * Hors du fournisseur, on renvoie le thème clair sans lever : un composant
 * partagé avec la vitrine ne doit pas faire tomber la page.
 */
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext) ?? {
    theme: 'light',
    resolved: 'light',
    setTheme: () => {},
  }
}
