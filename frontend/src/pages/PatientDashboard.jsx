import React, { useEffect, useState } from 'react'
import { api } from '../api/axios.js'
import { useAuth } from '../state/AuthContext.jsx'
import Layout from '../components/Layout.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Spinner from '../components/Spinner.jsx'

export default function PatientDashboard() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [notifications, setNotifications] = useState([])
  const [medicalRecord, setMedicalRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    setError(null)
    try {
      const [a, n, mr] = await Promise.all([
        api.get('/appointments'),
        api.get('/notifications'),
        api.get('/medical-records/me'),
      ])
      setAppointments(a.data)
      setNotifications(n.data)
      setMedicalRecord(mr.data)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (user) load() }, [user])

  async function markRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch { /* silent */ }
  }

  async function markAllRead() {
    try {
      await api.patch('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch { /* silent */ }
  }

  const unreadCount = notifications.filter(n => !n.read).length
  const upcomingCount = appointments.filter(a => a.status === 'Scheduled').length
  const entriesCount = medicalRecord?.entries?.length || 0

  if (loading) return <Layout><Spinner /></Layout>

  return (
    <Layout>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2>My Dashboard</h2>
          <p>Welcome back, {user?.fullName}</p>
        </div>
        <button className="secondary" onClick={load}>↻ Refresh</button>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      {/* Stats */}
      <div className="row-3 mb-4">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{upcomingCount}</div>
          <div className="stat-label">Upcoming Appointments</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏥</div>
          <div className="stat-value">{entriesCount}</div>
          <div className="stat-label">Medical Entries</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔔</div>
          <div className="stat-value">{unreadCount}</div>
          <div className="stat-label">Unread Notifications</div>
        </div>
      </div>

      {/* Appointments + Notifications */}
      <div className="row">
        <div className="card">
          <div className="card-title">
            📅 My Appointments
            <span className="badge">{appointments.length}</span>
          </div>
          <div className="list">
            {appointments.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                No appointments yet
              </div>
            )}
            {appointments.map(a => (
              <div key={a.id} className="item">
                <div className="flex-between mb-1">
                  <span className="font-semibold text-sm">
                    {new Date(a.startsAtUtc).toLocaleString()}
                  </span>
                  <StatusBadge status={a.status} />
                </div>
                <div className="text-sm text-muted">Dr. {a.doctor?.name} — {a.doctor?.specialty}</div>
                {a.reason && <div className="text-xs text-muted mt-1">Reason: {a.reason}</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            🔔 Notifications
            <div className="flex-center gap-2">
              {unreadCount > 0 && (
                <button className="btn-ghost btn-sm" onClick={markAllRead}>Mark all read</button>
              )}
              <span className="badge">{unreadCount} new</span>
            </div>
          </div>
          <div className="list">
            {notifications.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">🔕</div>
                No notifications
              </div>
            )}
            {notifications.map(n => (
              <div key={n.id} className={`item ${!n.read ? 'item-unread' : ''}`}>
                <div className="flex-between mb-1">
                  <span className={`badge ${n.read ? '' : 'badge-primary'}`}>{n.type}</span>
                  {!n.read && (
                    <button className="btn-ghost btn-sm" onClick={() => markRead(n.id)}>
                      Mark read
                    </button>
                  )}
                </div>
                <div className="text-sm mt-1">{n.message}</div>
                <div className="text-xs text-muted mt-1">{new Date(n.createdAtUtc).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Medical Record */}
      <div className="card section">
        <div className="card-title">
          🩺 My Medical Record
          <span className="badge badge-info">MongoDB</span>
        </div>
        <div className="list">
          {(medicalRecord?.entries || []).length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              No medical entries yet
            </div>
          )}
          {(medicalRecord?.entries || []).slice().reverse().map((e, idx) => (
            <div key={idx} className="item">
              <div className="flex-between mb-1">
                <span className="font-semibold text-sm">{e.title}</span>
                <span className="badge">{new Date(e.dateUtc).toLocaleDateString()}</span>
              </div>
              {e.diagnosis && <div className="text-sm text-muted">Diagnosis: {e.diagnosis}</div>}
              {e.description && <div className="text-sm mt-1">{e.description}</div>}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
