import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import gsap from 'gsap'
import { api, extractItem, extractList } from '../api.js'
import { useAuth } from '../useAuth.js'
import AsyncState from '../components/AsyncState.jsx'
import Icon from '../components/Icon.jsx'

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
  const [movie, setMovie] = useState(null)
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

      const [commentResult, favoriteResult, omdbResult] = await Promise.allSettled([
        api.comments(id),
        isAuthenticated ? api.favorites() : Promise.resolve([]),
        api.omdb(nextMovie.title),
      ])
      setComments(commentResult.status === 'fulfilled' ? extractList(commentResult.value) : [])
      if (favoriteResult.status === 'fulfilled') setIsFavorite(unwrapFavoriteIds(favoriteResult.value).has(String(id)))
      if (omdbResult.status === 'fulfilled') setOmdb(omdbResult.value)
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
      const [commentResult, favoriteResult, omdbResult] = await Promise.allSettled([
        api.comments(id),
        isAuthenticated ? api.favorites() : Promise.resolve([]),
        api.omdb(nextMovie.title),
      ])
      if (!active) return
      setComments(commentResult.status === 'fulfilled' ? extractList(commentResult.value) : [])
      if (favoriteResult.status === 'fulfilled') setIsFavorite(unwrapFavoriteIds(favoriteResult.value).has(String(id)))
      if (omdbResult.status === 'fulfilled') setOmdb(omdbResult.value)
    }).catch((loadError) => {
      if (!active) return
      setError(loadError.message)
      setStatus('error')
    })
    return () => { active = false }
  }, [id, isAuthenticated])

  useLayoutEffect(() => {
    if (!movie || !titleRef.current) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(titleRef.current, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'power4.out' })
    })
    return () => mm.revert()
  }, [movie])

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
    <Link className="back-link" to="/">კატალოგში დაბრუნება</Link>
    <header className="detail-hero">
      <div className="detail-meta"><span>{movie.year || 'წელი უცნობია'}</span><span>{movie.genre || 'ჟანრი უცნობია'}</span></div>
      <h1 ref={titleRef}>{movie.title}</h1>
      <div className="detail-actions">
        <button ref={favoriteRef} className={`button favorite-action ${isFavorite ? 'is-favorite' : ''}`} type="button" onClick={addFavorite} disabled={isFavorite} aria-pressed={isFavorite}><Icon name="heart" />{isFavorite ? 'ფავორიტებშია' : 'ფავორიტებში დამატება'}</button>
      </div>
    </header>
    <div className="detail-body">
      <section className="synopsis"><h2>ფილმის შესახებ</h2><p>{movie.description || 'აღწერა ჯერ არ არის დამატებული.'}</p></section>
      {omdb && <aside className="facts"><h2>IMDb ცნობები</h2><dl><div><dt>რეიტინგი</dt><dd>{omdb.imdbRating}</dd></div><div><dt>ხმები</dt><dd>{omdb.imdbVotes}</dd></div><div><dt>რეჟისორი</dt><dd>{omdb.Director}</dd></div><div><dt>ხანგრძლივობა</dt><dd>{omdb.Runtime}</dd></div></dl></aside>}
    </div>
    {actionError && <p className="inline-error" role="alert">{actionError}</p>}
    <section className="comments-section">
      <div className="comments-heading"><h2>კომენტარები</h2><span>{comments.length}</span></div>
      {isAuthenticated ? <form className="comment-form" onSubmit={postComment}><label><span className="sr-only">კომენტარი</span><textarea rows="3" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="დაწერე რას ფიქრობ ფილმზე" required /></label><button className="button" type="submit" disabled={submitting}>{submitting ? 'იგზავნება…' : 'კომენტარის დამატება'}</button></form> : <p className="login-note"><Link to="/login">შედი ანგარიშში</Link>, რომ კომენტარი დატოვო.</p>}
      {comments.length ? <div className="comment-list">{comments.map((item, index) => <article className="comment" key={item.id || index}><h3>{commentAuthor(item)}</h3><p>{item.content || item.comment || ''}</p></article>)}</div> : <div className="comments-empty"><p>კომენტარები ჯერ არ არის. დაიწყე საუბარი ამ ფილმზე.</p></div>}
    </section>
  </article>
}
