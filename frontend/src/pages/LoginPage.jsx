import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'
import { useLang } from '../state/LanguageContext.jsx'

export default function LoginPage() {
  const { login } = useAuth()
  const { t } = useLang()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <img src="/logo.png" alt="EHealthClinic" />
          </div>
          <h1>EHealth Clinic</h1>
          <p>{t('auth.signInToAccount')}</p>
        </div>

        <form onSubmit={onSubmit} className="form-stack">
          <div className="form-group">
            <label className="form-label">{t('auth.email')}</label>
            <input
              type="email"
              className="form-control"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('auth.password')}</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? t('auth.signingIn') : t('auth.signIn')}
          </button>

          <p className="text-sm text-muted" style={{ textAlign: 'center', marginTop: 8 }}>
            {t('auth.noAccount')} <Link to="/register">{t('auth.register')}</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
