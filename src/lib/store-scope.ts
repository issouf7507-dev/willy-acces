import { useEffect, useState } from 'react'
import { api } from './api'
import { useAuth } from '../context/AuthContext'

export interface StoreOption { id: string; name: string }

/**
 * La boutique sur laquelle l'écran travaille, et celles qu'on peut encore
 * choisir.
 *
 * Une vendeuse est rattachée à un point de vente, et le serveur refuse (403)
 * toute vente, tout mouvement de stock et toute dépense qui vise ailleurs :
 * lui présenter les autres boutiques ne mènerait qu'à une erreur une fois la
 * saisie faite. L'administration garde la liste entière, mais démarre sur sa
 * propre boutique quand elle en a une — sinon la caisse s'ouvrait sur la
 * première de la liste, qui n'est celle de personne.
 */
export function useStoreScope() {
  const { user } = useAuth()
  const isSeller = user?.role === 'VENDEUR'

  const [stores, setStores] = useState<StoreOption[]>([])
  const [storeId, setStoreId] = useState('')
  const [storeError, setStoreError] = useState('')

  useEffect(() => {
    api.get<StoreOption[]>('/gestion/stores')
      .then((list) => {
        if (isSeller && !user?.storeId) {
          setStores([])
          setStoreError(
            'Votre compte n’est rattaché à aucune boutique : demandez à un administrateur de vous en affecter une.',
          )
          return
        }
        const scoped = isSeller ? list.filter((s) => s.id === user?.storeId) : list
        setStores(scoped)
        const mine = scoped.some((s) => s.id === user?.storeId) ? user?.storeId : null
        setStoreId((cur) => cur || mine || scoped[0]?.id || '')
      })
      .catch(() => setStores([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { stores, storeId, setStoreId, isSeller, storeError }
}
