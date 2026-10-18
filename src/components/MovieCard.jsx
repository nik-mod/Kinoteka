import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import Icon from './Icon.jsx'
import { getMovieArtwork } from '../movieArtwork.js'

const tints = ['#93352e', '#7a5128', '#4f5435', '#62372e', '#71413e', '#3d3830']

export default function MovieCard({ movie, isFavorite = false, onFavorite, canFavorite = true }) {
  const [pulse, setPulse] = useState(0)
  const [imageFailed, setImageFailed] = useState(false)
  const buttonRef = useRef(null)
  const cardRef = useRef(null)
  const tint = tints[Math.abs(Number(movie.id) || 0) % tints.length]
  const { poster } = getMovieArtwork(movie)

  useLayoutEffect(() => {
    const card = cardRef.current
    if (!card) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)', () => {
      const image = card.querySelector('.movie-poster')
      const content = card.querySelector('.movie-card-content')
      const rotateX = gsap.quickTo(card, 'rotationX', { duration: 0.45, ease: 'power3.out' })
      const rotateY = gsap.quickTo(card, 'rotationY', { duration: 0.45, ease: 'power3.out' })
      const enter = () => {
        if (image) gsap.to(image, { scale: 1.075, duration: 0.75, ease: 'power3.out' })
        gsap.to(content, { y: -7, duration: 0.42, ease: 'power3.out' })
      }
      const leave = () => {
        rotateX(0)
        rotateY(0)
        if (image) gsap.to(image, { scale: 1, duration: 0.7, ease: 'power3.out' })
        gsap.to(content, { y: 0, duration: 0.42, ease: 'power3.out' })
      }
      const move = (event) => {
        const bounds = card.getBoundingClientRect()
        rotateY(((event.clientX - bounds.left) / bounds.width - 0.5) * 4)
        rotateX(((event.clientY - bounds.top) / bounds.height - 0.5) * -4)
      }
      card.addEventListener('pointerenter', enter)
      card.addEventListener('pointermove', move)
      card.addEventListener('pointerleave', leave)
      card.addEventListener('focusin', enter)
      card.addEventListener('focusout', leave)
      return () => {
        card.removeEventListener('pointerenter', enter)
        card.removeEventListener('pointermove', move)
        card.removeEventListener('pointerleave', leave)
        card.removeEventListener('focusin', enter)
        card.removeEventListener('focusout', leave)
      }
    })
    return () => mm.revert()
  }, [])

  useLayoutEffect(() => {
    if (!pulse || !buttonRef.current) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(buttonRef.current, { scale: 0.82 }, { scale: 1, duration: 0.45, ease: 'back.out(2.4)' })
    })
    return () => mm.revert()
  }, [pulse])

  async function handleFavorite() {
    if (isFavorite) return
    const added = await onFavorite?.(movie)
    if (added !== false) setPulse((value) => value + 1)
  }

  return <article className="movie-card" ref={cardRef} style={{ '--card-tint': tint }}>
    <Link className="movie-card-link" to={`/movies/${movie.id}`} aria-label={`${movie.title} — დეტალები`}>
      {poster && !imageFailed && <img className="movie-poster" src={poster} alt={`${movie.title || 'ფილმი'} — პოსტერი`} loading="lazy" onError={() => setImageFailed(true)} />}
      <span className="movie-fallback" aria-hidden={poster && !imageFailed ? 'true' : undefined}><span>{movie.title?.slice(0, 1) || 'K'}</span></span>
      <span className="movie-card-shade" />
      <div className="movie-card-content">
        <span className="movie-card-kicker"><span>{movie.year || '—'}</span><span>{movie.genre || 'ჟანრი უცნობია'}</span></span>
        <h2>{movie.title || 'უსათაურო ფილმი'}</h2>
        <span className="details-label">დეტალების ნახვა <span aria-hidden="true">↗</span></span>
      </div>
    </Link>
    {canFavorite && <button ref={buttonRef} className={`favorite-button ${isFavorite ? 'is-favorite' : ''}`} type="button" onClick={handleFavorite} aria-pressed={isFavorite} disabled={isFavorite} aria-label={isFavorite ? 'ფავორიტებშია' : 'ფავორიტებში დამატება'}><Icon name="heart" size={19} /></button>}
  </article>
}
