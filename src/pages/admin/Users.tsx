import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { Plus, Pencil, Trash2, Loader2, Users as UsersIcon, ShieldCheck } from 'lucide-react'

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'VENDEUR' | 'CUSTOMER'

interface User {
  id: string
  name: string
  email: string
  phone: string | null
  role: Role
  isActive: boolean
  storeId: string | null
  store: { id: string; name: string } | null
  createdAt: string
}

/** Boutiques proposées au rattachement du personnel. */
interface StoreOption { id: string; name: string }

/** Ce que chaque rôle peut faire, pour éclairer le choix à la création. */
const ROLE_HELP: Record<Exclude<Role, 'CUSTOMER'>, string> = {
  SUPER_ADMIN: 'Tous les droits, y compris les recettes, le bilan mensuel et le tableau de bord de la gestion.',
  ADMIN: 'Tous les droits sauf ce qui montre les recettes et le bénéfice : arrivages, stock, dépenses, objectifs, catalogue, comptes.',
  VENDEUR: 'La caisse, dans sa boutique et à son nom, plus les commandes et devis. Aucun accès à la gestion.',
}

/** Libellés affichés : les valeurs techniques ne parlent pas à l'équipe. */
const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: 'Super admin',
  ADMIN: 'Admin',
  VENDEUR: 'Vendeuse',
  CUSTOMER: 'Client',
}

const ROLE_BADGE: Record<Role, string> = {
  SUPER_ADMIN: 'bg-primary text-primary-foreground',
  ADMIN: 'bg-info/15 text-info',
  VENDEUR: 'bg-muted text-muted-foreground',
  CUSTOMER: 'bg-muted/50 text-muted-foreground',
}

interface FormState {
  name: string
  email: string
  password: string
  role: Exclude<Role, 'CUSTOMER'>
  isActive: boolean
  /** '' = rattaché à aucun point de vente (siège, administration). */
  storeId: string
}

const EMPTY_FORM: FormState = {
  name: '', email: '', password: '', role: 'VENDEUR', isActive: true, storeId: '',
}

export default function Users() {
  const { user: me } = useAuth()
  const isSuperAdmin = me?.role === 'SUPER_ADMIN'

  /**
   * Seul un super administrateur nomme un pair ou touche à son compte. Le
   * serveur applique déjà la règle ; on l'affiche ici pour ne pas proposer une
   * action qui finirait en 403.
   */
  const canTouch = (role: Role) => role !== 'SUPER_ADMIN' || isSuperAdmin
  const assignableRoles: Exclude<Role, 'CUSTOMER'>[] = isSuperAdmin
    ? ['VENDEUR', 'ADMIN', 'SUPER_ADMIN']
    : ['VENDEUR', 'ADMIN']
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<User | null | 'new'>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [stores, setStores] = useState<StoreOption[]>([])
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

  // Liste des boutiques, pour rattacher une vendeuse à son point de vente.
  // Un échec ici ne doit pas bloquer la gestion des comptes : le sélecteur
  // reste simplement vide.
  useEffect(() => {
    api.get<StoreOption[]>('/gestion/stores')
      .then(setStores)
      .catch(() => setStores([]))
  }, [])

  function openNew() { setForm(EMPTY_FORM); setEditing('new'); setError('') }
  function openEdit(u: User) {
    // Mot de passe laissé vide : il n'est remplacé que si l'admin en saisit un.
    setForm({
      name: u.name, email: u.email, password: '', role: u.role as FormState['role'],
      isActive: u.isActive, storeId: u.storeId ?? '',
    })
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
      // storeId '' => null côté API : la personne n'est rattachée à aucune boutique.
      if (editing === 'new') {
        await api.post('/users', { ...form, storeId: form.storeId || null })
      } else if (editing) {
        const payload: Record<string, unknown> = {
          name: form.name, email: form.email, role: form.role, isActive: form.isActive,
          storeId: form.storeId || null,
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

  const input = 'w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring'

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {users.length} compte(s) ayant accès au backoffice
          </p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Nouvel utilisateur
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !users.length ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
            <UsersIcon className="w-8 h-8" />
            <p className="text-sm">Aucun utilisateur</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition-colors">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground flex-shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{u.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${ROLE_BADGE[u.role]}`}>
                      {ROLE_LABEL[u.role]}
                    </span>
                    {u.id === me?.id && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] bg-success/10 text-success">vous</span>
                    )}
                    {!u.isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] bg-destructive/10 text-destructive">Désactivé</span>
                    )}
                    {u.store && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] bg-muted text-muted-foreground">
                        {u.store.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(u)} disabled={!canTouch(u.role)}
                    title={canTouch(u.role) ? 'Modifier' : 'Réservé à un super administrateur'}
                    className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(u)} disabled={u.id === me?.id || !canTouch(u.role)}
                    title={u.id === me?.id ? 'Vous ne pouvez pas supprimer votre propre compte'
                      : canTouch(u.role) ? 'Supprimer' : 'Réservé à un super administrateur'}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors">
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
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-semibold text-foreground">
              {editing === 'new' ? 'Nouvel utilisateur' : `Modifier ${editing.name}`}
            </h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nom *</label>
              <input autoFocus value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className={input} placeholder="Nom et prénom" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                className={input} placeholder="personne@willy-accesoire.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {editing === 'new' ? 'Mot de passe *' : 'Nouveau mot de passe'}
              </label>
              <input type="text" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                className={input} placeholder={editing === 'new' ? '8 caractères minimum' : 'Laisser vide pour ne pas changer'} />
              <p className="text-xs text-muted-foreground mt-1.5">
                {editing === 'new'
                  ? 'À communiquer à la personne : aucun email n’est envoyé automatiquement.'
                  : 'Renseigner uniquement pour réinitialiser le mot de passe.'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Rôle</label>
              <select value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value as FormState['role'] }))}
                disabled={editing !== 'new' && editing.id === me?.id}
                className={`${input} bg-card disabled:bg-muted/50 disabled:text-muted-foreground`}>
                {assignableRoles.map((r) => (
                  <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1.5 flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 mt-px flex-shrink-0" />
                {editing !== 'new' && editing.id === me?.id
                  ? 'Vous ne pouvez pas modifier votre propre rôle.'
                  : ROLE_HELP[form.role]}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Boutique</label>
              <select value={form.storeId} onChange={(e) => setForm(f => ({ ...f, storeId: e.target.value }))}
                className={`${input} bg-card`}>
                <option value="">Aucune (siège / administration)</option>
                {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <p className="text-xs text-muted-foreground mt-1.5">
                Point de vente de rattachement : c'est lui qui sert au suivi des ventes par vendeuse.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive}
                onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                disabled={editing !== 'new' && editing.id === me?.id}
                className="w-4 h-4 rounded accent-primary disabled:opacity-40" />
              <span className="text-sm text-foreground">Compte actif</span>
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button onClick={() => setEditing(null)}
                className="flex-1 py-2 text-sm text-foreground border border-border rounded-lg hover:bg-accent transition-colors">
                Annuler
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
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
