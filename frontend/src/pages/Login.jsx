import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { getApiErrorMessage } from '../api/api.js'

export default function Login() {
  const { signIn, status } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated') {
    return <Navigate to={location.state?.from?.pathname ?? '/'} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!username.trim() || !password) {
      setError('Enter your username and password.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await signIn({ username: username.trim(), password })
      const destination = location.state?.from?.pathname ?? '/'
      navigate(destination, { replace: true })
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to connect to backend.'))
      setSubmitting(false)
    }
  }

  return (
    <section className="login-layout">
      <div className="login-intro">
        <span className="login-mark" aria-hidden="true">C</span>
        <p className="eyebrow">CRAVEDASH ORDER OPERATIONS</p>
        <h1>Welcome back.</h1>
        <p>Sign in to keep every order moving, from the kitchen to the customer.</p>
        <div className="login-memorydb"><span className="status-dot" /> Fast order data with Redis-compatible storage</div>
      </div>
      <div className="login-card">
        <p className="eyebrow">YOUR WORKSPACE</p>
        <h2>Sign in</h2>
        <p className="login-subtitle">Enter your account credentials to continue.</p>
        {error && <div className="inline-alert error-alert" role="alert">{error}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <label className="form-field">
            <span>Username</span>
            <input
              autoComplete="username"
              autoFocus
              onChange={(event) => { setUsername(event.target.value); setError('') }}
              placeholder="Your username"
              value={username}
            />
          </label>
          <label className="form-field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              onChange={(event) => { setPassword(event.target.value); setError('') }}
              placeholder="Your password"
              type="password"
              value={password}
            />
          </label>
          <button className="button button-primary login-submit" disabled={submitting} type="submit">
            {submitting ? 'Signing in...' : 'Sign in'}
            {!submitting && <span aria-hidden="true">→</span>}
          </button>
        </form>
        <p className="login-footnote">
          New to CraveDash? <Link className="inline-link" to="/register">Create a customer account</Link>.
          Owner accounts are configured by the administrator.
        </p>
      </div>
    </section>
  )
}
