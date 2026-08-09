import { Link } from 'react-router-dom'

interface Collection {
  name: string
  href: string
  /** Repli quand la catégorie n'a pas d'image en back-office. */
  gradient: string
  image?: string | null
}

interface Props {
  collections: Collection[]
}

export default function CollectionGrid({ collections }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-5 md:px-12 pb-10 max-w-[1600px] mx-auto">
      {collections.map((col) => (
        <Link
          key={col.name}
          to={col.href}
          className="group relative aspect-square overflow-hidden block"
        >
          {/* Background : image de la catégorie, dégradé sinon */}
          {col.image ? (
            <img
              src={col.image}
              alt={col.name}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div
              className={`absolute inset-0 bg-gradient-to-br ${col.gradient} transition-transform duration-700 group-hover:scale-105`}
            />
          )}

          {/* Overlay — un peu plus dense sur photo pour garder le titre lisible */}
          <div
            className={`absolute inset-0 transition-colors duration-300 ${
              col.image
                ? 'bg-gradient-to-t from-black/70 via-black/25 to-black/10 group-hover:from-black/80'
                : 'bg-black/20 group-hover:bg-black/35'
            }`}
          />

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
        </Link>
      ))}
    </div>
  )
}
