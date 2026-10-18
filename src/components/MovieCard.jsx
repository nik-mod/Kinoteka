import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from '../gsap.js'
import Icon from './Icon.jsx'
import { getMovieArtwork } from '../movieArtwork.js'

const tints = ['#211116', '#1B1215', '#261417', '#1D1418', '#241418', '#191316']

export default function MovieCard({ movie, isFavorite = false, onFavorite, canFavorite = true }) {
  const [pulse, setPulse] = useState(0)
  const [failedPoster, setFailedPoster] = useState('')
  const [favoriteSubmitting, setFavoriteSubmitting] = useState(false)
  const buttonRef = useRef(null)
  const tint = tints[Math.abs(Number(movie.id) || 0) % tints.length]
  const { poster } = getMovieArtwork(movie)

  useLayoutEffect(() => {
    if (!pulse || !buttonRef.current) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(buttonRef.current, { scale: 0.82 }, { scale: 1, duration: 0.45, ease: 'back.out(2.4)' })
    })
    return () => mm.revert()
  }, [pulse])

  async function handleFavorite() {
    if (isFavorite || favoriteSubmitting) return
    setFavoriteSubmitting(true)
    try {
      const added = await onFavorite?.(movie)
      if (added !== false) setPulse((value) => value + 1)
    } finally {
      setFavoriteSubmitting(false)
    }
  }

  return <article className="movie-card" style={{ '--card-tint': tint }}>
    <Link className="movie-card-link" to={`/movies/${movie.id}`} aria-label={`${movie.title || 'ფილმი'} — დეტალები`}>
      {poster && failedPoster !== poster
        ? <img className="movie-poster" src={poster} alt="" width="500" height="750" loading="lazy" decoding="async" onError={() => setFailedPoster(poster)} />
        : <span className="movie-fallback" aria-hidden="true"><span>{movie.title?.slice(0, 1) || 'K'}</span></span>}
      <span className="movie-card-shade" aria-hidden="true" />
      <span className="movie-card-shine" aria-hidden="true" />
      <div className="movie-card-content">
        <span className="movie-card-kicker"><span>{movie.year || '—'}</span><span className="dot" aria-hidden="true" /><span>{movie.genre || 'ჟანრი უცნობია'}</span></span>
        <h2>{movie.title || 'უსათაურო ფილმი'}</h2>
        <span className="details-label">ნახვა <Icon name="arrowUpRight" size={12} /></span>
      </div>
    </Link>
    {canFavorite && <button ref={buttonRef} className={`favorite-button ${isFavorite ? 'is-favorite' : ''}`} type="button" onClick={handleFavorite} aria-pressed={isFavorite} aria-busy={favoriteSubmitting} disabled={isFavorite || favoriteSubmitting} aria-label={favoriteSubmitting ? 'ფავორიტებში ემატება' : isFavorite ? 'ფავორიტებშია' : 'ფავორიტებში დამატება'}><Icon name="heart" size={18} /></button>}
  </article>
}
