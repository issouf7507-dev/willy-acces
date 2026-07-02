interface Collection {
  name: string
  href: string
  gradient: string
}

interface Props {
  collections: Collection[]
}

export default function CollectionGrid({ collections }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-5 md:px-12 pb-10 max-w-[1600px] mx-auto">
      {collections.map((col) => (
        <a
          key={col.name}
          href={col.href}
          className="group relative aspect-square overflow-hidden block"
        >
          {/* Background */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${col.gradient} transition-transform duration-700 group-hover:scale-105`}
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors duration-300" />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 gap-3">
            <h3 className="text-white text-3xl font-black uppercase tracking-widest drop-shadow-md">
              {col.name}
            </h3>
            <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center group-hover:bg-white transition-colors">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 2.5L10 7l-5 4.5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}
