import { useState, type FormEvent } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

const testimonials = [
  {
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    name: 'Aminata Koné',
    handle: '@aminata_style',
    text: 'La gestion des commandes est devenue tellement simple. Je gagne un temps fou au quotidien.',
  },
  {
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    name: 'Kouassi Bamba',
    handle: '@kbamba_mode',
    text: 'Interface claire, rapide et intuitive. Exactement ce dont notre boutique avait besoin.',
  },
  {
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    name: 'Fatou Diallo',
    handle: '@fatou.accesoires',
    text: 'Depuis qu\'on utilise ce backoffice, les erreurs de stock ont disparu. Parfait !',
  },
]

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  if (user) return <Navigate to="/admin" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion échouée')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Panneau gauche : hero + témoignages ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col">
        {/* Image de fond */}
        <img
          src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&q=80"
          alt="Willy Accessoire"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

        {/* Contenu sur l'image */}
        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-gray-900 font-bold text-sm">W</span>
            </div>
            <span className="text-white font-semibold text-lg">Willy Accessoire</span>
          </div>

          {/* Témoignage */}
          <div className="mt-auto">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-6">
              <p className="text-white text-base leading-relaxed mb-5">
                "{testimonials[activeTestimonial].text}"
              </p>
              <div className="flex items-center gap-3">
                <img
                  src={testimonials[activeTestimonial].avatar}
                  alt={testimonials[activeTestimonial].name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white/30"
                />
                <div>
                  <p className="text-white font-medium text-sm">{testimonials[activeTestimonial].name}</p>
                  <p className="text-white/60 text-xs">{testimonials[activeTestimonial].handle}</p>
                </div>
              </div>
            </div>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeTestimonial ? 'bg-white w-6' : 'bg-white/40 w-1.5'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Panneau droit : formulaire ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">

          {/* En-tête mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">W</span>
            </div>
            <span className="font-semibold text-gray-900">Willy Accessoire</span>
          </div>

          {/* Titre */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Bon retour 👋</h1>
            <p className="text-sm text-gray-500 mt-1.5">Connectez-vous à votre espace d'administration</p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Adresse email
              </label>
              <input
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@exemple.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">Mot de passe</label>
                <button
                  type="button"
                  className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Erreur */}
            {error && (
              <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <span className="mt-0.5">⚠</span>
                {error}
              </div>
            )}

            {/* Bouton connexion */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Connexion en cours…' : 'Se connecter'}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-gray-400">
            Accès réservé aux membres de l'équipe.
          </p>
        </div>
      </div>

    </div>
  )
}
