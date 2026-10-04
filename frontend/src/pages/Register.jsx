import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { getApiErrorMessage } from '../api/api.js'

export default function Register() {
  const { signUp, status } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated') return <Navigate to="/" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    if (!/^[A-Za-z0-9._-]{3,32}$/.test(username.trim())) {
      setError('Use 3–32 letters, numbers, dots, underscores, or hyphens for your username.')
      return
    }
    const passwordBytes = new TextEncoder().encode(password).length
    if (password.length < 8 || passwordBytes > 72) {
      setError('Use at least 8 characters and no more than 72 UTF-8 bytes.')
      return
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await signUp({ username: username.trim(), password })
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to create your account. Please try again.'))
      setSubmitting(false)
    }
  }

  return (
    <section className="login-layout">
      <div className="login-intro">
        <span className="login-mark" aria-hidden="true">C</span>
        <p className="eyebrow">JOIN CRAVEDASH</p>
        <h1>Your next meal, made easy.</h1>
        <p>Create a customer account to place orders and follow every step through delivery.</p>
        <div className="login-memorydb"><span className="status-dot" /> Your order history stays ready in the data store</div>
      </div>
      <div className="login-card">
        <p className="eyebrow">CUSTOMER ACCOUNT</p>
        <h2>Create account</h2>
        <p className="login-subtitle">Choose a username and a secure password.</p>
        {error && <div className="inline-alert error-alert" role="alert">{error}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <label className="form-field">
            <span>Username</span>
            <input
              autoComplete="username"
              autoFocus
              maxLength={32}
              onChange={(event) => { setUsername(event.target.value); setError('') }}
              placeholder="3–32 characters"
              value={username}
            />
          </label>
          <label className="form-field">
            <span>Password</span>
            <input
              autoComplete="new-password"
              maxLength={72}
              minLength={8}
              onChange={(event) => { setPassword(event.target.value); setError('') }}
              placeholder="At least 8 characters"
              type="password"
              value={password}
            />
          </label>
          <label className="form-field">
            <span>Confirm password</span>
            <input
              autoComplete="new-password"
              maxLength={72}
              onChange={(event) => { setConfirmPassword(event.target.value); setError('') }}
              placeholder="Re-enter your password"
              type="password"
              value={confirmPassword}
            />
          </label>
          <button className="button button-primary login-submit" disabled={submitting} type="submit">
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="login-footnote">Already have an account? <Link className="inline-link" to="/login">Sign in</Link>.</p>
      </div>
    </section>
  )
}
