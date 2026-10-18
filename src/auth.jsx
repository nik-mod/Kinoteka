import { useMemo, useState } from 'react'
import { api, extractToken } from './api.js'
import { AuthContext } from './auth-context.js'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '')

  async function authenticate(method, fields) {
    const payload = await api[method](fields)
    let nextToken = extractToken(payload)
    if (!nextToken && method === 'register') {
      nextToken = extractToken(await api.login({ email: fields.email, password: fields.password }))
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

