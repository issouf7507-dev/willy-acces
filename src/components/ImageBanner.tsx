import { Link } from 'react-router-dom'

interface Props {
  eyebrow?: string
  title?: string
  subtitle?: string
  cta?: { label: string; href: string }
  accent?: boolean
  gradient?: string
  /** Photo de fond. Le dégradé sert alors de couleur d'attente pendant le chargement. */
  image?: string
  /** Texte alternatif de la photo. Décoratif (alt vide) si non fourni. */
  imageAlt?: string
}

export default function ImageBanner({
  eyebrow,
  title,
  subtitle,
  cta,
  accent = false,
  gradient = 'from-zinc-800 via-zinc-900 to-black',
  image,
  imageAlt,
}: Props) {
  return (
    <div className={`relative h-[60vh] min-h-[380px] bg-gradient-to-br ${gradient} flex items-center justify-center text-center overflow-hidden`}>
      {image && (
        <>
          <img
            src={image}
            alt={imageAlt ?? ''}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Voile sombre : sans lui, le texte blanc passe mal sur les zones claires. */}
          <div className="absolute inset-0 bg-black/50" />
        </>
      )}

      {/* Decorative pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Glow */}
      <div className="absolute inset-0 bg-radial from-white/5 via-transparent to-transparent" />

      <div className="relative z-10 max-w-2xl px-8">
        {eyebrow && (
          <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-white/50 mb-5">
            {eyebrow}
          </p>
        )}
        {title && (
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tight text-white mb-6 leading-none">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-sm md:text-base text-white/60 mb-8 max-w-sm mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}
        {cta && (
          <Link
            to={cta.href}
            className={`inline-block px-8 py-4 text-sm font-bold uppercase tracking-widest border-2 transition-all ${
              accent
                ? 'bg-[#FFEA3B] text-zinc-900 border-[#FFEA3B] hover:bg-yellow-300 hover:border-yellow-300'
                : 'border-white text-white hover:bg-white hover:text-black'
            }`}
          >
            {cta.label}
          </Link>
        )}
      </div>
    </div>
  )
}
