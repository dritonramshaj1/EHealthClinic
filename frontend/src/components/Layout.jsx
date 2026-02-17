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
          <a href="/profile" className="btn-ghost btn-sm" style={{ textDecoration: 'none' }}>👤 {user?.fullName}</a>
          <button className="btn-ghost btn-sm" onClick={logout}>Logout</button>
        </div>
      </nav>
      <main className="container">
        {children}
      </main>
    </div>
  )
}
