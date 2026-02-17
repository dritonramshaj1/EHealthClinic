import React, { useEffect, useState } from 'react'
import { api } from '../api/axios.js'
import { useAuth } from '../state/AuthContext.jsx'
import Layout from '../components/Layout.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Spinner from '../components/Spinner.jsx'
import AnalyticsCharts from '../components/AnalyticsCharts.jsx'
import NotificationPanel from '../components/NotificationPanel.jsx'
import UserFormModal from '../components/UserFormModal.jsx'

export default function AdminDashboard() {
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

  // Payments
  const [payments, setPayments] = useState([])
  const [payApptId, setPayApptId] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [creatingPayment, setCreatingPayment] = useState(false)

  // Search filters
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSearch, setFilterSearch] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  // User Management
  const [users, setUsers] = useState([])
  const [userRoleFilter, setUserRoleFilter] = useState('All')
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showEditUser, setShowEditUser] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userDetail, setUserDetail] = useState(null)
  const [specialties, setSpecialties] = useState([])

  async function load() {
    setError(null)
    try {
      const [a, n, d, p, pay, usr, specs] = await Promise.all([
        api.get('/appointments'),
        api.get('/notifications'),
        api.get('/directory/doctors'),
        api.get('/directory/patients'),
        api.get('/payments'),
        api.get('/users'),
        api.get('/specialties'),
      ])
      setAppointments(a.data)
      setNotifications(n.data)
      setDoctors(d.data)
      setPatients(p.data)
      setPayments(pay.data)
      setUsers(usr.data)
      setSpecialties(specs.data)
      if (!doctorId && d.data?.[0]) setDoctorId(d.data[0].id)
      if (!patientId && p.data?.[0]) { setPatientId(p.data[0].id); setMrPatientId(p.data[0].id) }
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (user) load() }, [user])

  async function loadUsers(roleFilter) {
    try {
      const params = (roleFilter || userRoleFilter) !== 'All' ? { role: roleFilter || userRoleFilter } : {}
      const res = await api.get('/users', { params })
      setUsers(res.data)
    } catch { /* silent */ }
  }

  useEffect(() => { loadUsers(userRoleFilter) }, [userRoleFilter])

  async function searchAppointments(e) {
    e.preventDefault()
    setError(null)
    try {
      const params = {}
      if (filterStatus) params.status = filterStatus
      if (filterSearch) params.search = filterSearch
      if (filterFrom) params.fromUtc = new Date(filterFrom).toISOString()
      if (filterTo) params.toUtc = new Date(filterTo).toISOString()
      const res = await api.get('/appointments', { params })
      setAppointments(res.data)
    } catch (e) {
      setError(e?.response?.data?.error || 'Search failed')
    }
  }

  async function clearFilters() {
    setFilterStatus('')
    setFilterSearch('')
    setFilterFrom('')
    setFilterTo('')
    await load()
  }

  async function exportData(endpoint, filename, format = 'csv') {
    try {
      const params = { format }
      if (filterStatus) params.status = filterStatus
      const res = await api.get(endpoint, { params, responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch { setError('Export failed') }
  }

  async function createAppointment(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
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
    setSuccess(null)
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

  async function createPayment(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setCreatingPayment(true)
    try {
      await api.post('/payments', {
        appointmentId: payApptId,
        amount: parseFloat(payAmount),
      })
      setSuccess('Payment created successfully!')
      setPayAmount('')
      const res = await api.get('/payments')
      setPayments(res.data)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to create payment')
    } finally {
      setCreatingPayment(false)
    }
  }

  async function updatePaymentStatus(id, status) {
    try {
      await api.patch(`/payments/${id}/status`, { status })
      setPayments(prev => prev.map(p => p.id === id ? { ...p, status } : p))
      setSuccess(`Payment marked as ${status}`)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to update payment')
    }
  }

  async function createUser(formData) {
    await api.post('/users', formData)
    setShowCreateUser(false)
    await loadUsers()
    await load()
    setSuccess('User created successfully!')
  }

  async function updateUser(id, formData) {
    await api.put(`/users/${id}`, formData)
    setShowEditUser(false)
    setEditingUser(null)
    setUserDetail(null)
    await loadUsers()
    setSuccess('User updated successfully!')
  }

  async function disableUser(id) {
    if (!confirm('Disable this user? They will be locked out.')) return
    try {
      await api.delete(`/users/${id}`)
      await loadUsers()
      setSuccess('User disabled.')
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to disable user')
    }
  }

  async function openEditUser(u) {
    try {
      const res = await api.get(`/users/${u.id}`)
      setUserDetail(res.data)
      setEditingUser(u)
      setShowEditUser(true)
    } catch (e) {
      setError('Failed to load user details')
    }
  }

  const scheduledCount = appointments.filter(a => a.status === 'Scheduled').length
  const completedCount = appointments.filter(a => a.status === 'Completed').length

  if (loading) return <Layout><Spinner /></Layout>

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2>Admin Dashboard</h2>
          <p>System overview — {user?.fullName}</p>
        </div>
        <button className="secondary" onClick={load}>Refresh</button>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}
      {success && <div className="alert alert-success mb-4">{success}</div>}

      {/* Stats */}
      <div className="row-3 mb-4">
        <div className="stat-card">
          <div className="stat-value">{doctors.length}</div>
          <div className="stat-label">Doctors</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{patients.length}</div>
          <div className="stat-label">Patients</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{scheduledCount}</div>
          <div className="stat-label">Scheduled</div>
        </div>
      </div>

      {/* Analytics Charts */}
      <AnalyticsCharts isAdmin={true} />

      {/* User Management */}
      <div className="card section">
        <div className="card-title">
          User Management
          <div className="flex-center gap-2">
            <span className="badge">{users.length} users</span>
            <button className="btn-sm" onClick={() => setShowCreateUser(true)}>+ Create User</button>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          {['All', 'Admin', 'Doctor', 'Patient'].map(r => (
            <button
              key={r}
              className={userRoleFilter === r ? 'btn-sm' : 'btn-ghost btn-sm'}
              onClick={() => setUserRoleFilter(r)}
            >{r}</button>
          ))}
        </div>

        <div className="list">
          {users.length === 0 && (
            <div className="empty-state">No users found</div>
          )}
          {users.map(u => (
            <div key={u.id} className={`item ${u.isDisabled ? 'item-read' : ''}`}>
              <div className="flex-between">
                <div>
                  <div className="font-semibold text-sm">{u.fullName}</div>
                  <div className="text-xs text-muted">{u.email}</div>
                </div>
                <div className="flex-center gap-2">
                  <span className="badge">{u.roles?.[0] || 'N/A'}</span>
                  {u.isDisabled && <span className="badge badge-danger">Disabled</span>}
                  <span className="text-xs text-muted">{new Date(u.createdAtUtc).toLocaleDateString()}</span>
                  <button className="btn-ghost btn-sm" onClick={() => openEditUser(u)}>Edit</button>
                  {!u.isDisabled && (
                    <button className="btn-ghost btn-sm" style={{ color: '#ef4444' }}
                      onClick={() => disableUser(u.id)}>Disable</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick exports */}
      <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
        <span className="text-sm text-muted" style={{ alignSelf: 'center' }}>Export:</span>
        <button className="btn-ghost btn-sm" onClick={() => exportData('/export/patients', 'patients', 'xlsx')}>Patients Excel</button>
        <button className="btn-ghost btn-sm" onClick={() => exportData('/export/patients', 'patients', 'pdf')}>Patients PDF</button>
        <button className="btn-ghost btn-sm" onClick={() => exportData('/export/patients', 'patients', 'docx')}>Patients Word</button>
        <span style={{ borderLeft: '1px solid #e5e7eb', height: 20, margin: '0 4px' }} />
        <button className="btn-ghost btn-sm" onClick={() => exportData('/export/project-log', 'project_log', 'xlsx')}>Project Log Excel</button>
        <button className="btn-ghost btn-sm" onClick={() => exportData('/export/project-log', 'project_log', 'pdf')}>Project Log PDF</button>
        <button className="btn-ghost btn-sm" onClick={() => exportData('/export/project-log', 'project_log', 'docx')}>Project Log Word</button>
      </div>

      {/* Appointments + Notifications */}
      <div className="row">
        <div className="card">
          <div className="card-title">
            All Appointments
            <div className="flex-center gap-2">
              <span className="badge badge-warning">{scheduledCount} scheduled</span>
              <span className="badge badge-success">{completedCount} completed</span>
              <button className="btn-ghost btn-sm" onClick={() => exportData('/export/appointments', 'appointments', 'xlsx')}>Excel</button>
              <button className="btn-ghost btn-sm" onClick={() => exportData('/export/appointments', 'appointments', 'pdf')}>PDF</button>
              <button className="btn-ghost btn-sm" onClick={() => exportData('/export/appointments', 'appointments', 'docx')}>Word</button>
            </div>
          </div>
          <form className="flex gap-2 mb-3" onSubmit={searchAppointments} style={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ flex: '0 0 auto', minWidth: 120 }}>
              <option value="">All statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <input
              placeholder="Search name or reason..."
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              style={{ flex: 1, minWidth: 140 }}
            />
            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} style={{ flex: '0 0 auto' }} />
            <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} style={{ flex: '0 0 auto' }} />
            <button type="submit" style={{ flex: '0 0 auto' }}>Search</button>
            <button type="button" className="secondary" onClick={clearFilters} style={{ flex: '0 0 auto' }}>Clear</button>
          </form>
          <div className="list">
            {appointments.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">No appointments yet</div>
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
                <div className="text-sm text-muted">
                  Dr. {a.doctor?.name} → {a.patient?.name}
                </div>
                {a.reason && <div className="text-xs text-muted mt-1">Reason: {a.reason}</div>}
              </div>
            ))}
          </div>
        </div>

        <NotificationPanel notifications={notifications} onUpdate={setNotifications} />
      </div>

      {/* Create Appointment + Add Medical Record */}
      <div className="row section">
        <div className="card">
          <div className="card-title">Create Appointment</div>
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
          <div className="card-title">Add Medical Record Entry</div>
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

      {/* Payments */}
      <div className="row section">
        <div className="card">
          <div className="card-title">Create Payment</div>
          <form className="form-stack" onSubmit={createPayment}>
            <div className="form-group">
              <label>Appointment</label>
              <select value={payApptId} onChange={e => setPayApptId(e.target.value)} required>
                <option value="">Select appointment...</option>
                {appointments.map(a => (
                  <option key={a.id} value={a.id}>
                    {new Date(a.startsAtUtc).toLocaleDateString()} — Dr. {a.doctor?.name} → {a.patient?.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Amount (EUR)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="50.00"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                required
              />
            </div>
            <button disabled={creatingPayment} style={{ width: '100%' }}>
              {creatingPayment ? 'Creating...' : 'Create Payment'}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-title">
            All Payments
            <span className="badge">{payments.length}</span>
          </div>
          <div className="list">
            {payments.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">No payments yet</div>
              </div>
            )}
            {payments.map(p => (
              <div key={p.id} className="item">
                <div className="flex-between mb-1">
                  <span className="font-semibold text-sm">{p.amount.toFixed(2)} {p.currency}</span>
                  <StatusBadge status={p.status} />
                </div>
                <div className="text-sm text-muted">
                  Dr. {p.doctor} → {p.patient}
                </div>
                <div className="text-xs text-muted mt-1">
                  {new Date(p.appointmentDate).toLocaleDateString()} — {p.reason || 'No reason'}
                </div>
                {p.paymentMethod && (
                  <div className="text-xs text-muted mt-1">Method: {p.paymentMethod}</div>
                )}
                {p.status === 'Pending' && (
                  <div className="flex gap-2 mt-2">
                    <button className="btn-ghost btn-sm" onClick={() => updatePaymentStatus(p.id, 'Paid')} style={{ color: '#22c55e' }}>
                      Mark Paid
                    </button>
                    <button className="btn-ghost btn-sm" onClick={() => updatePaymentStatus(p.id, 'Failed')} style={{ color: '#ef4444' }}>
                      Mark Failed
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateUser && (
        <UserFormModal
          mode="create"
          specialties={specialties}
          onSubmit={createUser}
          onClose={() => setShowCreateUser(false)}
        />
      )}

      {/* Edit User Modal */}
      {showEditUser && userDetail && (
        <UserFormModal
          mode="edit"
          initialData={userDetail}
          specialties={specialties}
          onSubmit={(data) => updateUser(editingUser.id, data)}
          onClose={() => { setShowEditUser(false); setEditingUser(null); setUserDetail(null) }}
        />
      )}
    </Layout>
  )
}
