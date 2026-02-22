import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'
import { useLang } from '../state/LanguageContext.jsx'

export default function RegisterPage() {
  const { register } = useAuth()
  const { t } = useLang()
  const nav = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register(fullName, email, password, 'Patient')
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
          <div className="auth-logo-icon">
            <img src="/logo.png" alt="EHealthClinic" />
          </div>
          <h1>{t('auth.createAccount')}</h1>
          <p>{t('auth.registerAsPatient')}</p>
        </div>

        <form onSubmit={onSubmit} className="form-stack">
          <div className="form-group">
            <label className="form-label">{t('auth.fullName')}</label>
            <input
              type="text"
              className="form-control"
              placeholder="John Doe"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

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
              placeholder="Min. 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
          </button>

          <p className="text-sm text-muted" style={{ textAlign: 'center', marginTop: 8 }}>
            {t('auth.haveAccount')} <Link to="/login">{t('auth.signIn')}</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
