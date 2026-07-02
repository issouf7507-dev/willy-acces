const BASE = '/api'

function token() {
  return localStorage.getItem('admin_token')
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const tk = token()
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(tk ? { Authorization: `Bearer ${tk}` } : {}),
      ...(init.headers ?? {}),
    },
  })

  const json = await res.json()

  if (!res.ok) {
    throw new Error(json.error ?? `Erreur ${res.status}`)
  }

  return json.data as T
}

export const api = {
  get:    <T>(path: string)                    => request<T>(path),
  post:   <T>(path: string, body: unknown)     => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown)     => request<T>(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown)     => request<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: <T>(path: string)                    => request<T>(path, { method: 'DELETE' }),
}
