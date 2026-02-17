import React, { useEffect, useState } from 'react'
import { api } from '../api/axios.js'
import { useAuth } from '../state/AuthContext.jsx'
import Layout from '../components/Layout.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Spinner from '../components/Spinner.jsx'
import NotificationPanel from '../components/NotificationPanel.jsx'
import PaymentModal from '../components/PaymentModal.jsx'

export default function PatientDashboard() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [notifications, setNotifications] = useState([])
  const [medicalRecord, setMedicalRecord] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  async function load() {
    setError(null)
    try {
      const [a, n, mr, pay] = await Promise.all([
        api.get('/appointments'),
        api.get('/notifications'),
        api.get('/medical-records/me'),
        api.get('/payments'),
      ])
      setAppointments(a.data)
      setNotifications(n.data)
      setMedicalRecord(mr.data)
      setPayments(pay.data)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (user) load() }, [user])

  async function exportAppointments(format = 'csv') {
    try {
      const res = await api.get('/export/appointments', { params: { format }, responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `my-appointments.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch { /* silent */ }
  }

  const [paymentModalData, setPaymentModalData] = useState(null)
  const upcomingCount = appointments.filter(a => a.status === 'Scheduled').length
  const entriesCount = medicalRecord?.entries?.length || 0
  const pendingPayments = payments.filter(p => p.status === 'Pending').length

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
      {success && <div className="alert alert-success mb-4">{success}</div>}

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
          <div className="stat-icon">💳</div>
          <div className="stat-value">{pendingPayments}</div>
          <div className="stat-label">Pending Payments</div>
        </div>
      </div>

      {/* Appointments + Notifications */}
      <div className="row">
        <div className="card">
          <div className="card-title">
            📅 My Appointments
            <div className="flex-center gap-2">
              <span className="badge">{appointments.length}</span>
              <button className="btn-ghost btn-sm" onClick={() => exportAppointments('xlsx')}>📊 Excel</button>
              <button className="btn-ghost btn-sm" onClick={() => exportAppointments('pdf')}>📄 PDF</button>
              <button className="btn-ghost btn-sm" onClick={() => exportAppointments('docx')}>📝 Word</button>
            </div>
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

        <NotificationPanel notifications={notifications} onUpdate={setNotifications} />
      </div>

      {/* Payments + Medical Record */}
      <div className="row section">
        <div className="card">
          <div className="card-title">
            💳 My Payments
            <span className="badge">{payments.length}</span>
          </div>
          <div className="list">
            {payments.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">💸</div>
                No payments yet
              </div>
            )}
            {payments.map(p => (
              <div key={p.id} className="item">
                <div className="flex-between mb-1">
                  <span className="font-semibold text-sm">{p.amount.toFixed(2)} {p.currency}</span>
                  <StatusBadge status={p.status} />
                </div>
                <div className="text-sm text-muted">
                  Dr. {p.doctor} — {new Date(p.appointmentDate).toLocaleDateString()}
                </div>
                {p.reason && <div className="text-xs text-muted mt-1">{p.reason}</div>}
                {p.status === 'Pending' && (
                  <button
                    className="btn-ghost btn-sm mt-2"
                    onClick={() => setPaymentModalData(p)}
                    style={{ color: '#22c55e', fontWeight: 600 }}
                  >
                    Pay Now
                  </button>
                )}
                {p.status === 'Paid' && (
                  <div className="text-xs mt-1" style={{ color: '#22c55e' }}>Paid successfully</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
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
      </div>

      {paymentModalData && (
        <PaymentModal
          payment={paymentModalData}
          onClose={() => setPaymentModalData(null)}
          onSuccess={(updated) => {
            setPayments(prev => prev.map(p => p.id === updated.id ? { ...p, status: 'Paid' } : p))
            setPaymentModalData(null)
            setSuccess('Payment completed successfully!')
          }}
        />
      )}
    </Layout>
  )
}
