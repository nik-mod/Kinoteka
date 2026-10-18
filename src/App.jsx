import { useLayoutEffect, useRef } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { useAuth } from './useAuth.js'
import Navigation from './components/Navigation.jsx'
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

function RouteView() {
  const location = useLocation()
  const viewRef = useRef(null)

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(viewRef.current, { opacity: 0 }, { opacity: 1, duration: 0.28, ease: 'power2.out' })
    })
    return () => mm.revert()
  }, [location.pathname])

  return (
    <div className="route-view" ref={viewRef} key={location.pathname}>
      <Routes location={location}>
        <Route path="/" element={<MovieList />} />
        <Route path="/movies/:id" element={<MovieDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        <Route path="/add-movie" element={<ProtectedRoute><AddMovie /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <div className="app-shell">
      <Navigation />
      <main className="app-content"><RouteView /></main>
    </div>
  )
}
