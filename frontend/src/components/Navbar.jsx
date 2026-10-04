import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState('')

  async function handleLogout() {
    setLogoutError('')
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch {
      setLogoutError('Unable to log out. Check the backend connection and try again.')
    }
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <NavLink className="brand" to="/" aria-label="CraveDash dashboard">
          <span className="brand-mark" aria-hidden="true">C</span>
          <span>Crave<span className="brand-accent">Dash</span></span>
        </NavLink>
        {user && (
          <nav className="main-nav" aria-label="Main navigation">
            <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Dashboard
            </NavLink>
            <NavLink to="/orders" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Orders
            </NavLink>
          </nav>
        )}
        <div className="memorydb-label">
          Redis store
        </div>
        {user && (
          <div className="account-actions">
            <span className="account-name">{user.username}</span>
            <span className={`role-badge role-${user.role?.toLowerCase()}`}>{user.role === 'OWNER' ? 'Owner' : 'Customer'}</span>
            <button className="button button-outline button-small" onClick={handleLogout} type="button">Log out</button>
          </div>
        )}
      </div>
      {logoutError && <div className="logout-error" role="alert">{logoutError}</div>}
    </header>
  )
}
