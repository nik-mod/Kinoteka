const API_URL = 'https://adi.duck.ge/api'

function getToken() {
  return localStorage.getItem('token')
}

function readError(payload, fallback) {
  if (payload?.errors && typeof payload.errors === 'object') {
    return Object.values(payload.errors).flat().filter(Boolean).join(' ')
  }
  return payload?.message || fallback
}

async function request(path, options = {}) {
  const token = getToken()
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(readError(payload, 'მოთხოვნა ვერ შესრულდა. სცადეთ თავიდან.'))
  }
  return payload
}

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
  return payload?.token || payload?.access_token || payload?.data?.token || ''
}

export const api = {
  login: (fields) => request('/login', { method: 'POST', body: JSON.stringify(fields) }),
  register: (fields) => request('/register', { method: 'POST', body: JSON.stringify(fields) }),
  movies: () => request('/movies'),
  movie: (id) => request(`/movies/${id}`),
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
