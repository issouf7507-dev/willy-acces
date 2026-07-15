import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { Plus, Pencil, Trash2, Loader2, Users as UsersIcon, ShieldCheck } from 'lucide-react'

type Role = 'ADMIN' | 'MANAGER' | 'STAFF' | 'CUSTOMER'

interface User {
  id: string
  name: string
  email: string
  phone: string | null
  role: Role
  isActive: boolean
  createdAt: string
}

/** Ce que chaque rôle peut faire, pour éclairer le choix à la création. */
const ROLE_HELP: Record<Exclude<Role, 'CUSTOMER'>, string> = {
  ADMIN: 'Accès total, y compris les réglages et la gestion des utilisateurs.',
  MANAGER: 'Gère produits, catégories, commandes et devis. Pas les réglages ni les comptes.',
  STAFF: 'Consultation des commandes et devis. Ne peut rien supprimer.',
}

const ROLE_BADGE: Record<Role, string> = {
  ADMIN: 'bg-gray-900 text-white',
  MANAGER: 'bg-blue-100 text-blue-700',
  STAFF: 'bg-gray-100 text-gray-600',
  CUSTOMER: 'bg-gray-50 text-gray-400',
}

interface FormState {
  name: string
  email: string
  password: string
  role: Exclude<Role, 'CUSTOMER'>
  isActive: boolean
}

const EMPTY_FORM: FormState = { name: '', email: '', password: '', role: 'STAFF', isActive: true }

export default function Users() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<User | null | 'new'>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    api.get<User[]>('/users')
      .then(setUsers)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur de chargement'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function openNew() { setForm(EMPTY_FORM); setEditing('new'); setError('') }
  function openEdit(u: User) {
    // Mot de passe laissé vide : il n'est remplacé que si l'admin en saisit un.
    setForm({ name: u.name, email: u.email, password: '', role: u.role as FormState['role'], isActive: u.isActive })
    setEditing(u); setError('')
  }

  async function save() {
    if (!form.name.trim() || !form.email.trim()) { setError('Nom et email sont requis'); return }
    if (editing === 'new' && form.password.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères'); return
    }
    if (editing !== 'new' && form.password && form.password.length < 8) {
      setError('Le nouveau mot de passe doit faire au moins 8 caractères'); return
    }

    setSaving(true); setError('')
    try {
      if (editing === 'new') {
        await api.post('/users', form)
      } else if (editing) {
        const payload: Record<string, unknown> = {
          name: form.name, email: form.email, role: form.role, isActive: form.isActive,
        }
        if (form.password) payload.password = form.password
        await api.patch(`/users/${editing.id}`, payload)
      }
      setEditing(null); load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function remove(u: User) {
    if (!confirm(`Supprimer le compte de ${u.name} (${u.email}) ?`)) return
    try {
      await api.delete(`/users/${u.id}`)
      load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Suppression impossible')
    }
  }

  const input = 'w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-1">
            {users.length} compte(s) ayant accès au backoffice
          </p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
          <Plus className="w-4 h-4" /> Nouvel utilisateur
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : !users.length ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
            <UsersIcon className="w-8 h-8" />
            <p className="text-sm">Aucun utilisateur</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600 flex-shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{u.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${ROLE_BADGE[u.role]}`}>
                      {u.role}
                    </span>
                    {u.id === me?.id && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 text-emerald-600">vous</span>
                    )}
                    {!u.isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] bg-red-50 text-red-600">Désactivé</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(u)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(u)} disabled={u.id === me?.id}
                    title={u.id === me?.id ? 'Vous ne pouvez pas supprimer votre propre compte' : 'Supprimer'}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-semibold text-gray-900">
              {editing === 'new' ? 'Nouvel utilisateur' : `Modifier ${editing.name}`}
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom *</label>
              <input autoFocus value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className={input} placeholder="Nom et prénom" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                className={input} placeholder="personne@willy-accesoire.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {editing === 'new' ? 'Mot de passe *' : 'Nouveau mot de passe'}
              </label>
              <input type="text" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                className={input} placeholder={editing === 'new' ? '8 caractères minimum' : 'Laisser vide pour ne pas changer'} />
              <p className="text-xs text-gray-400 mt-1.5">
                {editing === 'new'
                  ? 'À communiquer à la personne : aucun email n’est envoyé automatiquement.'
                  : 'Renseigner uniquement pour réinitialiser le mot de passe.'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Rôle</label>
              <select value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value as FormState['role'] }))}
                disabled={editing !== 'new' && editing.id === me?.id}
                className={`${input} bg-white disabled:bg-gray-50 disabled:text-gray-400`}>
                <option value="STAFF">Staff</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
              <p className="text-xs text-gray-400 mt-1.5 flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 mt-px flex-shrink-0" />
                {editing !== 'new' && editing.id === me?.id
                  ? 'Vous ne pouvez pas modifier votre propre rôle.'
                  : ROLE_HELP[form.role]}
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive}
                onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                disabled={editing !== 'new' && editing.id === me?.id}
                className="w-4 h-4 rounded accent-gray-900 disabled:opacity-40" />
              <span className="text-sm text-gray-700">Compte actif</span>
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button onClick={() => setEditing(null)}
                className="flex-1 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editing === 'new' ? 'Créer' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
