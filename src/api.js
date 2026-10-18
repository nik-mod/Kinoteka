const API_URL = 'https://adi.duck.ge/api'
const pendingReads = new Map()

function getToken() {
  try { return localStorage.getItem('token') } catch { return null }
}

function readError(payload, fallback) {
  if (payload?.errors && typeof payload.errors === 'object') {
    const errors = Object.values(payload.errors).flat().filter(Boolean).join(' ')
    if (errors) return errors
  }
  if (typeof payload === 'string' && payload.trim()) return payload.trim().slice(0, 600)
  if (payload?.message) return String(payload.message)
  if (typeof payload?.error === 'string' && payload.error.trim()) return payload.error.trim()
  if (payload && typeof payload === 'object') {
    try { return JSON.stringify(payload).slice(0, 600) } catch { /* use the status text below */ }
  }
  return String(fallback || '').trim().slice(0, 600)
}

async function performRequest(path, options, token) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })

    const responseText = await response.text()
    let payload
    try { payload = responseText ? JSON.parse(responseText) : null } catch { payload = responseText || null }
    if (!response.ok || payload?.success === false) {
      if (response.status === 401 && token && getToken() === token) {
        localStorage.removeItem('token')
        window.dispatchEvent(new Event('kinoteka:auth-expired'))
      }
      const detail = readError(payload, response.statusText || 'ცარიელი პასუხი')
      throw new Error(`HTTP ${response.status}: ${detail}`)
    }
    return payload
  } catch (error) {
    if (controller.signal.aborted) throw new Error('სერვერთან დაკავშირების დრო ამოიწურა (15 წამი). სცადე თავიდან.', { cause: error })
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

function request(path, options = {}) {
  const token = getToken()
  const isRead = !options.method || options.method === 'GET'
  const key = `${token}\n${path}`
  if (isRead && pendingReads.has(key)) return pendingReads.get(key)

  // Share only overlapping reads (including React StrictMode's second effect).
  // Settled responses are not cached; reads following a mutation stay fresh.
  const pending = performRequest(path, options, token).then((payload) => {
    if (!isRead) pendingReads.clear()
    return payload
  }).finally(() => {
    if (pendingReads.get(key) === pending) pendingReads.delete(key)
  })
  if (isRead) pendingReads.set(key, pending)
  return pending
}

export const CREATED_MOVIE_IDS_KEY = 'kinoteka:created-movie-ids'

export function extractList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.movies)) return payload.movies
  if (Array.isArray(payload?.comments)) return payload.comments
  return []
}

export function extractItem(payload) {
  return payload?.data && !Array.isArray(payload.data) ? payload.data : payload
}

export function extractToken(payload) {
  const token = payload?.token || payload?.access_token || payload?.data?.token
  return typeof token === 'string' ? token.trim() : ''
}

export const api = {
  login: (fields) => request('/login', { method: 'POST', body: JSON.stringify(fields) }),
  register: (fields) => request('/register', { method: 'POST', body: JSON.stringify(fields) }),
  movies: () => request('/movies', { cache: 'no-store' }),
  movie: (id) => request(`/movies/${encodeURIComponent(id)}`),
  addMovie: (fields) => request('/movies', { method: 'POST', body: JSON.stringify(fields) }),
  favorites: () => request('/favorites'),
  addFavorite: (movieId) => request('/favorites', { method: 'POST', body: JSON.stringify({ movie_id: movieId }) }),
  comments: (id) => request(`/movies/${id}/comments`),
  addComment: (id, content) => request(`/movies/${id}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  omdb: async (title) => {
    const key = import.meta.env.VITE_OMDB_KEY
    if (!key) return null
    const response = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${encodeURIComponent(key)}`)
    if (!response.ok) return null
    const payload = await response.json().catch(() => null)
    return payload?.Response === 'True' ? payload : null
  },
}
