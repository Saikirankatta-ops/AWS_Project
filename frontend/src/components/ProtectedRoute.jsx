import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { ErrorMessage, Loading } from './Feedback.jsx'

export default function ProtectedRoute({ allowedRoles }) {
  const { status, user, checkSession } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <Loading />
  if (status === 'error') {
    return <ErrorMessage onRetry={checkSession}>Unable to verify your login session.</ErrorMessage>
  }
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/orders" replace />
  }
  return <Outlet />
}
