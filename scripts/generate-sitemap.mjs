/**
 * Génère `dist/sitemap.xml` après le build.
 *
 * Les pages fixes sont écrites systématiquement ; les fiches produit sont
 * ajoutées si l'API répond au moment du build (VITE_API_BASE, ou
 * http://localhost:3001 en local). Si elle ne répond pas, le sitemap sort
 * quand même avec les pages fixes plutôt que d'échouer le build — un sitemap
 * partiel vaut mieux qu'un déploiement bloqué.
 *
 * Le catalogue bougeant plus vite que les déploiements, penser à relancer un
 * build après un ajout de produits (ou à servir le sitemap depuis l'API).
 */
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const SITE_URL = (process.env.VITE_SITE_URL || 'https://willyaccessoire.com').replace(/\/$/, '')
const API_BASE = (process.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/$/, '')

/** Même règle que `nameToHandle` côté application (accents translittérés). */
function nameToHandle(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/products', priority: '0.9', changefreq: 'daily' },
  { path: '/collections/new-arrivals', priority: '0.8', changefreq: 'weekly' },
  { path: '/collections/produits-a-venir', priority: '0.7', changefreq: 'weekly' },
  { path: '/collections/bags', priority: '0.7', changefreq: 'weekly' },
  { path: '/accessories', priority: '0.7', changefreq: 'weekly' },
  { path: '/salon-de-beaute', priority: '0.7', changefreq: 'monthly' },
  { path: '/faq', priority: '0.5', changefreq: 'monthly' },
  { path: '/inscription', priority: '0.5', changefreq: 'monthly' },
]

async function fetchProducts() {
  try {
    const res = await fetch(`${API_BASE}/api/products?limit=100&isActive=true`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    return json?.data?.items ?? []
  } catch (err) {
    console.warn(`[sitemap] catalogue ignoré (${err.message}) — pages fixes seulement`)
    return []
  }
}

const products = await fetchProducts()
const today = new Date().toISOString().slice(0, 10)

const urls = [
  ...STATIC_PAGES.map(p => ({ loc: `${SITE_URL}${p.path}`, ...p })),
  ...products.map(p => ({
    loc: `${SITE_URL}/products/${p.slug || nameToHandle(p.name)}`,
    lastmod: p.updatedAt ? p.updatedAt.slice(0, 10) : today,
    priority: '0.8',
    changefreq: 'weekly',
  })),
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod ?? today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`

await writeFile(resolve('dist/sitemap.xml'), xml, 'utf8')
console.log(`[sitemap] ${urls.length} URL écrites (dont ${products.length} produits)`)
