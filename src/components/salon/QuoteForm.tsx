import { useState } from 'react'
import {
  QUOTE_PRESTATIONS,
  QUOTE_OCCASIONS,
  QUOTE_LOCATIONS,
  QUOTE_BUDGETS,
} from '../../data/salon'

interface FormState {
  name: string
  phone: string
  email: string
  prestations: string[]
  occasion: string
  date: string
  location: string
  guests: string
  budget: string
  message: string
}

const EMPTY: FormState = {
  name: '', phone: '', email: '', prestations: [],
  occasion: '', date: '', location: 'salon', guests: '1',
  budget: '', message: '',
}

const inputClass =
  'w-full px-3.5 py-2.5 text-sm border border-zinc-300 focus:border-black focus:outline-none bg-white transition-colors'
const labelClass = 'block text-xs font-bold uppercase tracking-wide text-zinc-700 mb-1.5'

export default function QuoteForm() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(f => ({ ...f, [key]: value }))

  const togglePrestation = (p: string) =>
    setForm(f => ({
      ...f,
      prestations: f.prestations.includes(p)
        ? f.prestations.filter(x => x !== p)
        : [...f.prestations, p],
    }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Merci d’indiquer au moins votre nom et votre téléphone.')
      return
    }
    if (form.prestations.length === 0) {
      setError('Sélectionnez au moins une prestation.')
      return
    }
    setError('')
    // TODO : brancher sur l’API / WhatsApp. Pour l’instant, confirmation côté client.
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bg-white border border-zinc-200 p-8 md:p-12 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="text-2xl font-black uppercase mb-2">Demande envoyée !</h3>
        <p className="text-sm text-zinc-500 max-w-md mx-auto mb-6">
          Merci {form.name.split(' ')[0]}. Nous revenons vers vous très vite avec un devis personnalisé
          pour&nbsp;: {form.prestations.join(', ')}.
        </p>
        <button
          onClick={() => { setForm(EMPTY); setSubmitted(false) }}
          className="text-xs font-bold uppercase tracking-wide underline text-zinc-500 hover:text-black transition-colors"
        >
          Faire une nouvelle demande
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 p-6 md:p-8 space-y-6">
      {/* Prestations */}
      <div>
        <span className={labelClass}>Quelle(s) prestation(s) souhaitez-vous ? *</span>
        <div className="flex flex-wrap gap-2">
          {QUOTE_PRESTATIONS.map(p => {
            const active = form.prestations.includes(p)
            return (
              <button
                type="button"
                key={p}
                onClick={() => togglePrestation(p)}
                className={`text-xs font-semibold px-3.5 py-2 border transition-colors ${
                  active
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-zinc-700 border-zinc-300 hover:border-black'
                }`}
              >
                {p}
              </button>
            )
          })}
        </div>
      </div>

      {/* Occasion + Date */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="q-occasion">Occasion</label>
          <select
            id="q-occasion"
            value={form.occasion}
            onChange={e => set('occasion', e.target.value)}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="">Sélectionner…</option>
            {QUOTE_OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="q-date">Date souhaitée</label>
          <input
            id="q-date"
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Lieu + Nombre de personnes */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <span className={labelClass}>Lieu de la prestation</span>
          <div className="flex gap-2">
            {QUOTE_LOCATIONS.map(loc => (
              <button
                type="button"
                key={loc.value}
                onClick={() => set('location', loc.value)}
                className={`flex-1 text-sm font-semibold px-3 py-2.5 border transition-colors ${
                  form.location === loc.value
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-zinc-700 border-zinc-300 hover:border-black'
                }`}
              >
                {loc.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="q-guests">Nombre de personnes</label>
          <input
            id="q-guests"
            type="number"
            min={1}
            value={form.guests}
            onChange={e => set('guests', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Budget */}
      <div>
        <label className={labelClass} htmlFor="q-budget">Budget approximatif</label>
        <select
          id="q-budget"
          value={form.budget}
          onChange={e => set('budget', e.target.value)}
          className={`${inputClass} cursor-pointer`}
        >
          <option value="">Sélectionner…</option>
          {QUOTE_BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Coordonnées */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="q-name">Nom complet *</label>
          <input
            id="q-name"
            type="text"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            className={inputClass}
            placeholder="Votre nom"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="q-phone">Téléphone / WhatsApp *</label>
          <input
            id="q-phone"
            type="tel"
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
            className={inputClass}
            placeholder="+225 ..."
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="q-email">Email (optionnel)</label>
        <input
          id="q-email"
          type="email"
          value={form.email}
          onChange={e => set('email', e.target.value)}
          className={inputClass}
          placeholder="vous@email.com"
        />
      </div>

      {/* Message */}
      <div>
        <label className={labelClass} htmlFor="q-message">Détails / inspirations</label>
        <textarea
          id="q-message"
          rows={4}
          value={form.message}
          onChange={e => set('message', e.target.value)}
          className={`${inputClass} resize-none`}
          placeholder="Décrivez le rendu souhaité, une inspiration, la longueur de vos cheveux…"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}

      <button
        type="submit"
        className="w-full bg-black text-white text-sm font-bold uppercase tracking-widest py-4 hover:bg-zinc-800 transition-colors"
      >
        Demander mon devis
      </button>
      <p className="text-xs text-zinc-400 text-center">
        Réponse sous 24 h. Aucun engagement.
      </p>
    </form>
  )
}
