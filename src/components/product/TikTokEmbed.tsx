/**
 * Lecteur TikTok intégré à la fiche produit.
 *
 * On pointe directement l'iframe officielle (`/embed/v2/<id>`) au lieu de
 * charger `https://www.tiktok.com/embed.js` : ce script réécrit le DOM de la
 * page et suit le visiteur sur toute la boutique, alors qu'il ne sert qu'à
 * fabriquer cette même iframe.
 *
 * Les liens courts (vm.tiktok.com/…) ne portent pas l'identifiant de la vidéo :
 * on ne peut pas les jouer sur place, ils gardent donc le simple lien sortant.
 */

/** Extrait l'identifiant numérique d'une URL TikTok, s'il y figure. */
function tiktokVideoId(url: string): string | null {
  const match = url.match(/\/video\/(\d+)/) ?? url.match(/[?&]item_id=(\d+)/)
  return match?.[1] ?? null
}

export default function TikTokEmbed({ url }: { url: string }) {
  const videoId = tiktokVideoId(url)
  if (!videoId) return null

  return (
    <div className="mb-5 w-full max-w-[325px]">
      <iframe
        src={`https://www.tiktok.com/embed/v2/${videoId}`}
        title="Vidéo TikTok du produit"
        loading="lazy"
        allow="encrypted-media; picture-in-picture; fullscreen"
        className="w-full aspect-[325/740] border border-zinc-200"
      />
    </div>
  )
}
