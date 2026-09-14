import { useState } from 'react'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { KeyRound, Loader2, ShieldCheck } from 'lucide-react'

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super admin',
  ADMIN: 'Admin',
  VENDEUR: 'Vendeuse',
}

const input =
  'w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring'

export default function Account() {
  const { user } = useAuth()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setDone(false)

    if (form.newPassword.length < 8) {
      setError('Le nouveau mot de passe fait 8 caractères minimum')
      return
    }
    if (form.newPassword !== form.confirm) {
      setError('Les deux nouveaux mots de passe ne sont pas identiques')
      return
    }

    setSaving(true)
    try {
      await api.post('/auth/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      setForm({ currentPassword: '', newPassword: '', confirm: '' })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Changement impossible')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Mon compte</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Votre mot de passe. Pour tout le reste — nom, email, rôle, boutique —
          adressez-vous à un super administrateur.
        </p>
      </div>

      <div className="max-w-md space-y-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Nom</dt>
              <dd className="text-foreground font-medium">{user?.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="text-foreground truncate">{user?.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Rôle</dt>
              <dd className="text-foreground">{ROLE_LABEL[user?.role ?? ''] ?? user?.role}</dd>
            </div>
          </dl>
        </div>

        <form onSubmit={submit} className="bg-card rounded-xl border border-border p-5 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <KeyRound className="w-4 h-4" /> Changer mon mot de passe
          </h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Mot de passe actuel</label>
            <input type="password" autoComplete="current-password" value={form.currentPassword}
              onChange={(e) => set('currentPassword', e.target.value)} className={input} />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Nouveau mot de passe</label>
            <input type="password" autoComplete="new-password" value={form.newPassword}
              onChange={(e) => set('newPassword', e.target.value)} className={input}
              placeholder="8 caractères minimum" />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Confirmer</label>
            <input type="password" autoComplete="new-password" value={form.confirm}
              onChange={(e) => set('confirm', e.target.value)} className={input} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {done && (
            <p className="text-sm text-success">
              Mot de passe changé. Vos autres appareils ont été déconnectés.
            </p>
          )}

          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 mt-px flex-shrink-0" />
            Vos sessions ouvertes ailleurs seront fermées ; celle-ci reste active.
          </p>

          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Enregistrer
          </button>
        </form>
      </div>
    </div>
  )
}
