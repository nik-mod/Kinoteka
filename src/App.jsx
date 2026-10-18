import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { gsap, ScrollSmoother } from './gsap.js'
import { useAuth } from './useAuth.js'
import Cursor from './components/Cursor.jsx'
import Footer from './components/Footer.jsx'
import Navigation from './components/Navigation.jsx'
import Preloader from './components/Preloader.jsx'
import AddMovie from './pages/AddMovie.jsx'
import Favorites from './pages/Favorites.jsx'
import Login from './pages/Login.jsx'
import MovieDetail from './pages/MovieDetail.jsx'
import MovieList from './pages/MovieList.jsx'
import Register from './pages/Register.jsx'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function RouteView({ smootherRef }) {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const brassRef = useRef(null)
  const inkRef = useRef(null)

  useEffect(() => {
    if (location.pathname === displayLocation.pathname) return undefined
    const brass = brassRef.current
    const ink = inkRef.current
    if (!brass || !ink) {
      setDisplayLocation(location)
      return undefined
    }
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const timeline = gsap.timeline({
        onComplete: () => gsap.set([brass, ink], { visibility: 'hidden' }),
      })
      timeline
        .set([brass, ink], { visibility: 'visible' })
        .fromTo(brass, { scaleX: 0, transformOrigin: 'left center' }, { scaleX: 1, duration: 0.38, ease: 'power4.inOut' }, 0)
        .fromTo(ink, { scaleX: 0, transformOrigin: 'left center' }, { scaleX: 1, duration: 0.38, ease: 'power4.inOut' }, 0.09)
        .add(() => {
          setDisplayLocation(location)
          smootherRef.current?.scrollTo(0, false)
          window.scrollTo(0, 0)
        })
        .fromTo(ink, { transformOrigin: 'right center' }, { scaleX: 0, duration: 0.42, ease: 'power4.inOut' }, '+=0.06')
        .fromTo(brass, { transformOrigin: 'right center' }, { scaleX: 0, duration: 0.42, ease: 'power4.inOut' }, '<0.1')
      return () => { timeline.kill() }
    })
    return () => mm.revert()
  }, [location, displayLocation, smootherRef])

  return <>
    <div className="wipe-layer ink" ref={inkRef} aria-hidden="true" />
    <div className="wipe-layer brass" ref={brassRef} aria-hidden="true" />
    <div className="route-view" key={displayLocation.pathname}>
      <Routes location={displayLocation}>
        <Route path="/" element={<MovieList />} />
        <Route path="/movies/:id" element={<MovieDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        <Route path="/add-movie" element={<ProtectedRoute><AddMovie /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
    <Footer />
  </>
}

export default function App() {
  const smootherRef = useRef(null)
  const wrapperRef = useRef(null)
  const contentRef = useRef(null)

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      smootherRef.current = ScrollSmoother.create({
        wrapper: wrapperRef.current,
        content: contentRef.current,
        smooth: 1.15,
        effects: false,
      })
      return () => {
        smootherRef.current?.kill()
        smootherRef.current = null
      }
    })
    return () => mm.revert()
  }, [])

  return <>
    <Preloader />
    <Cursor />
    <Navigation />
    <div className="smooth-wrapper" ref={wrapperRef}>
      <div className="smooth-content" ref={contentRef}>
        <main className="app-content">
          <RouteView smootherRef={smootherRef} />
        </main>
      </div>
    </div>
  </>
}
