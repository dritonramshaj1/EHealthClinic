import React, { useEffect, useState } from 'react'
import { api } from '../api/axios.js'
import { useAuth } from '../state/AuthContext.jsx'
import Layout from '../components/Layout.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Spinner from '../components/Spinner.jsx'

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [notifications, setNotifications] = useState([])
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Create appointment form
  const [doctorId, setDoctorId] = useState('')
  const [patientId, setPatientId] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [reason, setReason] = useState('')
  const [creatingAppt, setCreatingAppt] = useState(false)

  // Add medical record
  const [mrPatientId, setMrPatientId] = useState('')
  const [mrTitle, setMrTitle] = useState('')
  const [mrDiagnosis, setMrDiagnosis] = useState('')
  const [mrDescription, setMrDescription] = useState('')
  const [addingMr, setAddingMr] = useState(false)

  async function load() {
    setError(null)
    try {
      const [a, n, d, p] = await Promise.all([
        api.get('/appointments'),
        api.get('/notifications'),
        api.get('/directory/doctors'),
        api.get('/directory/patients'),
      ])
      setAppointments(a.data)
      setNotifications(n.data)
      setDoctors(d.data)
      setPatients(p.data)
      if (!doctorId && d.data?.[0]) setDoctorId(d.data[0].id)
      if (!patientId && p.data?.[0]) { setPatientId(p.data[0].id); setMrPatientId(p.data[0].id) }
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

  async function createAppointment(e) {
    e.preventDefault()
    setError(null)
    setCreatingAppt(true)
    try {
      await api.post('/appointments', {
        doctorId,
        patientId,
        startsAtUtc: new Date(startsAt).toISOString(),
        endsAtUtc: new Date(endsAt).toISOString(),
        reason,
      })
      setSuccess('Appointment created successfully!')
      setReason('')
      setStartsAt('')
      setEndsAt('')
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to create appointment')
    } finally {
      setCreatingAppt(false)
    }
  }

  async function addMedicalEntry(e) {
    e.preventDefault()
    setError(null)
    setAddingMr(true)
    try {
      await api.post(`/medical-records/${mrPatientId}/entries`, {
        title: mrTitle,
        diagnosis: mrDiagnosis,
        description: mrDescription,
        tags: [],
      })
      setSuccess('Medical entry added successfully!')
      setMrTitle('')
      setMrDiagnosis('')
      setMrDescription('')
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to add medical entry')
    } finally {
      setAddingMr(false)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length
  const scheduledCount = appointments.filter(a => a.status === 'Scheduled').length

  if (loading) return <Layout><Spinner /></Layout>

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2>Doctor Dashboard</h2>
          <p>Welcome, Dr. {user?.fullName}</p>
        </div>
        <button className="secondary" onClick={load}>↻ Refresh</button>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}
      {success && <div className="alert alert-success mb-4">{success}</div>}

      {/* Stats */}
      <div className="row-3 mb-4">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{scheduledCount}</div>
          <div className="stat-label">Scheduled</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🧑‍⚕️</div>
          <div className="stat-value">{patients.length}</div>
          <div className="stat-label">Total Patients</div>
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
                <div className="text-sm text-muted">Patient: {a.patient?.name}</div>
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

      {/* Create Appointment + Add Medical Record */}
      <div className="row section">
        <div className="card">
          <div className="card-title">➕ Create Appointment</div>
          <form className="form-stack" onSubmit={createAppointment}>
            <div className="form-group">
              <label>Doctor</label>
              <select value={doctorId} onChange={e => setDoctorId(e.target.value)}>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Patient</label>
              <select value={patientId} onChange={e => setPatientId(e.target.value)}>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Start time</label>
              <input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>End time</label>
              <input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Reason</label>
              <input placeholder="Reason for visit..." value={reason} onChange={e => setReason(e.target.value)} />
            </div>
            <button disabled={creatingAppt} style={{ width: '100%' }}>
              {creatingAppt ? 'Creating...' : 'Create Appointment'}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-title">🩺 Add Medical Record Entry</div>
          <form className="form-stack" onSubmit={addMedicalEntry}>
            <div className="form-group">
              <label>Patient</label>
              <select value={mrPatientId} onChange={e => setMrPatientId(e.target.value)}>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Title</label>
              <input
                placeholder="Visit summary, test results..."
                value={mrTitle}
                onChange={e => setMrTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Diagnosis</label>
              <input
                placeholder="Primary diagnosis"
                value={mrDiagnosis}
                onChange={e => setMrDiagnosis(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                rows="3"
                placeholder="Additional notes..."
                value={mrDescription}
                onChange={e => setMrDescription(e.target.value)}
              />
            </div>
            <button disabled={addingMr} style={{ width: '100%' }}>
              {addingMr ? 'Adding...' : 'Add Entry'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
