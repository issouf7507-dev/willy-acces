import { useState } from 'react'
import { Link } from 'react-router-dom'
import AnnouncementBar from '../components/AnnouncementBar'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { subscribe } from '../lib/storefront'

const inputClass =
  'w-full px-3.5 py-2.5 text-sm border border-zinc-300 focus:border-black focus:outline-none bg-white transition-colors'
const labelClass = 'block text-xs font-bold uppercase tracking-wide text-zinc-700 mb-1.5'

/** Ce que l'inscription apporte, dit en clair avant de demander des coordonnées. */
const BENEFITS = [
  {
    title: 'Nouveautés en avant-première',
    text: 'Vous êtes prévenu dès qu’un produit arrive ou revient en stock.',
  },
  {
    title: 'Promotions réservées',
    text: 'Les remises et ventes flash partent d’abord aux inscrits.',
  },
  {
    title: 'Jeux et tirages au sort',
    text: 'Les jeux concours sont ouverts aux inscrits : votre numéro suffit pour participer.',
  },
]

interface FormState {
  firstName: string
  lastName: string
  phone: string
  email: string
}

const EMPTY: FormState = { firstName: '', lastName: '', phone: '', email: '' }

export default function Inscription() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const set = (key: keyof FormState, value: string) =>
    setForm(f => ({ ...f, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) {
      setError('Merci de renseigner votre prénom, votre nom et votre téléphone.')
      return
    }

    setSending(true)
    try {
      await subscribe({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
      })
      setDone(true)
      setForm(EMPTY)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inscription impossible pour le moment.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AnnouncementBar />
      <Header />

      <main className="flex-1">
        <section className="bg-black text-white">
          <div className="max-w-[900px] mx-auto px-5 md:px-12 py-16 md:py-24">
            <p className="text-xs font-bold uppercase tracking-widest text-[#FFEA3B] mb-4">
              Communauté Willy
            </p>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-none">
              Inscrivez-vous
            </h1>
            <p className="text-sm text-zinc-400 max-w-md mt-6 leading-relaxed">
              Notifications, promotions et jeux concours. Pas de compte à créer, pas de mot de
              passe : votre nom et votre numéro suffisent.
            </p>
          </div>
        </section>

        <div className="max-w-[900px] mx-auto px-5 md:px-12 py-12 md:py-16">
          <div className="grid md:grid-cols-[1fr_320px] gap-10 items-start">
            {/* Formulaire */}
            <div className="order-2 md:order-1">
              {done ? (
                <div className="border border-zinc-200 p-8 md:p-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                    <svg
                      width="30"
                      height="30"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#059669"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-black uppercase mb-2">C'est fait</h2>
                  <p className="text-sm text-zinc-500 mb-6">
                    Vous êtes inscrit. Nous vous préviendrons des nouveautés, des promotions et
                    des jeux à venir.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Link
                      to="/products"
                      className="px-6 py-3 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                    >
                      Voir la boutique
                    </Link>
                    <button
                      onClick={() => setDone(false)}
                      className="px-6 py-3 border border-zinc-300 text-sm font-bold uppercase tracking-widest hover:border-black transition-colors"
                    >
                      Inscrire quelqu'un d'autre
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="border border-zinc-200 p-6 md:p-8 space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} htmlFor="s-firstname">
                        Prénom *
                      </label>
                      <input
                        id="s-firstname"
                        className={inputClass}
                        value={form.firstName}
                        onChange={e => set('firstName', e.target.value)}
                        autoComplete="given-name"
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="s-lastname">
                        Nom *
                      </label>
                      <input
                        id="s-lastname"
                        className={inputClass}
                        value={form.lastName}
                        onChange={e => set('lastName', e.target.value)}
                        autoComplete="family-name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="s-phone">
                      Téléphone / WhatsApp *
                    </label>
                    <input
                      id="s-phone"
                      type="tel"
                      className={inputClass}
                      value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                      autoComplete="tel"
                      placeholder="07 01 02 03 04"
                      required
                    />
                    <p className="text-xs text-zinc-400 mt-1.5">
                      C'est par là que passent les annonces et les jeux.
                    </p>
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="s-email">
                      E-mail (facultatif)
                    </label>
                    <input
                      id="s-email"
                      type="email"
                      className={inputClass}
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      autoComplete="email"
                    />
                  </div>

                  {error && (
                    <p role="alert" className="text-sm text-red-600">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full py-4 bg-[#FFEA3B] text-zinc-900 text-sm font-bold uppercase tracking-widest border-2 border-[#FFEA3B] hover:bg-yellow-300 hover:border-yellow-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {sending ? 'Inscription…' : "Je m'inscris"}
                  </button>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Vos coordonnées servent uniquement aux annonces de la boutique. Elles ne sont
                    ni vendues ni transmises. Vous pouvez demander votre retrait à tout moment.
                  </p>
                </form>
              )}
            </div>

            {/* Avantages */}
            <ul className="order-1 md:order-2 space-y-6">
              {BENEFITS.map(b => (
                <li key={b.title}>
                  <h2 className="font-black uppercase tracking-tight text-sm text-zinc-900 mb-1">
                    {b.title}
                  </h2>
                  <p className="text-sm text-zinc-500 leading-relaxed">{b.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
