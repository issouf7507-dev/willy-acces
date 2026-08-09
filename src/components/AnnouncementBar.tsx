import { useSettings } from '../context/SettingsContext'

/**
 * Bandeau défilant du haut de page. Le texte vient du réglage `announcement`
 * (/admin/settings) : plusieurs messages peuvent être séparés par un « | ».
 * Aucun message configuré → le bandeau ne s'affiche pas du tout.
 */
export default function AnnouncementBar() {
  const { settings } = useSettings()

  const messages = (settings.announcement ?? '')
    .split('|')
    .map((m) => m.trim())
    .filter(Boolean)

  if (messages.length === 0) return null

  // On triple la liste pour que le défilement continu n'ait pas de trou.
  const items = [...messages, ...messages, ...messages]

  return (
    <div className="bg-zinc-900 text-white py-2.5 overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap">
        {items.map((msg, i) => (
          <span key={i} className="flex items-center shrink-0">
            <span className="text-xs font-bold uppercase tracking-widest px-8">{msg}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />
          </span>
        ))}
      </div>
    </div>
  )
}
