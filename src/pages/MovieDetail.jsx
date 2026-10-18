import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { gsap, ScrollTrigger, SplitText } from '../gsap.js'
import { api, extractItem, extractList } from '../api.js'
import { useAuth } from '../useAuth.js'
import AsyncState from '../components/AsyncState.jsx'
import Icon from '../components/Icon.jsx'
import MovieCard from '../components/MovieCard.jsx'
import { getMovieArtwork } from '../movieArtwork.js'

function unwrapFavoriteIds(payload) {
  return new Set(extractList(payload).map((item) => String(item?.movie?.id ?? item?.movie_id ?? item?.id)).filter(Boolean))
}

function commentAuthor(comment) {
  return comment?.user?.name || comment?.author?.name || comment?.name || 'მაყურებელი'
}

export default function MovieDetail() {
  const { id } = useParams()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const titleRef = useRef(null)
  const favoriteRef = useRef(null)
  const heroRef = useRef(null)
  const bodyRef = useRef(null)
  const [movie, setMovie] = useState(null)
  const [allMovies, setAllMovies] = useState([])
  const [comments, setComments] = useState([])
  const [omdb, setOmdb] = useState(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pulse, setPulse] = useState(0)

  async function loadDetail() {
    setStatus('loading')
    setError('')
    try {
      const moviePayload = await api.movie(id)
      const nextMovie = extractItem(moviePayload)
      if (!nextMovie?.id) throw new Error('ფილმის მონაცემები არასრულია.')
      setMovie(nextMovie)
      setStatus('success')

      const [commentResult, favoriteResult, omdbResult, catalogResult] = await Promise.allSettled([
        api.comments(id),
        isAuthenticated ? api.favorites() : Promise.resolve([]),
        api.omdb(nextMovie.title),
        api.movies(),
      ])
      setComments(commentResult.status === 'fulfilled' ? extractList(commentResult.value) : [])
      if (favoriteResult.status === 'fulfilled') setIsFavorite(unwrapFavoriteIds(favoriteResult.value).has(String(id)))
      if (omdbResult.status === 'fulfilled') setOmdb(omdbResult.value)
      if (catalogResult.status === 'fulfilled') setAllMovies(extractList(catalogResult.value))
    } catch (loadError) {
      setError(loadError.message)
      setStatus('error')
    }
  }

  useEffect(() => {
    let active = true
    api.movie(id).then(async (moviePayload) => {
      const nextMovie = extractItem(moviePayload)
      if (!nextMovie?.id) throw new Error('ფილმის მონაცემები არასრულია.')
      if (!active) return
      setMovie(nextMovie)
      setStatus('success')
      const [commentResult, favoriteResult, omdbResult, catalogResult] = await Promise.allSettled([
        api.comments(id),
        isAuthenticated ? api.favorites() : Promise.resolve([]),
        api.omdb(nextMovie.title),
        api.movies(),
      ])
      if (!active) return
      setComments(commentResult.status === 'fulfilled' ? extractList(commentResult.value) : [])
      if (favoriteResult.status === 'fulfilled') setIsFavorite(unwrapFavoriteIds(favoriteResult.value).has(String(id)))
      if (omdbResult.status === 'fulfilled') setOmdb(omdbResult.value)
      if (catalogResult.status === 'fulfilled') setAllMovies(extractList(catalogResult.value))
    }).catch((loadError) => {
      if (!active) return
      setError(loadError.message)
      setStatus('error')
    })
    return () => { active = false }
  }, [id, isAuthenticated])

  const artwork = useMemo(() => getMovieArtwork(movie), [movie])
  const similar = useMemo(() => {
    if (!movie || !allMovies.length) return []
    const ownGenres = String(movie.genre || '').toLocaleLowerCase('ka')
    return allMovies
      .filter((candidate) => String(candidate.id) !== String(movie.id))
      .map((candidate) => {
        const candidateGenres = String(candidate.genre || '').toLocaleLowerCase('ka')
        const shared = ownGenres && candidateGenres
          ? String(candidate.genre || '').split(/[,.]/).filter((part) => part.trim() && ownGenres.includes(part.trim().toLocaleLowerCase('ka'))).length
          : 0
        return { candidate, shared }
      })
      .filter((entry) => entry.shared > 0)
      .sort((a, b) => b.shared - a.shared)
      .slice(0, 4)
      .map((entry) => entry.candidate)
  }, [movie, allMovies])

  /* title split reveal */
  useLayoutEffect(() => {
    if (!movie || !titleRef.current) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      let split = null
      try { split = new SplitText(titleRef.current, { type: 'lines', linesClass: 'split-line' }) } catch { split = null }
      if (split) gsap.fromTo(split.lines, { yPercent: 112 }, { yPercent: 0, duration: 0.95, stagger: 0.09, ease: 'power4.out', delay: 0.1 })
      return () => split?.revert()
    })
    return () => mm.revert()
  }, [movie])

  /* hero entrance + ambient parallax */
  useLayoutEffect(() => {
    if (!movie || !heroRef.current) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.fromTo('.detail-meta', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.25 })
        gsap.fromTo('.rating-pill', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', delay: 0.55 })
        gsap.fromTo('.poster-card', { opacity: 0, y: 34, rotate: 3 }, { opacity: 1, y: 0, rotate: 0, duration: 0.9, ease: 'power3.out', delay: 0.35 })
        gsap.to('.detail-ambient', {
          yPercent: 16,
          ease: 'none',
          scrollTrigger: { trigger: '.detail-hero', start: 'top top', end: 'bottom top', scrub: true },
        })
      }, heroRef)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [movie])

  /* body scroll reveals */
  useLayoutEffect(() => {
    if (!movie || !bodyRef.current) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.fromTo('.synopsis h2, .facts-wrap h2', { opacity: 0, y: 22 }, {
          opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: '.detail-body', start: 'top 82%', once: true },
        })
        gsap.fromTo('.synopsis p', { opacity: 0, y: 24 }, {
          opacity: 1, y: 0, duration: 0.75, ease: 'power3.out',
          scrollTrigger: { trigger: '.detail-body', start: 'top 78%', once: true },
        })
        gsap.fromTo('.facts dl > div', { opacity: 0, x: 26 }, {
          opacity: 1, x: 0, duration: 0.55, stagger: 0.07, ease: 'power3.out',
          scrollTrigger: { trigger: '.facts', start: 'top 86%', once: true },
        })
        gsap.fromTo('.comment', { opacity: 0, y: 22 }, {
          opacity: 1, y: 0, duration: 0.55, stagger: 0.06, ease: 'power3.out',
          scrollTrigger: { trigger: '.comment-list', start: 'top 88%', once: true },
        })
      }, bodyRef)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [movie, comments.length])

  /* similar rail reveal */
  useLayoutEffect(() => {
    if (!similar.length) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo('.similar-section .movie-card', { y: 34, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.65, stagger: 0.07, ease: 'power3.out',
        scrollTrigger: { trigger: '.similar-section', start: 'top 88%', once: true },
      })
      return () => { gsap.killTweensOf('.similar-section .movie-card') }
    })
    return () => mm.revert()
  }, [similar.length])

  useLayoutEffect(() => {
    if (!pulse || !favoriteRef.current) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(favoriteRef.current, { scale: 0.86 }, { scale: 1, duration: 0.45, ease: 'back.out(2.5)' })
    })
    return () => mm.revert()
  }, [pulse])

  async function addFavorite() {
    if (!isAuthenticated) return navigate('/login')
    if (isFavorite) return
    setActionError('')
    try {
      await api.addFavorite(movie.id)
      setIsFavorite(true)
      setPulse((value) => value + 1)
    } catch (favoriteError) {
      setActionError(favoriteError.message)
    }
  }

  async function postComment(event) {
    event.preventDefault()
    const content = comment.trim()
    if (!content) return
    setSubmitting(true)
    setActionError('')
    try {
      await api.addComment(id, content)
      setComment('')
      setComments(extractList(await api.comments(id)))
    } catch (commentError) {
      setActionError(commentError.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading') return <div className="page"><AsyncState type="loading" title="ფილმი იტვირთება" /></div>
  if (status === 'error') return <div className="page"><AsyncState type="error" title="ფილმი ვერ ჩაიტვირთა" message={error} onRetry={loadDetail} /></div>
  if (!movie) return null

  return <article className="page detail-page">
    <header className="detail-hero" ref={heroRef}>
      <div className="detail-ambient" aria-hidden="true">
        {(artwork.backdrop || artwork.poster)
          ? <img src={artwork.backdrop || artwork.poster} alt="" fetchPriority="high" />
          : <div className="hero-ambient-fallback" />}
      </div>
      <div className="detail-scrim" aria-hidden="true" />
      <Link className="back-link" to="/"><Icon name="arrowLeft" size={15} />კატალოგში დაბრუნება</Link>
      <div className="detail-hero-inner">
        <div className="detail-meta">
          <span>{movie.year || 'წელი უცნობია'}</span>
          <span className="dot" aria-hidden="true" />
          <span>{movie.genre || 'ჟანრი უცნობია'}</span>
          {omdb?.Runtime && omdb.Runtime !== 'N/A' && <><span className="dot" aria-hidden="true" /><span>{omdb.Runtime}</span></>}
        </div>
        <h1 className="detail-title" ref={titleRef}>{movie.title}</h1>
        {omdb?.imdbRating && omdb.imdbRating !== 'N/A' && <span className="rating-pill"><Icon name="star" size={16} />{omdb.imdbRating}<small> / 10 IMDb</small></span>}
        <div className="detail-actions">
          <button ref={favoriteRef} className={`button favorite-action ${isFavorite ? 'is-favorite' : ''}`} type="button" onClick={addFavorite} disabled={isFavorite} aria-pressed={isFavorite}><Icon name="heart" size={17} />{isFavorite ? 'ფავორიტებშია' : 'ფავორიტებში დამატება'}</button>
        </div>
      </div>
    </header>

    <div className="detail-body" ref={bodyRef}>
      <div className="detail-main">
        <section className="synopsis">
          <h2><small>01</small> ფილმის შესახებ</h2>
          <p>{movie.description || 'ამ ფილმის აღწერა ჯერ არ არის დამატებული.'}</p>
        </section>
        <section className="facts-wrap facts">
          <h2><small>02</small> ცნობები</h2>
          <dl>
            <div><dt>სათაური</dt><dd>{movie.title}</dd></div>
            {movie.year && <div><dt>გამოშვების წელი</dt><dd>{movie.year}</dd></div>}
            {movie.genre && <div><dt>ჟანრი</dt><dd>{movie.genre}</dd></div>}
            {omdb?.Director && omdb.Director !== 'N/A' && <div><dt>რეჟისორი</dt><dd>{omdb.Director}</dd></div>}
            {omdb?.imdbRating && omdb.imdbRating !== 'N/A' && <div><dt>IMDb რეიტინგი</dt><dd>{omdb.imdbRating} / 10</dd></div>}
            {omdb?.imdbVotes && omdb.imdbVotes !== 'N/A' && <div><dt>ხმები</dt><dd>{omdb.imdbVotes}</dd></div>}
            {omdb?.Runtime && omdb.Runtime !== 'N/A' && <div><dt>ხანგრძლივობა</dt><dd>{omdb.Runtime}</dd></div>}
          </dl>
        </section>
      </div>
      <aside className="poster-panel">
        <div className="poster-card">
          {artwork.poster
            ? <img src={artwork.poster} alt={`${movie.title} — პოსტერი`} />
            : <span className="movie-fallback" aria-hidden="true"><span>{movie.title?.slice(0, 1) || 'K'}</span></span>}
        </div>
      </aside>
    </div>

    {actionError && <p className="inline-error" role="alert">{actionError}</p>}

    {similar.length > 0 && <section className="similar-section">
      <h2><small>03</small> მსგავსი ფილმები</h2>
      <div className="similar-rail">
        {similar.map((candidate) => <MovieCard key={candidate.id} movie={candidate} canFavorite={false} />)}
      </div>
    </section>}

    <section className="comments-section">
      <div className="comments-heading"><h2><small>{similar.length ? '04' : '03'}</small> კომენტარები</h2><span>{comments.length}</span></div>
      {isAuthenticated
        ? <form className="comment-form" onSubmit={postComment}>
            <label className="field"><span className="sr-only">კომენტარი</span><textarea rows="3" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="დაწერე რას ფიქრობ ფილმზე" required /></label>
            <button className="button" type="submit" disabled={submitting}>{submitting ? 'იგზავნება…' : 'გაგზავნა'} <Icon name="arrowUpRight" size={15} /></button>
          </form>
        : <p className="login-note"><Link to="/login">შედი ანგარიშში</Link>, რომ კომენტარი დატოვო.</p>}
      {comments.length
        ? <div className="comment-list">{comments.map((item, index) => <article className="comment" key={item.id || index}>
            <h3><span className="comment-author-mark" aria-hidden="true">{(commentAuthor(item)[0] || 'მ').toUpperCase()}</span>{commentAuthor(item)}</h3>
            <p>{item.content || item.comment || ''}</p>
          </article>)}</div>
        : <div className="comments-empty"><p>კომენტარები ჯერ არ არის. დაიწყე საუბარი ამ ფილმზე.</p></div>}
    </section>
  </article>
}
