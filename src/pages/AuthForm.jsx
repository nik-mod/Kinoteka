import { useLayoutEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { gsap } from '../gsap.js'
import { useAuth } from '../useAuth.js'

export default function AuthForm({ mode }) {
  const isRegister = mode === 'register'
  const [fields, setFields] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { isAuthenticated, login, register } = useAuth()
  const pageRef = useRef(null)
  const formRef = useRef(null)
  const letterRef = useRef(null)
  const navigate = useNavigate()

  useLayoutEffect(() => {
    if (!pageRef.current) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.fromTo('.auth-intro-copy > *', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.65, stagger: 0.09, ease: 'power3.out' })
        gsap.fromTo('.auth-intro-foot', { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 0.4 })
        gsap.fromTo('.giant-letter', { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 1.1, ease: 'power3.out', delay: 0.15 })
        gsap.fromTo('.form-panel .page-index, .form-panel h1', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' })
        gsap.fromTo('.form-panel form > *, .form-switch', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.07, ease: 'power3.out', delay: 0.25 })
        gsap.to('.giant-letter', { y: -14, duration: 4.5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1 })
      }, pageRef)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [isRegister])

  useLayoutEffect(() => {
    if (!error || !formRef.current) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(formRef.current, { x: 0 }, { keyframes: [{ x: -8 }, { x: 8 }, { x: -5 }, { x: 5 }, { x: 0 }], duration: 0.42, ease: 'power2.out' })
    })
    return () => mm.revert()
  }, [error])

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

  return <div className="page auth-page" ref={pageRef}>
    <section className="auth-intro">
      <span className="auth-frame" aria-hidden="true" />
      <span className="giant-letter" ref={letterRef} aria-hidden="true">K</span>
      <div className="auth-intro-copy">
        <span>{isRegister ? 'ახალი მაყურებელი' : 'კეთილი იყოს დაბრუნება'}</span>
        <p>{isRegister ? 'შექმენი პირადი სივრცე ფილმებისთვის — კატალოგი, ფავორიტები და შენი სიტყვები.' : 'დაუბრუნდი შენს შენახულ ფილმებს — სადაც არ უნდა იყო.'}</p>
      </div>
      <span className="auth-intro-foot">კინოთეკა · პირადი კინოარქივი</span>
    </section>
    <section className="form-panel">
      <span className="page-index">{isRegister ? '04' : '03'}</span>
      <h1>{isRegister ? 'რეგისტრაცია' : 'შესვლა'}</h1>
      <form onSubmit={submit} ref={formRef}>
        {isRegister && <label className="field"><span>სახელი</span><input name="name" value={fields.name} onChange={update} autoComplete="name" required /></label>}
        <label className="field"><span>ელფოსტა</span><input name="email" type="email" value={fields.email} onChange={update} autoComplete="email" required /></label>
        <label className="field"><span>პაროლი</span><input name="password" type="password" value={fields.password} onChange={update} autoComplete={isRegister ? 'new-password' : 'current-password'} minLength="6" required /></label>
        {isRegister && <label className="field"><span>გაიმეორე პაროლი</span><input name="password_confirmation" type="password" value={fields.password_confirmation} onChange={update} autoComplete="new-password" minLength="6" required /></label>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button full" type="submit" disabled={submitting}>{submitting ? 'მიმდინარეობს…' : isRegister ? 'ანგარიშის შექმნა' : 'შესვლა'}</button>
      </form>
      <p className="form-switch">{isRegister ? 'უკვე გაქვს ანგარიში?' : 'ჯერ არ გაქვს ანგარიში?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'შესვლა' : 'რეგისტრაცია'}</Link></p>
    </section>
  </div>
}
