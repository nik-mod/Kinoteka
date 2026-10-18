import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap, ScrollTrigger, SplitText } from '../gsap.js'
import { api, extractList } from '../api.js'
import { useAuth } from '../useAuth.js'
import AsyncState from '../components/AsyncState.jsx'
import Icon from '../components/Icon.jsx'
import Marquee from '../components/Marquee.jsx'
import MovieCard from '../components/MovieCard.jsx'
import { getFeaturedMovie, getMovieArtwork, normalizeMovieTitle } from '../movieArtwork.js'

function favoriteMovies(payload) {
  return extractList(payload).map((item) => item?.movie || item).filter(Boolean)
}

const HERO_SLIDE_MS = 7

export default function MovieList() {
  const [movies, setMovies] = useState([])
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('ყველა')
  const [sort, setSort] = useState('new')
  const [slide, setSlide] = useState(0)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const heroRef = useRef(null)
  const titleRef = useRef(null)
  const posterImgRef = useRef(null)
  const progressRef = useRef(null)
  const gridRef = useRef(null)
  const toolbarRef = useRef(null)
  const statsRef = useRef(null)
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

  const slides = useMemo(() => {
    if (!movies.length) return []
    const featured = getFeaturedMovie(movies)
    const rest = movies.filter((movie) => movie.id !== featured?.id).slice(0, 4)
    return [featured, ...rest].filter(Boolean)
  }, [movies])
  const current = slides[slide] || null
  const artwork = useMemo(() => getMovieArtwork(current), [current])

  const genres = useMemo(() => {
    const seen = new Set()
    movies.forEach((movie) => {
      String(movie.genre || '').split(/[,.]/).forEach((part) => {
        const value = part.trim()
        if (value) seen.add(value)
      })
    })
    return [...seen].slice(0, 8)
  }, [movies])

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('ka')
    let list = movies
    if (genre !== 'ყველა') {
      list = list.filter((movie) => String(movie.genre || '').toLocaleLowerCase('ka').includes(genre.toLocaleLowerCase('ka')))
    }
    if (needle) {
      list = list.filter((movie) => [movie.title, movie.genre, movie.year].some((value) => String(value || '').toLocaleLowerCase('ka').includes(needle)))
    }
    if (sort === 'new') list = [...list].sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0))
    if (sort === 'az') list = [...list].sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'ka'))
    return list
  }, [movies, genre, query, sort])

  const stats = useMemo(() => {
    const years = movies.map((movie) => Number(movie.year)).filter(Boolean)
    return {
      count: movies.length,
      genres: genres.length,
      range: years.length ? `${Math.min(...years)}—${Math.max(...years)}` : '—',
    }
  }, [movies, genres])

  /* hero entrance + slide-change choreography */
  useLayoutEffect(() => {
    if (!current || !heroRef.current) return undefined
    const hero = heroRef.current
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        const ambient = hero.querySelectorAll('.hero-ambient-img')
        gsap.set(ambient, { opacity: 0 })
        gsap.to(ambient[slide], { opacity: 1, duration: 0.9, ease: 'power2.out' })

        let split = null
        if (titleRef.current) {
          try { split = new SplitText(titleRef.current, { type: 'lines', linesClass: 'split-line' }) } catch { split = null }
          if (split) gsap.fromTo(split.lines, { yPercent: 112 }, { yPercent: 0, duration: 0.85, stagger: 0.08, ease: 'power4.out' })
        }
        gsap.fromTo('.hero-meta, .hero-description', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.07, ease: 'power3.out', delay: 0.15 })
        if (posterImgRef.current) {
          gsap.fromTo(posterImgRef.current, { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 0.75, ease: 'power3.out' })
        }
        return () => split?.revert()
      }, hero)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [current, slide])

  /* first hero entrance stagger */
  useLayoutEffect(() => {
    if (status !== 'success' || !slides.length || !heroRef.current) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.fromTo('.hero-eyebrow, .hero-actions, .hero-index, .hero-controls', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out', delay: 0.2 })
        gsap.fromTo('.hero-poster-frame', { opacity: 0, y: 30, rotate: 6 }, { opacity: 1, y: 0, rotate: 0, duration: 1, ease: 'power3.out', delay: 0.3 })
      }, heroRef)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [status, slides.length])

  /* autoplay + progress line */
  useEffect(() => {
    if (slides.length < 2) return undefined
    const tween = gsap.fromTo(progressRef.current, { scaleX: 0 }, { scaleX: 1, duration: HERO_SLIDE_MS, ease: 'none' })
    const call = gsap.delayedCall(HERO_SLIDE_MS, () => setSlide((value) => (value + 1) % slides.length))
    return () => { tween.kill(); call.kill() }
  }, [slide, slides.length])

  /* pointer parallax on the poster */
  useLayoutEffect(() => {
    if (!current || !heroRef.current) return undefined
    const hero = heroRef.current
    const frame = hero.querySelector('.hero-poster-frame')
    if (!frame) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)', () => {
      const moveX = gsap.quickTo(frame, 'x', { duration: 0.9, ease: 'power3.out' })
      const moveY = gsap.quickTo(frame, 'y', { duration: 0.9, ease: 'power3.out' })
      const onMove = (event) => {
        const bounds = hero.getBoundingClientRect()
        moveX(((event.clientX - bounds.left) / bounds.width - 0.5) * -14)
        moveY(((event.clientY - bounds.top) / bounds.height - 0.5) * -10)
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
  }, [current])

  /* scroll drift */
  useLayoutEffect(() => {
    if (status !== 'success' || !slides.length || !heroRef.current) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.to('.hero-grid', {
          yPercent: -7,
          opacity: 0.35,
          ease: 'none',
          scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: true },
        })
        gsap.to('.hero-ambient', {
          yPercent: 9,
          ease: 'none',
          scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: true },
        })
      }, heroRef)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [status, slides.length])

  /* toolbar + grid batch reveal */
  useLayoutEffect(() => {
    if (status !== 'success' || !movies.length) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.fromTo('.catalog-toolbar > *', { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.65, stagger: 0.08, ease: 'power3.out' })
        gsap.fromTo('.catalog-filters', { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 0.2 })
        gsap.set('.movie-card', { y: 42, opacity: 0 })
        ScrollTrigger.batch('.movie-card', {
          start: 'top 94%',
          once: true,
          onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 0.75, stagger: 0.07, ease: 'power3.out', overwrite: true }),
        })
        ScrollTrigger.refresh()
      })
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [status, movies.length])

  /* re-grid pulse on filter change */
  useLayoutEffect(() => {
    if (status !== 'success' || !gridRef.current || !filtered.length) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.fromTo(gridRef.current.children, { opacity: 0, scale: 0.975 }, { opacity: 1, scale: 1, duration: 0.34, stagger: 0.025, ease: 'power2.out', clearProps: 'transform,opacity' })
      }, gridRef)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [genre, sort, query, status, filtered.length])

  /* stats count-up */
  useLayoutEffect(() => {
    if (status !== 'success' || !movies.length || !statsRef.current) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        const values = statsRef.current.querySelectorAll('[data-count]')
        values.forEach((el) => {
          const target = Number(el.dataset.count)
          const state = { value: 0 }
          gsap.to(state, {
            value: target,
            duration: 1.4,
            ease: 'power2.out',
            onUpdate: () => { el.textContent = String(Math.round(state.value)).padStart(2, '0') },
            scrollTrigger: { trigger: statsRef.current, start: 'top 88%', once: true },
          })
        })
        gsap.fromTo(statsRef.current.children, { opacity: 0, y: 24 }, {
          opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: statsRef.current, start: 'top 88%', once: true },
        })
      }, statsRef)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [status, movies.length])

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
    {current && <section className="catalog-hero" ref={heroRef} aria-labelledby="featured-title">
      <div className="hero-ambient" aria-hidden="true">
        {slides.map((movie, index) => {
          const movieArtwork = getMovieArtwork(movie)
          const source = movieArtwork.backdrop || movieArtwork.poster
          return source
            ? <img key={movie.id} className="hero-ambient-img is-blurred" src={source} alt="" fetchPriority={index === 0 ? 'high' : undefined} />
            : <div key={movie.id} className="hero-ambient-img is-blurred hero-ambient-fallback" data-tint={index} />
        })}
      </div>
      <div className="hero-scrim" aria-hidden="true" />
      <div className="hero-grid">
        <div className="hero-copy">
          <span className="hero-eyebrow">კინოთეკის რჩეული</span>
          <h1 id="featured-title" className="hero-title" ref={titleRef}>{current.title || 'უსათაურო ფილმი'}</h1>
          <div className="hero-meta">
            <span>{current.year || 'წელი უცნობია'}</span>
            <span className="dot" aria-hidden="true" />
            <span>{current.genre || 'ჟანრი უცნობია'}</span>
          </div>
          <p className="hero-description">{current.description || 'ამ ფილმის აღწერა ჯერ არ დაემატა — გახსენი დეტალები და გაიგე მეტი.'}</p>
          <div className="hero-actions">
            <button className="button" type="button" onClick={() => navigate(`/movies/${current.id}`)}>ფილმის დეტალები <Icon name="arrowUpRight" size={16} /></button>
            <button className="button secondary" type="button" onClick={() => {
              setQuery('')
              setGenre('ყველა')
              document.querySelector('.catalog-toolbar')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}>მთელი კატალოგი</button>
          </div>
        </div>
        {artwork.poster && <div className="hero-poster" aria-hidden="true">
          <div className="hero-poster-frame">
            <img key={current.id} ref={posterImgRef} src={artwork.poster} alt="" />
          </div>
          <span className="hero-poster-caption">{normalizeMovieTitle(current.title).toUpperCase().slice(0, 30)} · {current.year || ''}</span>
        </div>}
      </div>
      <span className="hero-index"><strong>{String(slide + 1).padStart(2, '0')}</strong> / {String(slides.length).padStart(2, '0')}</span>
      <div className="hero-controls">
        <button className="hero-arrow" type="button" onClick={() => setSlide((value) => (value - 1 + slides.length) % slides.length)} aria-label="წინა ფილმი"><Icon name="chevronLeft" size={18} /></button>
        <div className="hero-progress" aria-hidden="true"><span ref={progressRef} /></div>
        <button className="hero-arrow" type="button" onClick={() => setSlide((value) => (value + 1) % slides.length)} aria-label="შემდეგი ფილმი"><Icon name="chevronRight" size={18} /></button>
      </div>
    </section>}

    {status === 'success' && movies.length > 0 && <Marquee genres={genres} />}

    <div className="catalog-toolbar" ref={toolbarRef}>
      <div className="catalog-heading"><span>ახლა კინოთეკაში</span><h2>ფილმების კოლექცია</h2></div>
      <label className="search-field">
        <span className="sr-only">ფილმის ძიება</span>
        <Icon name="search" size={18} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ძიება სათაურით, ჟანრით ან წლით" type="search" />
      </label>
      <span className="result-count"><strong>{String(filtered.length).padStart(2, '0')}</strong> ფილმი</span>
    </div>

    {genres.length > 0 && <div className="catalog-filters">
      {['ყველა', ...genres].map((value) => <button key={value} type="button" className={`chip ${genre === value ? 'active' : ''}`} onClick={() => setGenre(value)}>{value}</button>)}
      <span className="filter-spacer" aria-hidden="true" />
      <div className="sort-toggle" role="group" aria-label="დალაგება">
        <button type="button" className={sort === 'new' ? 'active' : ''} onClick={() => setSort('new')}>ახალი → ძველი</button>
        <button type="button" className={sort === 'az' ? 'active' : ''} onClick={() => setSort('az')}>ა-ჰ</button>
      </div>
    </div>}

    {actionError && <p className="inline-error" role="alert">{actionError}</p>}

    {status === 'loading' && <AsyncState type="loading" title="კატალოგი იტვირთება" message="ფილმებს სერვერიდან ვიღებთ." />}
    {status === 'error' && <AsyncState type="error" title="კატალოგი ვერ ჩაიტვირთა" message={error} onRetry={loadMovies} />}
    {status === 'success' && movies.length === 0 && <AsyncState type="empty" title="კატალოგი ცარიელია" message="ავტორიზაციის შემდეგ შეგიძლია პირველი ფილმი დაამატო." />}
    {status === 'success' && movies.length > 0 && filtered.length === 0 && <AsyncState type="empty" title="შედეგი ვერ მოიძებნა" message="შეცვალე საძიებო სიტყვა, ჟანრი ან დალაგება." />}

    {status === 'success' && filtered.length > 0 && <section className="movie-grid" ref={gridRef} aria-label="ფილმების კატალოგი">
      {filtered.map((movie) => <MovieCard key={movie.id} movie={movie} isFavorite={favoriteIds.has(String(movie.id))} onFavorite={addFavorite} />)}
    </section>}

    {status === 'success' && movies.length > 0 && <section className="stats-strip" ref={statsRef} aria-label="კატალოგის სტატისტიკა">
      <div className="stat"><span className="stat-value"><em data-count={stats.count}>00</em></span><span className="stat-label">ფილმი არქივში</span></div>
      <div className="stat"><span className="stat-value" data-count={stats.genres}>00</span><span className="stat-label">ჟანრი</span></div>
      <div className="stat"><span className="stat-value">{stats.range}</span><span className="stat-label">წლების დიაპაზონი</span></div>
    </section>}
  </div>
}
