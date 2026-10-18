import { useLayoutEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { gsap } from '../gsap.js'
import { useAuth } from '../useAuth.js'
import Icon from '../components/Icon.jsx'

export default function AuthForm({ mode }) {
  const isRegister = mode === 'register'
  const [fields, setFields] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { isAuthenticated, login, register } = useAuth()
  const pageRef = useRef(null)
  const formRef = useRef(null)
  const submittingRef = useRef(false)
  const navigate = useNavigate()

  useLayoutEffect(() => {
    if (!pageRef.current) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.fromTo('.auth-poster-wall img', { opacity: 0.35 }, { opacity: 1, duration: 1.2, stagger: 0.08, ease: 'power2.out' })
        gsap.fromTo('.form-panel', { opacity: 0, y: 24, scale: 0.985 }, { opacity: 1, y: 0, scale: 1, duration: 0.72, ease: 'power3.out', delay: 0.1 })
        gsap.fromTo('.auth-brand, .form-panel .page-index, .form-panel h1, .auth-subtitle, .form-panel form > *, .form-switch', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.055, ease: 'power3.out', delay: 0.22 })
      }, pageRef)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [isRegister])

  useLayoutEffect(() => {
    if (!error || !formRef.current) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(formRef.current, { opacity: 0.72, y: 4 }, { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' })
    })
    return () => mm.revert()
  }, [error])

  if (isAuthenticated) return <Navigate to="/" replace />

  function update(event) {
    setFields((previous) => ({ ...previous, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    if (submittingRef.current) return
    setError('')
    if (isRegister && fields.password !== fields.password_confirmation) {
      setError('პაროლები ერთმანეთს არ ემთხვევა.')
      return
    }
    submittingRef.current = true
    setSubmitting(true)
    try {
      const payload = isRegister ? fields : { email: fields.email, password: fields.password }
      await (isRegister ? register(payload) : login(payload))
      navigate('/')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return <div className="page auth-page" ref={pageRef}>
    <div className="auth-ambient" aria-hidden="true">
      <div className="auth-poster-wall">
        <img src="/posters/inception.jpg" alt="" />
        <img src="/posters/the-dark-knight.jpg" alt="" />
        <img src="/posters/parasite.jpg" alt="" />
        <img src="/posters/interstellar.jpg" alt="" />
        <img src="/posters/fight-club.jpg" alt="" />
        <img src="/posters/the-matrix.jpg" alt="" />
        <img src="/posters/titanic.jpg" alt="" />
      </div>
      <span className="auth-light auth-light-one" />
      <span className="auth-light auth-light-two" />
      <span className="auth-red-wash" />
    </div>
    <section className="form-panel auth-card">
      <div className="auth-brand"><span className="brand-mark"><Icon name="film" size={18} /></span><span>კინოთეკა<small>პირადი კინოარქივი</small></span><span className="auth-brand-status"><i /> SECURE ACCESS</span></div>
      <span className="page-index">{isRegister ? '04' : '03'}</span>
      <h1>{isRegister ? 'რეგისტრაცია' : 'შესვლა'}</h1>
      <p className="auth-subtitle">{isRegister ? 'შექმენი ანგარიში და შეინახე ფილმები, რომლებიც შენთვის მნიშვნელოვანია.' : 'შედი კინოთეკაში და გააგრძელე შენი პირადი კინოარქივის შექმნა.'}</p>
      <form onSubmit={submit} ref={formRef} aria-busy={submitting}>
        {isRegister && <label className="field"><span>სახელი</span><input name="name" value={fields.name} onChange={update} autoComplete="name" required /></label>}
        <label className="field"><span>ელფოსტა</span><input name="email" type="email" value={fields.email} onChange={update} autoComplete="email" required /></label>
        <label className="field"><span>პაროლი</span><input name="password" type="password" value={fields.password} onChange={update} autoComplete={isRegister ? 'new-password' : 'current-password'} minLength="6" required /></label>
        {isRegister && <label className="field"><span>გაიმეორე პაროლი</span><input name="password_confirmation" type="password" value={fields.password_confirmation} onChange={update} autoComplete="new-password" minLength="6" required /></label>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button full" type="submit" disabled={submitting}>{submitting ? 'მიმდინარეობს…' : isRegister ? 'ანგარიშის შექმნა' : 'შესვლა'}</button>
      </form>
      <p className="form-switch">{isRegister ? 'უკვე გაქვს ანგარიში?' : 'ჯერ არ გაქვს ანგარიში?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'შესვლა' : 'რეგისტრაცია'}</Link></p>
      <div className="auth-card-foot"><span>35MM · DIGITAL · ARCHIVE</span><span>© KINOTEKA</span></div>
    </section>
  </div>
}
