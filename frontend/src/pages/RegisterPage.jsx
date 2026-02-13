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
    <div className="container">
      <div className="card">
        <div className="nav">
          <h2>Register</h2>
          <span className="badge">{role}</span>
        </div>

        <form onSubmit={onSubmit} className="list">
          <div>
            <label className="small">Full name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="small">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="small">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="small">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="Patient">Patient</option>
              <option value="Doctor">Doctor</option>
              <option value="Admin">Admin</option>
            </select>
            <div className="small">Në projekt real, krijimi i Admin zakonisht lejohet vetëm nga Admin.</div>
          </div>

          {error && <div className="item" style={{ borderColor: '#f2b8b5' }}>{error}</div>}

          <button disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>

          <div className="small">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
