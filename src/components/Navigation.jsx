import { useLayoutEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
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
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const links = baseLinks.filter((link) => !link.protected || isAuthenticated)

  useLayoutEffect(() => {
    const active = navRef.current?.querySelector('.nav-link.active .nav-marker')
    if (!active) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(active, { scaleY: 0, transformOrigin: 'top center' }, { scaleY: 1, duration: 0.42, ease: 'power3.out' })
    })
    return () => mm.revert()
  }, [location.pathname])

  function signOut() {
    logout()
    setOpen(false)
    navigate('/')
  }

  return <>
    <header className="mobile-header">
      <NavLink to="/" className="mobile-brand" onClick={() => setOpen(false)}>K</NavLink>
      <button className="icon-button" type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? 'მენიუს დახურვა' : 'მენიუს გახსნა'} aria-expanded={open}><Icon name={open ? 'close' : 'menu'} /></button>
    </header>
    <aside className={`side-rail ${open ? 'is-open' : ''}`}>
      <NavLink to="/" className="brand" onClick={() => setOpen(false)} aria-label="კინოთეკა — მთავარი გვერდი">
        <span className="brand-mark">K</span><span className="brand-name">კინოთეკა</span>
      </NavLink>
      <nav className="primary-nav" ref={navRef} aria-label="მთავარი ნავიგაცია">
        {links.map((link) => <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}><span className="nav-marker" aria-hidden="true" /><Icon name={link.icon} /><span>{link.label}</span></NavLink>)}
      </nav>
      <div className="rail-footer">
        <p>ქართული კინოს<br />პირადი არქივი</p>
        {isAuthenticated
          ? <button className="nav-link nav-button" type="button" onClick={signOut}><Icon name="logout" /><span>გამოსვლა</span></button>
          : <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}><Icon name="login" /><span>შესვლა</span></NavLink>}
      </div>
    </aside>
    {open && <button className="nav-backdrop" type="button" onClick={() => setOpen(false)} aria-label="მენიუს დახურვა" />}
  </>
}
