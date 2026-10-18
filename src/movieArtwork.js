const artwork = {
  'the shawshank redemption': { poster: '/posters/shawshank.jpg' },
  shawshank: { poster: '/posters/shawshank.jpg' },
  inception: { poster: '/posters/inception.jpg', backdrop: '/backdrops/inception.jpg' },
  'forrest gump': { poster: '/posters/forrest-gump.jpg' },
  'the godfather': { poster: '/posters/the-godfather.jpg' },
  godfather: { poster: '/posters/the-godfather.jpg' },
  interstellar: { poster: '/posters/interstellar.jpg' },
  'the dark knight': { poster: '/posters/the-dark-knight.jpg' },
  'dark knight': { poster: '/posters/the-dark-knight.jpg' },
  parasite: { poster: '/posters/parasite.jpg' },
  titanic: { poster: '/posters/titanic.jpg' },
  'the matrix': { poster: '/posters/the-matrix.jpg' },
  matrix: { poster: '/posters/the-matrix.jpg' },
  'fight club': { poster: '/posters/fight-club.jpg' },
}

export function normalizeMovieTitle(title = '') {
  return String(title)
    .normalize('NFKD')
    .toLocaleLowerCase('en')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function apiImage(movie, keys) {
  for (const key of keys) {
    const value = movie?.[key]
    if (typeof value === 'string' && value.trim() && value.trim().toLocaleLowerCase() !== 'n/a') return value.trim()
  }
  return ''
}

export function getMovieArtwork(movie) {
  const key = normalizeMovieTitle(movie?.title)
  const local = artwork[key] || Object.entries(artwork).find(([candidate]) => key.includes(candidate))?.[1] || {}

  return {
    poster: local.poster || apiImage(movie, ['poster_url', 'posterUrl', 'poster', 'image_url', 'imageUrl', 'image']) || '',
    backdrop: local.backdrop || apiImage(movie, ['backdrop_url', 'backdropUrl', 'backdrop', 'cover_url', 'coverUrl']) || '',
  }
}

export function getFeaturedMovie(movies) {
  return movies.find((movie) => normalizeMovieTitle(movie?.title) === 'inception') || movies[0] || null
}
