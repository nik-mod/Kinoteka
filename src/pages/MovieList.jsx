import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { api, extractList } from '../api.js'
import { useAuth } from '../useAuth.js'
import AsyncState from '../components/AsyncState.jsx'
import Icon from '../components/Icon.jsx'
import MovieCard from '../components/MovieCard.jsx'
import { getFeaturedMovie, getMovieArtwork } from '../movieArtwork.js'

function favoriteMovies(payload) {
  return extractList(payload).map((item) => item?.movie || item).filter(Boolean)
}

export default function MovieList() {
  const [movies, setMovies] = useState([])
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const heroRef = useRef(null)
  const heroMediaRef = useRef(null)
  const searchRef = useRef(null)
  const gridRef = useRef(null)
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  async function loadMovies() {
    setStatus('loading')
    setError('')
    try {
      const [moviePayload, favoritePayload] = await Promise.all([
        api.movies(),
        isAuthenticated ? api.favorites().catch(() => []) : Promise.resolve([]),
      ])
      setMovies(extractList(moviePayload))
      setFavoriteIds(new Set(favoriteMovies(favoritePayload).map((movie) => String(movie.id ?? movie.movie_id))))
      setStatus('success')
    } catch (loadError) {
      setError(loadError.message)
      setStatus('error')
    }
  }

  useEffect(() => {
    let active = true
    Promise.all([
      api.movies(),
      isAuthenticated ? api.favorites().catch(() => []) : Promise.resolve([]),
    ]).then(([moviePayload, favoritePayload]) => {
      if (!active) return
      setMovies(extractList(moviePayload))
      setFavoriteIds(new Set(favoriteMovies(favoritePayload).map((movie) => String(movie.id ?? movie.movie_id))))
      setStatus('success')
    }).catch((loadError) => {
      if (!active) return
      setError(loadError.message)
      setStatus('error')
    })
    return () => { active = false }
  }, [isAuthenticated])

  const featured = useMemo(() => getFeaturedMovie(movies), [movies])
  const featuredArtwork = useMemo(() => getMovieArtwork(featured), [featured])

  useLayoutEffect(() => {
    if (!featured || !heroRef.current) return undefined
    const hero = heroRef.current
    const media = heroMediaRef.current
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        const timeline = gsap.timeline({ defaults: { ease: 'power4.out' } })
        timeline
          .fromTo(media, { scale: 1.1, filter: 'brightness(.45)' }, { scale: 1, filter: 'brightness(.8)', duration: 1.45 })
          .fromTo('.hero-reveal', { scaleX: 1 }, { scaleX: 0, duration: 0.95, transformOrigin: 'right center' }, 0.08)
          .fromTo('.hero-animate', { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75, stagger: 0.085 }, 0.35)
          .fromTo('.hero-index', { x: 18, opacity: 0 }, { x: 0, opacity: 1, duration: 0.55 }, 0.72)
      }, hero)
      return () => ctx.revert()
    })
    mm.add('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)', () => {
      const moveX = gsap.quickTo(media, 'xPercent', { duration: 1.1, ease: 'power3.out' })
      const moveY = gsap.quickTo(media, 'yPercent', { duration: 1.1, ease: 'power3.out' })
      const onMove = (event) => {
        const bounds = hero.getBoundingClientRect()
        moveX(((event.clientX - bounds.left) / bounds.width - 0.5) * 2.2)
        moveY(((event.clientY - bounds.top) / bounds.height - 0.5) * 1.7)
      }
      const onLeave = () => { moveX(0); moveY(0) }
      hero.addEventListener('pointermove', onMove)
      hero.addEventListener('pointerleave', onLeave)
      return () => {
        hero.removeEventListener('pointermove', onMove)
        hero.removeEventListener('pointerleave', onLeave)
      }
    })
    return () => mm.revert()
  }, [featured])

  useLayoutEffect(() => {
    if (status !== 'success' || !movies.length) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const cards = gridRef.current?.children || []
      gsap.from(cards, { y: 34, opacity: 0, duration: 0.68, stagger: 0.075, ease: 'power3.out' })
      gsap.from(gridRef.current?.querySelectorAll('.movie-poster') || [], { scale: 1.1, duration: 1, stagger: 0.06, ease: 'power3.out' })
    })
    return () => mm.revert()
  }, [status, movies.length])

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('ka')
    if (!needle) return movies
    return movies.filter((movie) => [movie.title, movie.genre, movie.year].some((value) => String(value || '').toLocaleLowerCase('ka').includes(needle)))
  }, [movies, query])

  useLayoutEffect(() => {
    if (status !== 'success' || !query || !gridRef.current) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.fromTo(gridRef.current.children, { opacity: 0, scale: 0.975 }, { opacity: 1, scale: 1, duration: 0.32, stagger: 0.025, ease: 'power2.out', clearProps: 'transform' })
      }, gridRef)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [query, status])

  async function addFavorite(movie) {
    if (!isAuthenticated) {
      navigate('/login')
      return false
    }
    setActionError('')
    try {
      await api.addFavorite(movie.id)
      setFavoriteIds((previous) => new Set(previous).add(String(movie.id)))
      return true
    } catch (favoriteError) {
      setActionError(favoriteError.message)
      return false
    }
  }

  return <div className="page catalog-page">
    {featured && <section className="catalog-hero" ref={heroRef} aria-labelledby="featured-title">
      <div className="hero-media-wrap" aria-hidden="true">
        {featuredArtwork.backdrop
          ? <img ref={heroMediaRef} className="hero-media" src={featuredArtwork.backdrop} alt="" fetchPriority="high" />
          : <div ref={heroMediaRef} className="hero-media hero-media-fallback" />}
      </div>
      <div className="hero-reveal" aria-hidden="true" />
      <div className="hero-vignette" aria-hidden="true" />
      <div className="hero-content">
        <span className="hero-eyebrow hero-animate"><span className="live-dot" /> კვირის გამორჩეული ფილმი</span>
        <h1 id="featured-title" className="hero-title hero-animate">{featured.title}</h1>
        <div className="hero-meta hero-animate"><span>{featured.year || '2010'}</span><span>{featured.genre || 'Sci-Fi, Action'}</span><span>კრისტოფერ ნოლანი</span></div>
        <p className="hero-description hero-animate">{featured.description || 'იდეის მოპარვა შესაძლებელია — მაგრამ მისი ჩათესვა ბევრად სახიფათოა. შედი სიზმრის მრავალშრიან სამყაროში.'}</p>
        <div className="hero-actions hero-animate">
          <button className="hero-play" type="button" onClick={() => navigate(`/movies/${featured.id}`)} aria-label={`${featured.title} — დეტალების ნახვა`}><span aria-hidden="true">▶</span></button>
          <button className="button hero-cta" type="button" onClick={() => navigate(`/movies/${featured.id}`)}>ფილმის დეტალები <span aria-hidden="true">↗</span></button>
        </div>
      </div>
      <span className="hero-index" aria-hidden="true">01 / {String(movies.length).padStart(2, '0')}</span>
    </section>}

    <div className="catalog-toolbar" ref={searchRef}>
      <div className="catalog-heading"><span>ახლა კინოთეკაში</span><h2>ფილმების კოლექცია</h2></div>
      <label className="search-field">
        <span className="sr-only">ფილმის ძიება</span>
        <Icon name="search" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ძიება სათაურით, ჟანრით ან წლით" type="search" />
      </label>
      <span className="result-count"><strong>{String(filtered.length).padStart(2, '0')}</strong> ფილმი</span>
    </div>
    {actionError && <p className="inline-error" role="alert">{actionError}</p>}

    {status === 'loading' && <AsyncState type="loading" title="კატალოგი იტვირთება" message="ფილმებს სერვერიდან ვიღებთ." />}
    {status === 'error' && <AsyncState type="error" title="კატალოგი ვერ ჩაიტვირთა" message={error} onRetry={loadMovies} />}
    {status === 'success' && movies.length === 0 && <AsyncState type="empty" title="კატალოგი ცარიელია" message="ავტორიზაციის შემდეგ შეგიძლია პირველი ფილმი დაამატო." />}
    {status === 'success' && movies.length > 0 && filtered.length === 0 && <AsyncState type="empty" title="შედეგი ვერ მოიძებნა" message="შეცვალე საძიებო სიტყვა ან მოძებნე სხვა ჟანრი." />}
    {status === 'success' && filtered.length > 0 && <section className="movie-grid" ref={gridRef} aria-label="ფილმების კატალოგი">
      {filtered.map((movie) => <MovieCard key={movie.id} movie={movie} isFavorite={favoriteIds.has(String(movie.id))} onFavorite={addFavorite} />)}
    </section>}
  </div>
}
