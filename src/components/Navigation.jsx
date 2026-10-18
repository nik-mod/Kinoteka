import { useLayoutEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { gsap } from '../gsap.js'
import { useAuth } from '../useAuth.js'
import Icon from './Icon.jsx'

const baseLinks = [
  { to: '/', label: 'კატალოგი', icon: 'catalog', end: true },
  { to: '/favorites', label: 'ფავორიტები', icon: 'heart', protected: true },
  { to: '/add-movie', label: 'ფილმის დამატება', icon: 'plus', protected: true },
]

export default function Navigation() {
  const [open, setOpen] = useState(false)
  const railRef = useRef(null)
  const backdropRef = useRef(null)
  const navRef = useRef(null)
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const links = baseLinks.filter((link) => !link.protected || isAuthenticated)

  useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.fromTo('.nav-link', { x: -16, opacity: 0 }, { x: 0, opacity: 1, duration: 0.55, stagger: 0.07, ease: 'power3.out', delay: 0.15 })
        gsap.fromTo('.brand', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', delay: 0.05 })
        gsap.fromTo('.rail-footer', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', delay: 0.4 })
      }, nav)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [isAuthenticated])

  useLayoutEffect(() => {
    const rail = railRef.current
    if (!rail || !open) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(rail, { xPercent: -102 }, { xPercent: 0, duration: 0.55, ease: 'power4.out', clearProps: 'transform' })
      if (backdropRef.current) gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 })
      return () => gsap.killTweensOf([rail, backdropRef.current])
    })
    return () => mm.revert()
  }, [open])

  function closeDrawer() {
    const rail = railRef.current
    const backdrop = backdropRef.current
    const mobile = window.matchMedia('(max-width: 980px)').matches
    if (mobile && rail && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
      gsap.to(rail, { xPercent: -102, duration: 0.38, ease: 'power3.in', onComplete: () => {
        gsap.set(rail, { clearProps: 'transform' })
        setOpen(false)
      } })
      if (backdrop) gsap.to(backdrop, { opacity: 0, duration: 0.3 })
    } else {
      setOpen(false)
    }
  }

  useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const active = nav.querySelector('.nav-link.active')
    const indicator = nav.querySelector('.nav-indicator')
    if (!active || !indicator) return
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.to(indicator, {
        top: active.offsetTop + active.offsetHeight / 2,
        height: Math.max(24, active.offsetHeight - 26),
        duration: 0.45,
        ease: 'power3.out',
      })
    })
    return () => mm.revert()
  }, [location.pathname, isAuthenticated])

  function signOut() {
    logout()
    closeDrawer()
    navigate('/')
  }

  return <>
    <header className="mobile-header">
      <NavLink to="/" className="mobile-brand" onClick={() => setOpen(false)}>
        <span className="brand-mark">K</span>კინოთეკა
      </NavLink>
      <button className="icon-button" type="button" onClick={() => (open ? closeDrawer() : setOpen(true))} aria-label={open ? 'მენიუს დახურვა' : 'მენიუს გახსნა'} aria-expanded={open}><Icon name={open ? 'close' : 'menu'} /></button>
    </header>
    <aside className={`side-rail ${open ? 'is-open' : ''}`} ref={railRef}>
      <NavLink to="/" className="brand" onClick={closeDrawer} aria-label="კინოთეკა — მთავარი გვერდი">
        <span className="brand-mark">K</span>
        <span>
          <span className="brand-name">კინოთეკა</span>
          <span className="brand-tag">კინოარქივი</span>
        </span>
      </NavLink>
      <nav className="primary-nav" ref={navRef} aria-label="მთავარი ნავიგაცია">
        <span className="nav-indicator" aria-hidden="true" />
        {links.map((link) => <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeDrawer}><Icon name={link.icon} /><span>{link.label}</span></NavLink>)}
      </nav>
      <div className="rail-rule" aria-hidden="true" />
      <div className="rail-footer">
        <p>შენი ფილმები.<br />შენი სივრცე.</p>
        {isAuthenticated
          ? <button className="nav-link nav-button" type="button" onClick={signOut}><Icon name="logout" /><span>გამოსვლა</span></button>
          : <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeDrawer}><Icon name="login" /><span>შესვლა</span></NavLink>}
      </div>
    </aside>
    {open && <button className="nav-backdrop" type="button" ref={backdropRef} onClick={closeDrawer} aria-label="მენიუს დახურვა" />}
  </>
}
