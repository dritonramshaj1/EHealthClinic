import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'

export default function ProtectedRoute({ children, roles }) {
  const { isLoggedIn, roles: myRoles } = useAuth()

  if (!isLoggedIn) return <Navigate to="/login" replace />

  if (roles && roles.length > 0) {
    const ok = roles.some(r => myRoles.includes(r))
    if (!ok) return <Navigate to="/forbidden" replace />
  }

  return children
}
