import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from '../gsap.js'
import { api, extractList } from '../api.js'
import AsyncState from '../components/AsyncState.jsx'
import Icon from '../components/Icon.jsx'
import MovieCard from '../components/MovieCard.jsx'

function unwrapFavorites(payload) {
  return extractList(payload).map((item) => item?.movie || item).filter((movie) => movie && (movie.id || movie.movie_id))
}

export default function Favorites() {
  const [movies, setMovies] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const gridRef = useRef(null)
  const headerRef = useRef(null)

  async function loadFavorites() {
    setStatus('loading')
    try {
      setMovies(unwrapFavorites(await api.favorites()))
      setStatus('success')
    } catch (loadError) {
      setError(loadError.message)
      setStatus('error')
    }
  }

  useEffect(() => {
    let active = true
    api.favorites().then((payload) => {
      if (!active) return
      setMovies(unwrapFavorites(payload))
      setStatus('success')
    }).catch((loadError) => {
      if (!active) return
      setError(loadError.message)
      setStatus('error')
    })
    return () => { active = false }
  }, [])

  useLayoutEffect(() => {
    if (!headerRef.current) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.fromTo('.page-index', { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' })
        gsap.fromTo('.page-header h1', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power4.out', delay: 0.08 })
        gsap.fromTo('.page-header p', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.25 })
      }, headerRef)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [])

  useLayoutEffect(() => {
    if (status !== 'success' || !movies.length) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const cards = gridRef.current?.children || []
      gsap.from(cards, { y: 40, opacity: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' })
      gsap.from(gridRef.current?.querySelectorAll('.movie-poster') || [], { scale: 1.08, duration: 1, stagger: 0.06, ease: 'power3.out' })
    })
    return () => mm.revert()
  }, [status, movies.length])

  return <div className="page inner-page">
    <header className="page-header" ref={headerRef}>
      <span className="page-index">02</span>
      <h1>ფავორიტები</h1>
      <p>{movies.length
        ? <>{movies.length === 1 ? 'ერთი ფილმი' : `${movies.length} ფილმი`} შენი სიიდან — დროა დაბრუნების.</>
        : 'ფილმები, რომელთა დაბრუნებაც ღირს.'}</p>
    </header>
    {status === 'loading' && <AsyncState type="loading" title="ფავორიტები იტვირთება" />}
    {status === 'error' && <AsyncState type="error" title="ფავორიტები ვერ ჩაიტვირთა" message={error} onRetry={loadFavorites} />}
    {status === 'success' && !movies.length && <section className="empty-feature">
      <span className="empty-watermark" aria-hidden="true"><Icon name="heart" size={260} /></span>
      <span>ჯერ ცარიელია</span>
      <h2>შენი კინოთეკა<br />აქ იწყება.</h2>
      <p>კატალოგში გულის ღილაკით მონიშნე ფილმი და ის ამ გვერდზე გამოჩნდება.</p>
      <Link className="button" to="/">კატალოგის ნახვა <Icon name="arrowUpRight" size={15} /></Link>
    </section>}
    {status === 'success' && movies.length > 0 && <section className="movie-grid" ref={gridRef} aria-label="ფავორიტები">
      {movies.map((movie) => <MovieCard key={movie.id || movie.movie_id} movie={{ ...movie, id: movie.id || movie.movie_id }} isFavorite canFavorite />)}
    </section>}
  </div>
}
