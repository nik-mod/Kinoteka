import { useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from '../gsap.js'
import { api } from '../api.js'
import Icon from '../components/Icon.jsx'

export default function AddMovie() {
  const [fields, setFields] = useState({ title: '', description: '', year: '', genre: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const headerRef = useRef(null)
  const formRef = useRef(null)
  const navigate = useNavigate()

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.fromTo('.page-index', { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' })
        gsap.fromTo('.page-header h1', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power4.out', delay: 0.08 })
        gsap.fromTo('.page-header p', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.25 })
        gsap.fromTo('.editorial-form .field, .form-actions', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.07, ease: 'power3.out', delay: 0.3 })
      }, formRef)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [])

  function update(event) {
    setFields((previous) => ({ ...previous, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    const year = Number(fields.year)
    if (!Number.isInteger(year) || year < 1888 || year > 2100) {
      setError('მიუთითე სწორი წელი 1888-დან 2100-მდე.')
      return
    }
    setSubmitting(true)
    try {
      const result = await api.addMovie({ ...fields, year })
      const movie = result?.data || result
      navigate(movie?.id ? `/movies/${movie.id}` : '/')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return <div className="page add-page">
    <header className="page-header" ref={headerRef}>
      <span className="page-index">05</span>
      <h1>ფილმის დამატება</h1>
      <p>შეავსე ძირითადი ინფორმაცია. ფილმი საერთო კატალოგში გამოჩნდება.</p>
    </header>
    <form className="editorial-form" onSubmit={submit} ref={formRef}>
      <label className="field wide"><span>01 · სათაური</span><input name="title" value={fields.title} onChange={update} placeholder="მაგალითად: შემოდგომის ზღაპარი" required /></label>
      <label className="field"><span>02 · გამოშვების წელი</span><input name="year" type="number" min="1888" max="2100" value={fields.year} onChange={update} placeholder="1996" required /></label>
      <label className="field"><span>03 · ჟანრი</span><input name="genre" value={fields.genre} onChange={update} placeholder="მაგალითად: დრამა" required /></label>
      <label className="field wide"><span>04 · აღწერა</span><textarea name="description" value={fields.description} onChange={update} rows="7" placeholder="რაზეა ეს ფილმი — რამდენიმე წინადადებით." required /></label>
      {error && <p className="form-error wide" role="alert">{error}</p>}
      <div className="form-actions wide"><button className="button" type="submit" disabled={submitting}>{submitting ? 'ემატება…' : 'ფილმის დამატება'} <Icon name="plus" size={15} /></button></div>
    </form>
  </div>
}
