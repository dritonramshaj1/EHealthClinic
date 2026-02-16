import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'

export default function RegisterPage() {
  const { register } = useAuth()
  const nav = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('User1234!')
  const [role, setRole] = useState('Patient')

  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register(fullName, email, password, role)
      nav('/dashboard')
    } catch (e) {
      setError(e?.response?.data?.error || 'Register failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🏥</div>
          <h1>Create account</h1>
          <p>Join EHealth Clinic as <span className="badge badge-primary">{role}</span></p>
        </div>

        <form onSubmit={onSubmit} className="form-stack">
          <div className="form-group">
            <label>Full name</label>
            <input
              placeholder="John Doe"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label>Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label>Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="Patient">🧑‍⚕️ Patient</option>
              <option value="Doctor">👨‍⚕️ Doctor</option>
              <option value="Admin">🛡️ Admin</option>
            </select>
            <p className="text-xs text-muted" style={{ marginTop: 4 }}>In production, Admin creation is restricted.</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button disabled={loading} style={{ width: '100%', marginTop: 4 }}>
            {loading ? 'Creating account...' : 'Create account →'}
          </button>

          <p className="text-sm text-muted" style={{ textAlign: 'center', marginTop: 8 }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
