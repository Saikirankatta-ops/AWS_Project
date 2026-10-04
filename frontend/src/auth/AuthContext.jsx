import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  getCurrentUser,
  login as requestLogin,
  logout as requestLogout,
  register as requestRegister,
} from '../api/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')

  const checkSession = useCallback(async () => {
    setStatus('loading')
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setStatus('authenticated')
    } catch (error) {
      setUser(null)
      setStatus(error.response?.status === 401 ? 'unauthenticated' : 'error')
    }
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  useEffect(() => {
    function clearExpiredSession() {
      setUser(null)
      setStatus('unauthenticated')
    }
    window.addEventListener('cravedash:unauthorized', clearExpiredSession)
    return () => window.removeEventListener('cravedash:unauthorized', clearExpiredSession)
  }, [])

  const signIn = useCallback(async (credentials) => {
    const result = await requestLogin(credentials)
    setUser({ username: result.username, role: result.role })
    setStatus('authenticated')
    return result
  }, [])

  const signUp = useCallback(async (credentials) => {
    const result = await requestRegister(credentials)
    setUser({ username: result.username, role: result.role })
    setStatus('authenticated')
    return result
  }, [])

  const signOut = useCallback(async () => {
    await requestLogout()
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  const value = useMemo(
    () => ({ user, status, signIn, signUp, signOut, checkSession }),
    [user, status, signIn, signUp, signOut, checkSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
