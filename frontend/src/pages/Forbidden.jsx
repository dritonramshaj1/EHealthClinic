import React from 'react'
import { Link } from 'react-router-dom'

export default function Forbidden() {
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Access Denied</h1>
        <p className="text-muted" style={{ marginBottom: 24 }}>
          You don't have permission to view this page.
        </p>
        <Link to="/dashboard">
          <button style={{ width: '100%' }}>← Back to Dashboard</button>
        </Link>
      </div>
    </div>
  )
}
