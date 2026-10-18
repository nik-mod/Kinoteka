import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../useAuth.js'

export default function AuthForm({ mode }) {
  const isRegister = mode === 'register'
  const [fields, setFields] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { isAuthenticated, login, register } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) return <Navigate to="/" replace />

  function update(event) {
    setFields((previous) => ({ ...previous, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (isRegister && fields.password !== fields.password_confirmation) {
      setError('პაროლები ერთმანეთს არ ემთხვევა.')
      return
    }
    setSubmitting(true)
    try {
      const payload = isRegister ? fields : { email: fields.email, password: fields.password }
      await (isRegister ? register(payload) : login(payload))
      navigate('/')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return <div className="page auth-page">
    <section className="auth-intro"><span className="giant-letter">K</span><p>{isRegister ? 'შექმენი პირადი სივრცე ფილმებისთვის.' : 'დაუბრუნდი შენს შენახულ ფილმებს.'}</p></section>
    <section className="form-panel">
      <span className="form-number">{isRegister ? '04' : '03'}</span>
      <h1>{isRegister ? 'რეგისტრაცია' : 'შესვლა'}</h1>
      <form onSubmit={submit}>
        {isRegister && <label><span>სახელი</span><input name="name" value={fields.name} onChange={update} autoComplete="name" required /></label>}
        <label><span>ელფოსტა</span><input name="email" type="email" value={fields.email} onChange={update} autoComplete="email" required /></label>
        <label><span>პაროლი</span><input name="password" type="password" value={fields.password} onChange={update} autoComplete={isRegister ? 'new-password' : 'current-password'} minLength="6" required /></label>
        {isRegister && <label><span>გაიმეორე პაროლი</span><input name="password_confirmation" type="password" value={fields.password_confirmation} onChange={update} autoComplete="new-password" minLength="6" required /></label>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button full" type="submit" disabled={submitting}>{submitting ? 'მიმდინარეობს…' : isRegister ? 'ანგარიშის შექმნა' : 'შესვლა'}</button>
      </form>
      <p className="form-switch">{isRegister ? 'უკვე გაქვს ანგარიში?' : 'ჯერ არ გაქვს ანგარიში?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'შესვლა' : 'რეგისტრაცია'}</Link></p>
    </section>
  </div>
}
