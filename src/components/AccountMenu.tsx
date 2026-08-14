import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { DEFAULT_WHATSAPP_NUMBER, whatsappHref } from '../lib/whatsapp'

/**
 * Menu de l'icône « compte ». La boutique commande en invité (nom + WhatsApp,
 * cf. Checkout) : il n'y a pas d'espace client à ouvrir. Le bouton sert donc
 * d'accès rapide au suivi de commande et à l'aide, plutôt que de rester inerte.
 */
export default function AccountMenu() {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { settings } = useSettings()

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const trackingHref = whatsappHref(
    settings.whatsappNumber || DEFAULT_WHATSAPP_NUMBER,
    'Bonjour, je souhaite avoir des nouvelles de ma commande.',
  )

  const itemClass =
    'block px-4 py-3 text-sm font-bold uppercase tracking-wide hover:bg-zinc-50 transition-colors'

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        className="hidden md:flex p-2 hover:opacity-60 transition-opacity"
        aria-label="Compte"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="7" r="4" />
          <path
            d="M3.5 19c1.421-2.974 4.247-5 7.5-5s6.079 2.026 7.5 5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-60 bg-white border border-zinc-200 shadow-lg py-1 z-50"
        >
          <a
            href={trackingHref}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            Suivi de commande
          </a>
          <Link to="/faq" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
            Aide &amp; FAQ
          </Link>
          <Link
            to="/inscription"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            S'inscrire
          </Link>
        </div>
      )}
    </div>
  )
}
