import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { gsap, ScrollTrigger } from '../gsap.js'
import { api, CREATED_MOVIE_IDS_KEY, extractItem, extractList } from '../api.js'
import { useAuth } from '../useAuth.js'
import AsyncState from '../components/AsyncState.jsx'
import Icon from '../components/Icon.jsx'
import Marquee from '../components/Marquee.jsx'
import MovieCard from '../components/MovieCard.jsx'
import { getFeaturedMovie, getMovieArtwork, normalizeMovieTitle } from '../movieArtwork.js'

function favoriteMovies(payload) {
  return extractList(payload).map((item) => item?.movie || item).filter(Boolean)
}

function rememberedMovieIds() {
  try {
    const ids = JSON.parse(localStorage.getItem(CREATED_MOVIE_IDS_KEY) || '[]')
    return Array.isArray(ids) ? [...new Set(ids.filter((id) => typeof id === 'string' || typeof id === 'number').map(String))] : []
  } catch {
    return []
  }
}

async function loadRememberedMovies(catalogIds) {
  const ids = rememberedMovieIds().filter((id) => !catalogIds.has(id))
  const results = await Promise.allSettled(ids.map((id) => api.movie(id)))
  const movies = []
  let failed = false
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      failed = true
      return
    }
    const movie = extractItem(result.value)
    if (movie?.id != null && String(movie.id) === ids[index]) movies.push(movie)
    else failed = true
  })
  return { movies, failed }
}

function mergeMovies(catalog, remembered) {
  const ids = new Set()
  return [...catalog, ...remembered].filter((movie) => {
    if (movie?.id == null || ids.has(String(movie.id))) return false
    ids.add(String(movie.id))
    return true
  })
}

const HERO_SLIDE_MS = 7

