import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, extractList } from '../api.js'
import AsyncState from '../components/AsyncState.jsx'
import MovieCard from '../components/MovieCard.jsx'

function unwrapFavorites(payload) {
  return extractList(payload).map((item) => item?.movie || item).filter((movie) => movie && (movie.id || movie.movie_id))
}

export default function Favorites() {
  const [movies, setMovies] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  async function loadFavorites() {
    setStatus('loading')
    try {
      setMovies(unwrapFavorites(await api.favorites()))
      setStatus('success')
    } catch (loadError) {
      setError(loadError.message)
      setStatus('error')
    }
  }

  useEffect(() => {
    let active = true
    api.favorites().then((payload) => {
      if (!active) return
      setMovies(unwrapFavorites(payload))
      setStatus('success')
    }).catch((loadError) => {
      if (!active) return
      setError(loadError.message)
      setStatus('error')
    })
    return () => { active = false }
  }, [])

  return <div className="page inner-page">
    <header className="page-header"><span className="page-index">02</span><h1>ფავორიტები</h1><p>ფილმები, რომელთა დაბრუნებაც ღირს.</p></header>
    {status === 'loading' && <AsyncState type="loading" title="ფავორიტები იტვირთება" />}
    {status === 'error' && <AsyncState type="error" title="ფავორიტები ვერ ჩაიტვირთა" message={error} onRetry={loadFavorites} />}
    {status === 'success' && !movies.length && <section className="empty-feature"><span>ჯერ ცარიელია</span><h2>შენი კინოთეკა აქ იწყება.</h2><p>კატალოგში გულის ღილაკით მონიშნე ფილმი და ის ამ გვერდზე გამოჩნდება.</p><Link className="button" to="/">კატალოგის ნახვა</Link></section>}
    {status === 'success' && movies.length > 0 && <section className="movie-grid">{movies.map((movie) => <MovieCard key={movie.id || movie.movie_id} movie={{ ...movie, id: movie.id || movie.movie_id }} isFavorite canFavorite />)}</section>}
  </div>
}
