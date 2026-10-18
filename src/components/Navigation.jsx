import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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
  const navRef = useRef(null)
  const railRef = useRef(null)
  const menuButtonRef = useRef(null)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 980px)').matches)
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const links = baseLinks.filter((link) => !link.protected || isAuthenticated)

  useLayoutEffect(() => {
    const rail = railRef.current
    if (!rail) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        const links = rail.querySelectorAll('.nav-link')
        const brand = rail.querySelector('.brand')
        const footer = rail.querySelector('.rail-footer')
        if (links.length) gsap.fromTo(links, { x: -10, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, stagger: 0.04, ease: 'power2.out' })
        if (brand) gsap.fromTo(brand, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' })
        if (footer) gsap.fromTo(footer, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out', delay: 0.08 })
      }, rail)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [isAuthenticated])

  useEffect(() => {
    const query = window.matchMedia('(max-width: 980px)')
    const syncViewport = () => {
      setIsMobile(query.matches)
      if (!query.matches) setOpen(false)
    }
    const closeOnHistory = () => setOpen(false)
    query.addEventListener('change', syncViewport)
    window.addEventListener('popstate', closeOnHistory)
    return () => {
      query.removeEventListener('change', syncViewport)
      window.removeEventListener('popstate', closeOnHistory)
    }
  }, [])

  useEffect(() => {
    if (!open || !isMobile) return undefined
    const main = document.querySelector('.app-content')
    const menuButton = menuButtonRef.current
    const previousInert = main?.inert
    const previousOverflow = document.body.style.overflow
    if (main) main.inert = true
    document.body.style.overflow = 'hidden'
    const focusableItems = () => [menuButtonRef.current, ...railRef.current.querySelectorAll('a[href], button:not(:disabled)')]
      .filter((element) => element && element.getClientRects().length > 0)
    const firstLink = railRef.current.querySelector('.nav-link')
    firstLink?.focus({ preventScroll: true })

    // Keep keyboard focus inside the open navigation, including its close button.
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
      }
      if (event.key !== 'Tab') return
      const items = focusableItems()
      const first = items[0]
      const last = items.at(-1)
      if (event.shiftKey && (document.activeElement === first || !items.includes(document.activeElement))) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !items.includes(document.activeElement))) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previousOverflow
      if (main) main.inert = previousInert
      if (window.matchMedia('(max-width: 980px)').matches) menuButton?.focus({ preventScroll: true })
    }
  }, [open, isMobile])

  function closeDrawer() { setOpen(false) }

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
    <a className="skip-link" href="#main-content" inert={isMobile && open}>მთავარ შინაარსზე გადასვლა</a>
    <header className="mobile-header">
      <NavLink to="/" className="mobile-brand" inert={isMobile && open} onClick={() => setOpen(false)}>
        <span className="brand-mark"><Icon name="film" size={19} /></span>კინოთეკა
      </NavLink>
      <button className="icon-button" ref={menuButtonRef} type="button" onClick={() => (open ? closeDrawer() : setOpen(true))} aria-label={open ? 'მენიუს დახურვა' : 'მენიუს გახსნა'} aria-controls="primary-navigation" aria-expanded={open}><Icon name={open ? 'close' : 'menu'} /></button>
    </header>
    <aside id="primary-navigation" ref={railRef} className={`side-rail ${open ? 'is-open' : ''}`} inert={isMobile && !open} aria-hidden={isMobile && !open}>
      <NavLink to="/" className="brand" onClick={closeDrawer} aria-label="კინოთეკა — მთავარი გვერდი">
        <span className="brand-mark"><Icon name="film" size={21} /></span>
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
    {isMobile && <button className={`nav-backdrop ${open ? 'is-visible' : ''}`} type="button" onClick={closeDrawer} aria-label="მენიუს დახურვა" tabIndex={-1} aria-hidden="true" />}
  </>
}
