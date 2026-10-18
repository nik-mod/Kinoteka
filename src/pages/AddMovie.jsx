import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'

export default function AddMovie() {
  const [fields, setFields] = useState({ title: '', description: '', year: '', genre: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

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
    <header className="page-header"><span className="page-index">05</span><h1>ფილმის დამატება</h1><p>შეავსე ძირითადი ინფორმაცია. ფილმი საერთო კატალოგში გამოჩნდება.</p></header>
    <form className="editorial-form" onSubmit={submit}>
      <label className="wide"><span>სათაური</span><input name="title" value={fields.title} onChange={update} required /></label>
      <label><span>გამოშვების წელი</span><input name="year" type="number" min="1888" max="2100" value={fields.year} onChange={update} required /></label>
      <label><span>ჟანრი</span><input name="genre" value={fields.genre} onChange={update} placeholder="მაგალითად: დრამა" required /></label>
      <label className="wide"><span>აღწერა</span><textarea name="description" value={fields.description} onChange={update} rows="7" required /></label>
      {error && <p className="form-error wide" role="alert">{error}</p>}
      <div className="form-actions wide"><button className="button" type="submit" disabled={submitting}>{submitting ? 'ემატება…' : 'ფილმის დამატება'}</button></div>
    </form>
  </div>
}
