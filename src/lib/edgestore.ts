import { initEdgeStore } from '@edgestore/shared'
import { createEdgeStoreProvider } from '@edgestore/react'

// Mirror the backend router shape — kept in sync with backend/src/lib/edgestore.ts
const es = initEdgeStore.create()

const edgeStoreRouter = es.router({
  publicImages: es.imageBucket({
    maxSize: 1024 * 1024 * 10,
    accept: ['image/*'],
  }),
})

type EdgeStoreRouter = typeof edgeStoreRouter

export const { EdgeStoreProvider, useEdgeStore } = createEdgeStoreProvider<EdgeStoreRouter>()
