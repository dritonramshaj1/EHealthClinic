import React from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../state/LanguageContext.jsx'

export default function Forbidden() {
  const { t } = useLang()
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{t('pages.forbidden.title')}</h1>
        <p className="text-muted" style={{ marginBottom: 24 }}>
          {t('pages.forbidden.message')}
        </p>
        <Link to="/dashboard">
          <button style={{ width: '100%' }}>{t('pages.forbidden.backToDashboard')}</button>
        </Link>
      </div>
    </div>
  )
}
