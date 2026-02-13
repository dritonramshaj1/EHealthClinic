import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'

export default function LoginPage() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('admin@ehealth.local')
  const [password, setPassword] = useState('Admin1234!')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      nav('/dashboard')
    } catch (e) {
      setError(e?.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="card">
        <div className="nav">
          <h2>Login</h2>
          <span className="badge">E-Health Clinic</span>
        </div>

        <form onSubmit={onSubmit} className="list">
          <div>
            <label className="small">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="small">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          {error && <div className="item" style={{ borderColor: '#f2b8b5' }}>{error}</div>}

          <button disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>

          <div className="small">
            No account? <Link to="/register">Register</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
