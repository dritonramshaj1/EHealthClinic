import { Navigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'

/**
 * Renders children only if user has the required permission; otherwise redirects to /forbidden.
 */
export default function PermissionRoute({ permission, children }) {
  const { isLoggedIn, hasPermission } = useAuth()

  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (permission && !hasPermission(permission)) return <Navigate to="/forbidden" replace />

  return children
}
