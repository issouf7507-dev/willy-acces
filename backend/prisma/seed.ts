import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import bcrypt from 'bcryptjs'
import { config } from 'dotenv'

import { BAGS } from '../../src/data/bags'
import { ACCESSORIES } from '../../src/data/accessories'
import { PREORDERS } from '../../src/data/preorders'

config()

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const usedSlugs = new Set<string>()
function uniqueSlug(name: string, legacyId: number): string {
  let slug = slugify(name)
  if (usedSlugs.has(slug)) slug = `${slug}-${legacyId}`
  usedSlugs.add(slug)
  return slug
}

async function seedAdmin() {
  const email = 'admin@willy-accesoire.com'
  const password = 'Admin1234!'
  const hashed = await bcrypt.hash(password, 12)

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN', password: hashed },
    create: { name: 'Admin', email, password: hashed, role: 'ADMIN' },
  })

  console.log('✅ Admin :')
  console.log(`   ${user.email} / ${password} (${user.role})`)
}

async function seedCategories() {
  const defs = [
    { name: 'Sacs', slug: 'sacs', sortOrder: 1 },
    { name: 'Accessoires', slug: 'accessoires', sortOrder: 2 },
    { name: 'Salon de beauté', slug: 'salon-de-beaute', sortOrder: 3 },
  ]
  const map: Record<string, string> = {}
  for (const d of defs) {
    const cat = await prisma.category.upsert({
      where: { slug: d.slug },
      update: { name: d.name, sortOrder: d.sortOrder, isActive: true },
      create: d,
    })
    map[d.slug] = cat.id
  }
  console.log(`✅ ${defs.length} catégories`)
  return map
}

async function seedProducts(cats: Record<string, string>) {
  // Repartir propre (base de dev)
  await prisma.product.deleteMany({})
  usedSlugs.clear()

  let count = 0

  // ── Sacs ──────────────────────────────────────────────────────────────────
  for (const b of BAGS) {
    await prisma.product.create({
      data: {
        name: b.name,
        slug: uniqueSlug(b.name, b.id),
        price: b.price,
        compareAtPrice: b.compareAtPrice,
        stock: b.inStock ? 25 : 0,
        currency: 'FCFA',
        categoryId: cats['sacs'],
        isActive: true,
        isFeatured: b.rating >= 4.6,
        isNew: !!b.isNew,
        tags: b.tags.join(','),
        metadata: {
          kind: 'bag',
          legacyId: b.id,
          gradientFrom: b.gradientFrom,
          gradientTo: b.gradientTo,
          colors: b.colors,
          rating: b.rating,
          reviews: b.reviews,
          volume: b.volume,
          weather: b.weather,
          tags: b.tags,
          badge: b.badge,
          soldOut: b.soldOut ?? false,
        },
      },
    })
    count++
  }

  // ── Accessoires ─────────────────────────────────────────────────────────────
  for (const a of ACCESSORIES) {
    await prisma.product.create({
      data: {
        name: a.name,
        slug: uniqueSlug(a.name, a.id),
        price: a.price,
        compareAtPrice: a.compareAtPrice,
        stock: 30,
        currency: 'FCFA',
        categoryId: cats['accessoires'],
        isActive: true,
        isFeatured: a.rating >= 4.6,
        tags: '',
        metadata: {
          kind: 'accessory',
          legacyId: a.id,
          gradientFrom: a.gradientFrom,
          gradientTo: a.gradientTo,
          colors: a.colors,
          rating: a.rating,
          reviews: a.reviews,
          accessoryCategory: a.category,
        },
      },
    })
    count++
  }

  // ── Précommandes ─────────────────────────────────────────────────────────────
  for (const p of PREORDERS) {
    await prisma.product.create({
      data: {
        name: p.name,
        slug: uniqueSlug(p.name, p.id),
        price: p.price,
        stock: 0,
        currency: 'FCFA',
        categoryId: cats['sacs'],
        isActive: true,
        isPreorder: true,
        releaseDate: new Date(p.releaseDate),
        tags: '',
        metadata: {
          kind: 'bag',
          legacyId: p.id,
          gradientFrom: p.gradientFrom,
          gradientTo: p.gradientTo,
          colors: p.colors,
          tagline: p.tagline,
        },
      },
    })
    count++
  }

  console.log(`✅ ${count} produits (${BAGS.length} sacs, ${ACCESSORIES.length} accessoires, ${PREORDERS.length} précommandes)`)
}

async function main() {
  await seedAdmin()
  const cats = await seedCategories()
  await seedProducts(cats)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
