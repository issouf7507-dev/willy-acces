const messages = [
  'LIVRAISON OFFERTE DÈS 50 000 FCFA',
  'EMPORTEZ L’ESSENTIEL PARTOUT',
  'NOUVEAUTÉS DISPONIBLES',
]

export default function AnnouncementBar() {
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
