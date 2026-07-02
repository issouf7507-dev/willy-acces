import AnnouncementBar from '../components/AnnouncementBar'
import Header from '../components/Header'
import Hero from '../components/Hero'
import SectionTitle from '../components/SectionTitle'
import CollectionGrid from '../components/CollectionGrid'
import FeaturedProducts from '../components/FeaturedProducts'
import Testimonials from '../components/Testimonials'
import ImageBanner from '../components/ImageBanner'
import Footer from '../components/Footer'

const mainCollections = [
  { name: 'Slings', href: '#', gradient: 'from-zinc-700 to-zinc-900' },
  { name: 'Add-Ons', href: '#', gradient: 'from-slate-600 to-slate-800' },
  { name: 'Pack It Up', href: '#', gradient: 'from-stone-600 to-stone-900' },
]

const featureCollections = [
  { name: 'Reflect', href: '#', gradient: 'from-indigo-800 to-indigo-950' },
  { name: 'Commute', href: '#', gradient: 'from-emerald-700 to-emerald-950' },
  { name: 'Repel', href: '#', gradient: 'from-sky-700 to-sky-950' },
]

const bestsellers = [
  { id: 1, name: 'Kadet Max 15L Sling', price: 155, rating: 4.7, reviews: 323, colors: ['#000', '#709C9C', '#B8A37F'] },
  { id: 2, name: 'Barrage 22L Pack', price: 170, rating: 4.6, reviews: 68, colors: ['#000', '#888'] },
  { id: 3, name: 'Kadet 9L Sling', price: 100, rating: 4.7, reviews: 874, colors: ['#709C9C', '#000', '#888'] },
  { id: 4, name: 'Citizen 24L Messenger', price: 170, rating: 4.1, reviews: 69, colors: ['#000', '#888', '#B8A37F', '#709C9C'] },
  { id: 5, name: 'Cohesive 2.0 38L Pack', price: 140, rating: 4.6, reviews: 17, colors: ['#000'] },
  { id: 6, name: 'Mini Buckle Keychain', price: 25, rating: 4.0, reviews: 83, colors: ['#000', '#C0C0C0'] },
  { id: 7, name: 'Mini Kadet 5L Sling', price: 80, rating: 4.6, reviews: 191, colors: ['#000', '#888', '#709C9C'] },
  { id: 8, name: 'Barrage 5L Sling', price: 85, rating: 4.4, reviews: 22, colors: ['#000', '#de97ce', '#7a9460'] },
]

const backpacks = [
  { id: 9, name: 'Urban Ex 20L Pack', price: 150, rating: 4.1, reviews: 30, colors: ['#000'] },
  { id: 10, name: 'Barrage 22L Pack', price: 170, rating: 4.6, reviews: 68, colors: ['#000'] },
  { id: 11, name: 'Extlek 24L Pack', price: 120, rating: 3.8, reviews: 5, colors: ['#000'] },
  { id: 12, name: 'Warsaw 30L Pack', price: 165, rating: 4.2, reviews: 29, colors: ['#000', '#B8A37F'] },
  { id: 13, name: 'Barrage 18L Pack', price: 155, rating: 4.4, reviews: 28, colors: ['#000', '#888', '#7a9460'] },
  { id: 14, name: 'Urban Ex 30L Pack', price: 165, rating: 3.8, reviews: 34, colors: ['#000', '#f2efe1'] },
  { id: 15, name: 'Barrage 34L Pack', price: 225, rating: 4.5, reviews: 31, colors: ['#000'] },
  { id: 16, name: 'Barrage Pro 80L Pack', price: 300, rating: 4.8, reviews: 6, colors: ['#000'] },
]

const testimonials = [
  { text: "Pssssh this bag is so dope! Great size, bomber construction, A+ design.", author: "Forever O.", rating: 5 },
  { text: "Chrome's lifetime guarantee is the REAL DEAL. I love this new messenger bag. It is perfect!", author: "Nancy B.", rating: 4 },
  { text: "I love the waterproofness and how versatile this bag is. Your back will break before the bag.", author: "John H.", rating: 4 },
  { text: "I own both clip and no-clip Chrome shoes — super comfy, insane durability, perfect functionality.", author: "Owen E.", rating: 5 },
  { text: "I'm impressed. Fast delivery and top quality. Thx!", author: "Mauricio R.", rating: 5 },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <AnnouncementBar />
      <Header />

      <main>
        {/* Hero */}
        <Hero />

        {/* Tagline */}
        <div className="py-10 text-center border-b border-zinc-100">
          <p className="text-lg md:text-2xl font-black uppercase tracking-tight text-zinc-900 px-5">
            <strong>Made for What's Ahead.</strong> Since 1995.
          </p>
        </div>

        {/* Main category grid */}
        <div className="pt-10">
          <CollectionGrid collections={mainCollections} />
        </div>

        {/* Best sellers */}
        <SectionTitle eyebrow="Most Carried" subtitle="Proven favorites, carried daily." />
        <FeaturedProducts products={bestsellers} />

        {/* Collaboration banner */}
        <ImageBanner
          eyebrow="CHROME X J. PRINCE"
          title="Ride With Pride"
          cta={{ label: 'Discover the Collection', href: '#' }}
          gradient="from-purple-900 via-zinc-900 to-black"
        />

        {/* Reviews */}
        <SectionTitle eyebrow="9K+ reviews that prove the gear lives up to the hype" />
        <Testimonials testimonials={testimonials} />

        {/* Feature collections */}
        <CollectionGrid collections={featureCollections} />

        {/* Backpacks */}
        <SectionTitle eyebrow="We've got your back" subtitle="From the commute to the weekend." />
        <FeaturedProducts products={backpacks} />

        {/* Final CTA banner */}
        <ImageBanner
          title="Move Your Way"
          subtitle="Explore the stories of these inspirational movers in our communities and see what it means to move your way."
          cta={{ label: 'Watch Their Stories', href: '#' }}
          accent
          gradient="from-zinc-700 via-zinc-900 to-black"
        />
      </main>

      <Footer />
    </div>
  )
}
