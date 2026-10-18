import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { gsap } from './gsap.js'
import { useAuth } from './useAuth.js'
import Footer from './components/Footer.jsx'
import Navigation from './components/Navigation.jsx'
import AsyncState from './components/AsyncState.jsx'
import MovieList from './pages/MovieList.jsx'

const AddMovie = lazy(() => import('./pages/AddMovie.jsx'))
const Favorites = lazy(() => import('./pages/Favorites.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const MovieDetail = lazy(() => import('./pages/MovieDetail.jsx'))
const Register = lazy(() => import('./pages/Register.jsx'))

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function RouteView() {
  const location = useLocation()
  const previousPath = useRef(location.pathname)
  const viewRef = useRef(null)

  useEffect(() => {
    if (previousPath.current === location.pathname) return
    previousPath.current = location.pathname
    window.scrollTo(0, 0)
    document.getElementById('main-content')?.focus({ preventScroll: true })
  }, [location.pathname])

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.fromTo(viewRef.current, { opacity: 0.85 }, { opacity: 1, duration: 0.3, ease: 'power2.out', clearProps: 'opacity' })
      }, viewRef)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [location.pathname])

  return <>
    <div className="route-view" ref={viewRef}>
      <Suspense fallback={<div className="page"><AsyncState type="loading" title="გვერდი იტვირთება" /></div>}>
      <Routes>
        <Route path="/" element={<MovieList />} />
        <Route path="/movies/:id" element={<MovieDetail key={location.pathname} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        <Route path="/add-movie" element={<ProtectedRoute><AddMovie /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </div>
    <Footer />
  </>
}

export default function App() {
  return <>
    <Navigation />
    <div className="smooth-wrapper">
      <div className="smooth-content">
        <main id="main-content" className="app-content" tabIndex={-1}><RouteView /></main>
      </div>
    </div>
  </>
}