export default function MovieList() {
  const [movies, setMovies] = useState([])
  const [createdMovies, setCreatedMovies] = useState([])
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('ყველა')
  const [year, setYear] = useState('all')
  const [sort, setSort] = useState('new')
  const [slide, setSlide] = useState(0)
  const [autoplayPaused, setAutoplayPaused] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [favoriteError, setFavoriteError] = useState('')
  const [createdMovieError, setCreatedMovieError] = useState('')
  const location = useLocation()
  const savedMovieId = location.state?.movieAdded ? location.state.savedMovie?.id : null
  const pageRef = useRef(null)
  const heroRef = useRef(null)
  const titleRef = useRef(null)
  const posterImgRef = useRef(null)
  const progressRef = useRef(null)
  const gridRef = useRef(null)
  const toolbarRef = useRef(null)
  const statsRef = useRef(null)
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  function retryMovies() {
    setStatus('loading')
    setError('')
    setReloadKey((value) => value + 1)
  }

  useEffect(() => {
    let active = true
    api.movies().then((payload) => {
      if (!active) return
      const catalog = extractList(payload)
      setMovies(catalog)
      setStatus('success')
      // Render the original page immediately. Extra records never hold it up.
      loadRememberedMovies(new Set(catalog.map((movie) => String(movie.id)))).then((created) => {
        if (!active) return
        setCreatedMovies(created.movies)
        setCreatedMovieError(created.failed ? 'ზოგი დამატებული ფილმის ჩატვირთვა ვერ მოხერხდა. სცადე გვერდის განახლება.' : '')
      }).catch((loadError) => { if (active) setCreatedMovieError(loadError.message) })
    }).catch((loadError) => {
      if (!active) return
      setError(loadError.message)
      setStatus('error')
    })
    const favorites = isAuthenticated ? api.favorites() : Promise.resolve([])
    favorites.then((payload) => {
      if (!active) return
      setFavoriteIds(new Set(favoriteMovies(payload).map((movie) => String(movie.id ?? movie.movie_id))))
      setFavoriteError('')
    }).catch((loadError) => { if (active) setFavoriteError(loadError.message) })
    return () => { active = false }
  }, [isAuthenticated, reloadKey])

  // Only render records read back from the API, including after a refresh.
  const catalogMovies = useMemo(() => mergeMovies(movies, createdMovies), [movies, createdMovies])
  const creationSuccess = savedMovieId != null && catalogMovies.some((movie) => String(movie.id) === String(savedMovieId))

  const slides = useMemo(() => {
    if (!movies.length) return []
    const featured = getFeaturedMovie(movies)
    const rest = movies.filter((movie) => movie.id !== featured?.id).slice(0, 4)
    return [featured, ...rest].filter(Boolean)
  }, [movies])

  const years = useMemo(() => [...new Set(catalogMovies.map((movie) => Number(movie.year)).filter((value) => Number.isInteger(value) && value > 0))].sort((a, b) => b - a), [catalogMovies])
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
    let list = catalogMovies
    if (genre !== 'ყველა') {
      list = list.filter((movie) => String(movie.genre || '').toLocaleLowerCase('ka').includes(genre.toLocaleLowerCase('ka')))
    }
    if (year !== 'all') list = list.filter((movie) => String(movie.year) === year)
    if (needle) {
      list = list.filter((movie) => [movie.title, movie.genre, movie.year].some((value) => String(value || '').toLocaleLowerCase('ka').includes(needle)))
    }
    if (sort === 'new') list = [...list].sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0))
    if (sort === 'az') list = [...list].sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'ka'))
    return list
  }, [catalogMovies, genre, year, query, sort])

  const stats = useMemo(() => {
    const years = catalogMovies.map((movie) => Number(movie.year)).filter(Boolean)
    return {
      count: catalogMovies.length,
      genres: genres.length,
      range: years.length ? `${Math.min(...years)}—${Math.max(...years)}` : '—',
    }
  }, [catalogMovies, genres])

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

        // Animate the heading as a whole so React can safely replace its text
        // when the featured film changes (SplitText can retain stale DOM nodes).
        if (titleRef.current) gsap.fromTo(titleRef.current, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' })
        gsap.fromTo('.hero-meta, .hero-description', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.07, ease: 'power3.out', delay: 0.15 })
        if (posterImgRef.current) {
          gsap.fromTo(posterImgRef.current, { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 0.75, ease: 'power3.out' })
        }
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
        const frame = heroRef.current.querySelector('.hero-poster-frame')
        if (frame) gsap.fromTo(frame, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' })
      }, heroRef)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [status, slides.length])

  /* autoplay + progress line */
  useEffect(() => {
    if (slides.length < 2 || autoplayPaused || !progressRef.current) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(progressRef.current, { scaleX: 0 }, { scaleX: 1, duration: HERO_SLIDE_MS, ease: 'none' })
      gsap.delayedCall(HERO_SLIDE_MS, () => setSlide((value) => (value + 1) % slides.length))
    })
    return () => mm.revert()
  }, [slide, slides.length, autoplayPaused])

  /* Scoped entrances; card reveals below own their opacity/transform. */
  useLayoutEffect(() => {
    if (status !== 'success') return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.fromTo('.catalog-toolbar > *', { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.65, stagger: 0.08, ease: 'power3.out' })
        gsap.fromTo('.catalog-filters', { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 0.2 })
      }, pageRef)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [status])

  /* One animation per card, including cards mounted after filtering. */
  useLayoutEffect(() => {
    if (status !== 'success' || !gridRef.current || !filtered.length) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        ScrollTrigger.batch(Array.from(gridRef.current.children), {
          start: 'top 96%',
          once: true,
          onEnter: (batch) => gsap.fromTo(batch, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.035, ease: 'power2.out', clearProps: 'transform,opacity' }),
        })
      }, gridRef)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [status, filtered])

  /* stats count-up */
  useLayoutEffect(() => {
    if (status !== 'success' || !catalogMovies.length || !statsRef.current) return undefined
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
  }, [status, catalogMovies.length])

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

  return <div className="page catalog-page" ref={pageRef}>
    {status === 'loading' && !current && <section className="catalog-hero hero-loading" aria-hidden="true">
      <div className="hero-grid"><div className="hero-loading-copy"><span /><span /><span /></div><div className="hero-poster hero-loading-poster" /></div>
    </section>}
    {current && <section className="catalog-hero" ref={heroRef} aria-labelledby="featured-title">
      <div className="hero-atmosphere" aria-hidden="true">
        <span className="hero-orb hero-orb-primary" />
        <span className="hero-orb hero-orb-red" />
      </div>
      <div className="hero-ambient" aria-hidden="true">
        {slides.map((movie, index) => {
          const movieArtwork = getMovieArtwork(movie)
          const source = movieArtwork.backdrop || movieArtwork.poster
          return source
            ? <img key={movie.id} className={`hero-ambient-img is-blurred${index === slide ? ' is-active' : ''}`} src={source} alt="" loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'low'} decoding="async" />
            : <div key={movie.id} className={`hero-ambient-img is-blurred hero-ambient-fallback${index === slide ? ' is-active' : ''}`} data-tint={index} />
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
              setYear('all')
              document.querySelector('.catalog-toolbar')?.scrollIntoView({ behavior: 'auto', block: 'start' })
            }}>მთელი კატალოგი</button>
          </div>
        </div>
        {artwork.poster && <div className="hero-poster" aria-hidden="true">
          <div className="hero-poster-frame">
            <img key={current.id} ref={posterImgRef} src={artwork.poster} alt="" width="500" height="750" decoding="async" />
          </div>
          <span className="hero-poster-caption">{normalizeMovieTitle(current.title).toUpperCase().slice(0, 30)} · {current.year || ''}</span>
        </div>}
      </div>
      <span className="hero-index"><strong>{String(slide + 1).padStart(2, '0')}</strong> / {String(slides.length).padStart(2, '0')}</span>
      <div className="hero-controls">
        <button className="hero-arrow" type="button" onClick={() => setSlide((value) => (value - 1 + slides.length) % slides.length)} aria-label="წინა ფილმი"><Icon name="chevronLeft" size={18} /></button>
        <button className="hero-arrow" type="button" onClick={() => setAutoplayPaused((value) => !value)} aria-pressed={autoplayPaused} aria-label={autoplayPaused ? 'ავტომატური ჩვენების გაგრძელება' : 'ავტომატური ჩვენების შეჩერება'}><Icon name={autoplayPaused ? 'play' : 'pause'} size={18} /></button>
        <div className="hero-progress" aria-hidden="true"><span ref={progressRef} /></div>
        <button className="hero-arrow" type="button" onClick={() => setSlide((value) => (value + 1) % slides.length)} aria-label="შემდეგი ფილმი"><Icon name="chevronRight" size={18} /></button>
      </div>
    </section>}

    {(status === 'loading' || (status === 'success' && movies.length > 0)) && <Marquee genres={genres} />}

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
      {['ყველა', ...genres].map((value) => <button key={value} type="button" className={`chip ${genre === value ? 'active' : ''}`} aria-pressed={genre === value} onClick={() => setGenre(value)}>{value}</button>)}
      <label className="year-filter"><span className="sr-only">წლით გაფილტვრა</span><select value={year} onChange={(event) => setYear(event.target.value)}><option value="all">ყველა წელი</option>{years.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <span className="filter-spacer" aria-hidden="true" />
      <div className="sort-toggle" role="group" aria-label="დალაგება">
        <button type="button" className={sort === 'new' ? 'active' : ''} aria-pressed={sort === 'new'} onClick={() => setSort('new')}>ახალი → ძველი</button>
        <button type="button" className={sort === 'az' ? 'active' : ''} aria-pressed={sort === 'az'} onClick={() => setSort('az')}>ა-ჰ</button>
      </div>
    </div>}

    {creationSuccess && status === 'success' && <p className="inline-success" role="status">ფილმი დაემატა და კატალოგში გამოჩნდა.</p>}
    {location.state?.rememberError && <p className="inline-error" role="alert">{location.state.rememberError}</p>}
    {createdMovieError && <p className="inline-error" role="alert">{createdMovieError}</p>}
    {favoriteError && <p className="inline-error" role="alert">ფავორიტების სტატუსის ჩატვირთვა ვერ მოხერხდა: {favoriteError}</p>}
    {actionError && <p className="inline-error" role="alert">{actionError}</p>}

    {status === 'loading' && <AsyncState type="loading" title="კატალოგი იტვირთება" message="ფილმებს სერვერიდან ვიღებთ." />}
    {status === 'error' && <AsyncState type="error" title="კატალოგი ვერ ჩაიტვირთა" message={error} onRetry={retryMovies} />}
    {status === 'success' && catalogMovies.length === 0 && <AsyncState type="empty" title="კატალოგი ცარიელია" message="ავტორიზაციის შემდეგ შეგიძლია პირველი ფილმი დაამატო." />}
    {status === 'success' && catalogMovies.length > 0 && filtered.length === 0 && <AsyncState type="empty" title="შედეგი ვერ მოიძებნა" message="შეცვალე საძიებო სიტყვა, ჟანრი ან დალაგება." />}

    {status === 'success' && filtered.length > 0 && <section className="movie-grid" ref={gridRef} aria-label="ფილმების კატალოგი">
      {filtered.map((movie) => <MovieCard key={movie.id} movie={movie} isFavorite={favoriteIds.has(String(movie.id))} onFavorite={addFavorite} />)}
    </section>}

    {status === 'success' && catalogMovies.length > 0 && <section className="stats-strip" ref={statsRef} aria-label="კატალოგის სტატისტიკა">
      <div className="stat"><span className="stat-value"><em data-count={stats.count}>00</em></span><span className="stat-label">ფილმი არქივში</span></div>
      <div className="stat"><span className="stat-value" data-count={stats.genres}>00</span><span className="stat-label">ჟანრი</span></div>
      <div className="stat"><span className="stat-value">{stats.range}</span><span className="stat-label">წლების დიაპაზონი</span></div>
    </section>}
  </div>
}
