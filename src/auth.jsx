import { useEffect, useMemo, useState } from 'react'
import { api, extractToken } from './api.js'
import { AuthContext } from './auth-context.js'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem('token') || '' } catch { return '' }
  })

  useEffect(() => {
    function clearExpiredToken() {
      setToken('')
    }
    window.addEventListener('kinoteka:auth-expired', clearExpiredToken)
    function syncToken(event) {
      if (event.key === 'token' || event.key === null) setToken(event.key === null ? '' : event.newValue || '')
    }
    window.addEventListener('storage', syncToken)
    return () => {
      window.removeEventListener('kinoteka:auth-expired', clearExpiredToken)
      window.removeEventListener('storage', syncToken)
    }
  }, [])

  async function authenticate(method, fields) {
    const payload = await api[method](fields)
    let nextToken = extractToken(payload)
    if (!nextToken && method === 'register') {
      try {
        nextToken = extractToken(await api.login({ email: fields.email, password: fields.password }))
      } catch (error) {
        throw new Error(`ანგარიში შეიქმნა, მაგრამ ავტომატური შესვლა ვერ მოხერხდა. სცადე შესვლის გვერდიდან: ${error.message}`, { cause: error })
      }
    }
    if (!nextToken) throw new Error('სერვერმა ავტორიზაციის კოდი არ დააბრუნა.')
    localStorage.setItem('token', nextToken)
    setToken(nextToken)
    return payload
  }

  function logout() {
    localStorage.removeItem('token')
    setToken('')
  }

  const value = useMemo(() => ({
    token,
    isAuthenticated: Boolean(token),
    login: (fields) => authenticate('login', fields),
    register: (fields) => authenticate('register', fields),
    logout,
  }), [token])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

