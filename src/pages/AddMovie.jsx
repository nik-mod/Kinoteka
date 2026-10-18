import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from '../gsap.js'
import { api, CREATED_MOVIE_IDS_KEY, extractItem, extractList } from '../api.js'
import Icon from '../components/Icon.jsx'

function sameMovie(movie, fields) {
  return String(movie?.title || '').trim().toLocaleLowerCase() === fields.title.trim().toLocaleLowerCase()
    && Number(movie?.year) === Number(fields.year)
    && String(movie?.genre || '').trim().toLocaleLowerCase() === fields.genre.trim().toLocaleLowerCase()
    && String(movie?.description || '').trim() === fields.description.trim()
}

export default function AddMovie() {
  const [fields, setFields] = useState({ title: '', description: '', year: '', genre: '' })
  const [posterFile, setPosterFile] = useState(null)
  const [posterPreview, setPosterPreview] = useState('')
  const [posterError, setPosterError] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pendingVerification, setPendingVerification] = useState(null)
  const submittingRef = useRef(false)
  const pageRef = useRef(null)
  const posterInputRef = useRef(null)
  const posterPreviewRef = useRef('')
  const navigate = useNavigate()

  useEffect(() => {
    return () => {
      if (posterPreviewRef.current) URL.revokeObjectURL(posterPreviewRef.current)
    }
  }, [])

  function resetPosterSelection() {
    if (posterPreviewRef.current) URL.revokeObjectURL(posterPreviewRef.current)
    posterPreviewRef.current = ''
    setPosterPreview('')
    setPosterFile(null)
  }

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.fromTo('.add-intro > *', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.62, stagger: 0.08, ease: 'power3.out' })
        gsap.fromTo('.add-form-panel', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.12 })
        gsap.fromTo('.editorial-form .field, .form-actions', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out', delay: 0.25 })
      }, pageRef)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [])

  function update(event) {
    setFields((previous) => ({ ...previous, [event.target.name]: event.target.value }))
  }

  function selectPoster(event) {
    const file = event.target.files?.[0]
    setPosterError('')
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      resetPosterSelection()
      event.target.value = ''
      setPosterError('აირჩიე JPG, PNG ან WebP სურათი.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      resetPosterSelection()
      event.target.value = ''
      setPosterError('სურათის ზომა 5 MB-ს არ უნდა აღემატებოდეს.')
      return
    }
    if (posterPreviewRef.current) URL.revokeObjectURL(posterPreviewRef.current)
    posterPreviewRef.current = URL.createObjectURL(file)
    setPosterPreview(posterPreviewRef.current)
    setPosterFile(file)
  }

  function clearPoster() {
    resetPosterSelection()
    setPosterError('')
    if (posterInputRef.current) posterInputRef.current.value = ''
  }

  async function submit(event) {
    event.preventDefault()
    if (submittingRef.current) return
    setError('')
    const submittedFields = pendingVerification?.fields || { title: fields.title.trim(), description: fields.description.trim(), year: Number(fields.year), genre: fields.genre.trim() }
    const year = submittedFields.year
    if (!submittedFields.title || !submittedFields.description || !submittedFields.genre) {
      setError('შეავსე სათაური, აღწერა და ჟანრი.')
      return
    }
    if (!Number.isInteger(year) || year < 1888 || year > 2100) {
      setError('მიუთითე სწორი წელი 1888-დან 2100-მდე.')
      return
    }
    submittingRef.current = true
    setSubmitting(true)
    let postAccepted = Boolean(pendingVerification)
    try {
      let verification = pendingVerification
      if (!verification) {
        const beforeMovies = extractList(await api.movies())
        const result = await api.addMovie(submittedFields)
        postAccepted = true
        verification = { beforeMovies, result, fields: submittedFields }
        // Retrying a failed read-back must not send a second creation POST.
        setPendingVerification(verification)
      }
      const { beforeMovies, result } = verification
      const refreshedMovies = extractList(await api.movies())
      const responseMovie = extractItem(result)
      const responseId = responseMovie?.id
      const previousIds = new Set(beforeMovies.map((movie) => movie.id).filter((id) => id != null).map(String))
      const returnedById = responseId == null
        ? null
        : refreshedMovies.find((movie) => String(movie.id) === String(responseId) && !previousIds.has(String(movie.id)))
      const matchingBefore = beforeMovies.filter((movie) => sameMovie(movie, submittedFields)).length
      const matchingAfter = refreshedMovies.filter((movie) => sameMovie(movie, submittedFields))
      let newlyReturned = returnedById || (matchingAfter.length > matchingBefore
        ? matchingAfter.find((movie) => movie.id == null || !previousIds.has(String(movie.id)))
        : null)

      // A saved movie can be outside the catalog's original first page.
      // Read it back from the documented detail endpoint before displaying it.
      if (!newlyReturned && responseId != null && !previousIds.has(String(responseId))) {
        const savedMovie = extractItem(await api.movie(responseId))
        if (savedMovie?.id != null && String(savedMovie.id) === String(responseId)) newlyReturned = savedMovie
      }
      if (newlyReturned?.id == null) {
        throw new Error('სერვერმა POST მოთხოვნა მიიღო, მაგრამ შენახული ფილმის ხელახლა წაკითხვა ვერ დადასტურდა. წარმატება არ დადასტურებულა.')
      }
      let rememberError = ''
      try {
        let storedIds = []
        try { storedIds = JSON.parse(localStorage.getItem(CREATED_MOVIE_IDS_KEY) || '[]') } catch { /* recover from an invalid saved reference list */ }
        const ids = Array.isArray(storedIds) ? storedIds.map(String) : []
        if (!ids.includes(String(newlyReturned.id))) ids.push(String(newlyReturned.id))
        localStorage.setItem(CREATED_MOVIE_IDS_KEY, JSON.stringify(ids))
      } catch {
        rememberError = 'ფილმი სერვერზე შენახულია, მაგრამ ამ ბრაუზერმა მისი ID ვერ დაიმახსოვრა refresh-ისთვის.'
      }
      navigate('/', { state: { movieAdded: true, savedMovie: newlyReturned, rememberError } })
    } catch (submitError) {
      setError(postAccepted
        ? `ფილმის დამატების მოთხოვნა მიღებულია, მაგრამ კატალოგის ხელახლა წაკითხვა/შემოწმება ვერ მოხერხდა: ${submitError.message}`
        : submitError.message)
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const locked = submitting || Boolean(pendingVerification)

  return <div className="page add-page" ref={pageRef}>
    <section className="add-intro">
      <span className="page-index">05</span>
      <p className="add-kicker">კინოარქივის ახალი ჩანაწერი</p>
      <h1>ფილმის დამატება</h1>
      <p className="add-lede">შენი აღმოჩენა კინოთეკის ნაწილი გახდება. დაამატე ფილმის ისტორია, რომ სხვებმაც იპოვონ.</p>
      <div className="add-artwork" aria-hidden="true">
        <div className="add-artwork-ring" />
        <span className="add-artwork-mark">35</span>
        <span className="add-artwork-caption">FRAME · 001<br />THE ARCHIVE GROWS</span>
        <span className="add-artwork-icon"><Icon name="film" size={24} /></span>
      </div>
      <div className="add-note"><span>01</span><p>სათაური, წელი და ჟანრი დაგვეხმარება ფილმის პოვნაში.</p></div>
    </section>
    <section className="add-form-panel">
      <div className="add-form-heading"><span>ახალი ჩანაწერი</span><span className="add-status"><i /> მზადაა შესავსებად</span></div>
      <form className="editorial-form" onSubmit={submit} aria-busy={submitting}>
        <label className="field wide"><span>01 · სათაური</span><input name="title" value={fields.title} onChange={update} disabled={locked} placeholder="მაგალითად: შემოდგომის ზღაპარი" required /></label>
        <label className="field"><span>02 · გამოშვების წელი</span><input name="year" type="number" min="1888" max="2100" value={fields.year} onChange={update} disabled={locked} placeholder="1996" required /></label>
        <label className="field"><span>03 · ჟანრი</span><input name="genre" value={fields.genre} onChange={update} disabled={locked} placeholder="მაგალითად: დრამა" required /></label>
        <label className="field wide"><span>04 · აღწერა</span><textarea name="description" value={fields.description} onChange={update} disabled={locked} rows="5" placeholder="რაზეა ეს ფილმი — რამდენიმე წინადადებით." required /></label>
        <div className="poster-upload wide">
          <label className="poster-upload-label" htmlFor="movie-poster">05 · პოსტერი <small>არასავალდებულო · JPG, PNG ან WebP · მაქს. 5 MB</small></label>
          <input ref={posterInputRef} id="movie-poster" className="poster-file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPoster} disabled={locked} aria-describedby="poster-storage-note" />
          <p className="poster-storage-note" id="poster-storage-note">წინასწარი ნახვა მხოლოდ ამ სესიაშია ხელმისაწვდომი. პოსტერი სერვერზე არ აიტვირთება და ფილმთან არ შეინახება.</p>
          {posterError && <p className="form-error poster-upload-error" role="alert">{posterError}</p>}
          {posterPreview && <div className="poster-preview">
            <img src={posterPreview} alt="არჩეული პოსტერის წინასწარი ნახვა" />
            <div className="poster-preview-info"><strong>{posterFile.name}</strong><span>{(posterFile.size / (1024 * 1024)).toFixed(2)} MB · მხოლოდ წინასწარი ნახვა</span><button className="button secondary poster-clear" type="button" onClick={clearPoster} disabled={locked}>წაშლა</button></div>
          </div>}
        </div>
        {error && <p className="form-error wide" role="alert">{error}</p>}
        <div className="form-actions wide"><button className="button" type="submit" disabled={submitting}>{submitting ? 'მიმდინარეობს…' : pendingVerification ? 'შენახვის გადამოწმება' : 'ფილმის დამატება'} <Icon name="plus" size={15} /></button></div>
      </form>
    </section>
  </div>
}
