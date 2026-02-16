import React from 'react'
import { useAuth } from '../state/AuthContext.jsx'

export default function Layout({ children }) {
  const { user, roles, logout } = useAuth()

  return (
    <div>
      <nav className="top-nav">
        <div className="nav-logo">
          🏥 <span>EHealth Clinic</span>
        </div>
        <div className="nav-user">
          <span className="badge badge-primary">{(roles || []).join(', ')}</span>
          <span className="text-sm text-muted" style={{ fontWeight: 500 }}>{user?.fullName}</span>
          <button className="btn-ghost btn-sm" onClick={logout}>Logout</button>
        </div>
      </nav>
      <main className="container">
        {children}
      </main>
    </div>
  )
}
