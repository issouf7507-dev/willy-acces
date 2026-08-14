import logoUrl from '../assets/logo.webp'

/**
 * Marque « Willy Accessoires ».
 *
 * Le logo est un badge circulaire sombre sur fond transparent : il n'est lisible
 * que sur un fond clair. Sur un fond sombre (sidebar admin, hero de connexion),
 * utiliser `onDark` qui pose le badge sur une pastille blanche.
 */
export default function Logo({
  className = 'h-10',
  onDark = false,
  alt = 'Willy Accessoires',
}: {
  /** Classes de dimension appliquées à l'image (ex. `h-12`). */
  className?: string
  /** Ajoute une pastille blanche derrière le badge pour les fonds sombres. */
  onDark?: boolean
  alt?: string
}) {
  const img = (
    <img
      src={logoUrl}
      alt={alt}
      className={`${className} w-auto object-contain select-none`}
      draggable={false}
    />
  )

  if (!onDark) return img

  return <span className="inline-flex items-center justify-center rounded-full bg-white p-0.5">{img}</span>
}
