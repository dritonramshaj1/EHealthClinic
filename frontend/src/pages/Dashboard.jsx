import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api/axios.js'
import { useAuth } from '../state/AuthContext.jsx'

function hasRole(roles, r) { return roles?.includes(r) }

export default function Dashboard() {
  const { user, roles, logout } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [notifications, setNotifications] = useState([])
  const [medicalRecord, setMedicalRecord] = useState(null)
  const [error, setError] = useState(null)

  // create appointment form
  const canCreateAppointment = useMemo(() => hasRole(roles, 'Admin') || hasRole(roles, 'Doctor'), [roles])
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [doctorId, setDoctorId] = useState('')
  const [patientId, setPatientId] = useState('')
  const [startsAtUtc, setStartsAtUtc] = useState('')
  const [endsAtUtc, setEndsAtUtc] = useState('')
  const [reason, setReason] = useState('')

  // add medical entry
  const canWriteMedical = useMemo(() => hasRole(roles, 'Admin') || hasRole(roles, 'Doctor'), [roles])
  const [mrPatientId, setMrPatientId] = useState('')
  const [mrTitle, setMrTitle] = useState('')
  const [mrDiagnosis, setMrDiagnosis] = useState('')
  const [mrDescription, setMrDescription] = useState('')

  async function load() {
    setError(null)
    try {
      const [a, n] = await Promise.all([
        api.get('/appointments'),
        api.get('/notifications')
      ])
      setAppointments(a.data)
      setNotifications(n.data)

      if (hasRole(roles, 'Patient')) {
        const mr = await api.get('/medical-records/me')
        setMedicalRecord(mr.data)
      } else {
        setMedicalRecord(null)
      }

      if (canCreateAppointment) {
        const [d, p] = await Promise.all([
          api.get('/directory/doctors'),
          api.get('/directory/patients')
        ])
        setDoctors(d.data)
        setPatients(p.data)
        setDoctorId(d.data?.[0]?.id || '')
        setPatientId(p.data?.[0]?.id || '')
        setMrPatientId(p.data?.[0]?.id || '')
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load dashboard data')
    }
  }

  useEffect(() => { load() }, [])

  async function createAppointment(e) {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/appointments', {
        doctorId,
        patientId,
        startsAtUtc: new Date(startsAtUtc).toISOString(),
        endsAtUtc: new Date(endsAtUtc).toISOString(),
        reason
      })
      await load()
      setReason('')
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to create appointment')
    }
  }

  async function addMedicalEntry(e) {
    e.preventDefault()
    setError(null)
    try {
      await api.post(`/medical-records/${mrPatientId}/entries`, {
        title: mrTitle,
        diagnosis: mrDiagnosis,
        description: mrDescription,
        tags: []
      })
      setMrTitle('')
      setMrDiagnosis('')
      setMrDescription('')
      setError('Medical entry added.')
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to add medical entry')
    }
  }

  return (
    <div className="container">
      <div className="nav">
        <div>
          <h2 style={{ margin: 0 }}>Dashboard</h2>
          <div className="small">{user?.fullName} — {user?.email}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="badge">{(roles || []).join(', ')}</span>
          <button className="secondary" onClick={logout}>Logout</button>
        </div>
      </div>

      {error && <div className="card" style={{ marginBottom: 16, border: '1px solid #f2b8b5' }}>{error}</div>}

      <div className="row">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Appointments</h3>
          <div className="small">Shows appointments based on your role.</div>
          <div className="list">
            {appointments.length === 0 && <div className="item small">No appointments</div>}
            {appointments.map(a => (
              <div key={a.id} className="item">
                <div><b>{new Date(a.startsAtUtc).toLocaleString()}</b> — {a.status}</div>
                <div className="small">Doctor: {a.doctor?.name} | Patient: {a.patient?.name}</div>
                {a.reason && <div className="small">Reason: {a.reason}</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Notifications</h3>
          <div className="list">
            {notifications.length === 0 && <div className="item small">No notifications</div>}
            {notifications.map(n => (
              <div key={n.id} className="item">
                <div><b>{n.type}</b> {n.read ? <span className="badge">Read</span> : <span className="badge">New</span>}</div>
                <div className="small">{n.message}</div>
                <div className="small">{new Date(n.createdAtUtc).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {canCreateAppointment && (
        <div className="row" style={{ marginTop: 16 }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Create appointment</h3>
            <form className="list" onSubmit={createAppointment}>
              <div>
                <label className="small">Doctor</label>
                <select value={doctorId} onChange={e => setDoctorId(e.target.value)}>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>)}
                </select>
              </div>
              <div>
                <label className="small">Patient</label>
                <select value={patientId} onChange={e => setPatientId(e.target.value)}>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.email})</option>)}
                </select>
              </div>
              <div>
                <label className="small">Starts (local)</label>
                <input type="datetime-local" value={startsAtUtc} onChange={e => setStartsAtUtc(e.target.value)} />
              </div>
              <div>
                <label className="small">Ends (local)</label>
                <input type="datetime-local" value={endsAtUtc} onChange={e => setEndsAtUtc(e.target.value)} />
              </div>
              <div>
                <label className="small">Reason</label>
                <input value={reason} onChange={e => setReason(e.target.value)} />
              </div>
              <button>Create</button>
            </form>
          </div>

          {canWriteMedical && (
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Add medical record entry</h3>
              <form className="list" onSubmit={addMedicalEntry}>
                <div>
                  <label className="small">Patient</label>
                  <select value={mrPatientId} onChange={e => setMrPatientId(e.target.value)}>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="small">Title</label>
                  <input value={mrTitle} onChange={e => setMrTitle(e.target.value)} />
                </div>
                <div>
                  <label className="small">Diagnosis</label>
                  <input value={mrDiagnosis} onChange={e => setMrDiagnosis(e.target.value)} />
                </div>
                <div>
                  <label className="small">Description</label>
                  <textarea rows="3" value={mrDescription} onChange={e => setMrDescription(e.target.value)} />
                </div>
                <button>Add entry</button>
              </form>
            </div>
          )}
        </div>
      )}

      {hasRole(roles, 'Patient') && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>My medical record</h3>
          <div className="small">Stored in MongoDB.</div>
          <div className="list">
            {(medicalRecord?.entries || []).length === 0 && <div className="item small">No entries yet.</div>}
            {(medicalRecord?.entries || []).slice().reverse().map((e, idx) => (
              <div key={idx} className="item">
                <div><b>{e.title}</b> <span className="badge">{new Date(e.dateUtc).toLocaleDateString()}</span></div>
                {e.diagnosis && <div className="small">Diagnosis: {e.diagnosis}</div>}
                {e.description && <div className="small">{e.description}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
