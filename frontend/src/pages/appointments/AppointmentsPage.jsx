import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Modal from '../../components/ui/Modal.jsx'
import FormField from '../../components/ui/FormField.jsx'
import Select from '../../components/ui/Select.jsx'
import { Card, CardBody } from '../../components/ui/Card.jsx'
import { appointmentsApi } from '../../api/services/appointmentsApi.js'
import { directoryApi } from '../../api/services/directoryApi.js'
import { useAuth } from '../../state/AuthContext.jsx'

function formatDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function AppointmentsPage() {
  const navigate = useNavigate()
  const { user, hasPermission, hasRole } = useAuth()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [composeOpen, setComposeOpen] = useState(false)
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [form, setForm] = useState({ doctorId: '', patientId: '', startsAtUtc: '', endsAtUtc: '', reason: '' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (composeOpen) {
      directoryApi.getDoctors().then(r => setDoctors(r.data || [])).catch(() => setDoctors([]))
      directoryApi.getPatients().then(r => setPatients(r.data || [])).catch(() => setPatients([]))
    }
  }, [composeOpen])

  // Doctor can only create appointments for themselves; Admin sees all doctors
  const doctorOptionsForForm = (() => {
    if (hasRole('Admin')) return doctors
    if (hasRole('Doctor') && user?.id) {
      const me = doctors.find(d => d.userId === user.id)
      return me ? [me] : doctors
    }
    return doctors
  })()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = {}
    if (statusFilter) params.status = statusFilter
    appointmentsApi.list(params)
      .then(res => { if (!cancelled) setList(res.data || []) })
      .catch(() => { if (!cancelled) setList([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [statusFilter])

  const handleCreate = (e) => {
    e.preventDefault()
    setSaveError('')
    const start = new Date(form.startsAtUtc)
    const end = new Date(form.endsAtUtc)
    if (!form.doctorId || !form.patientId || !form.startsAtUtc || !form.endsAtUtc) {
      setSaveError('Fill doctor, patient, start and end.')
      return
    }
    if (end <= start) {
      setSaveError('End must be after start.')
      return
    }
    setSaving(true)
    appointmentsApi.create({
      doctorId: form.doctorId,
      patientId: form.patientId,
      startsAtUtc: start.toISOString(),
      endsAtUtc: end.toISOString(),
      reason: form.reason || null,
    })
      .then(() => {
        setComposeOpen(false)
        setForm({ doctorId: '', patientId: '', startsAtUtc: '', endsAtUtc: '', reason: '' })
        appointmentsApi.list(statusFilter ? { status: statusFilter } : {}).then(res => setList(res.data || []))
      })
      .catch(err => setSaveError(err.response?.data?.error || 'Failed to create'))
      .finally(() => setSaving(false))
  }

  const doctorOptions = doctorOptionsForForm.map(d => ({ value: d.id, label: `${d.name}${d.specialty ? ` (${d.specialty})` : ''}` }))
  const patientOptions = patients.map(p => ({ value: p.id, label: p.name || p.email }))

  const columns = [
    { key: 'startsAtUtc', header: 'Date & time', render: row => formatDate(row.startsAtUtc) },
    { key: 'doctor', header: 'Doctor', render: row => row.doctor?.name ?? '—' },
    { key: 'patient', header: 'Patient', render: row => row.patient?.name ?? '—' },
    { key: 'status', header: 'Status', render: row => <Badge>{row.status}</Badge> },
    { key: 'reason', header: 'Reason', render: row => <span className="text-secondary text-sm">{row.reason || '—'}</span> },
  ]

  return (
    <>
      <PageHeader
        title="Appointments"
        subtitle="View and manage appointments"
        actions={
          hasPermission('appointments.write') && (
            <Button variant="primary" onClick={() => setComposeOpen(true)}>
              New Appointment
            </Button>
          )
        }
      />
      <Card>
        <div className="filter-bar">
          <select
            className="form-control"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ maxWidth: 180 }}
          >
            <option value="">All statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="NoShow">No Show</option>
          </select>
        </div>
        <CardBody className="p-0">
          <Table
            columns={columns}
            data={list}
            loading={loading}
            emptyMessage="No appointments found"
            emptyIcon="📅"
            onRowClick={row => navigate(`/appointments/${row.id}`, { state: { appointment: row } })}
          />
        </CardBody>
      </Card>

      <Modal open={composeOpen} onClose={() => !saving && setComposeOpen(false)} title="New appointment" size="lg">
        <form onSubmit={handleCreate}>
          {saveError && <p className="text-danger mb-3">{saveError}</p>}
          <FormField label="Doctor" required>
            <Select options={doctorOptions} value={form.doctorId} onChange={v => setForm(f => ({ ...f, doctorId: v }))} placeholder="Select doctor" />
          </FormField>
          <FormField label="Patient" required>
            <Select options={patientOptions} value={form.patientId} onChange={v => setForm(f => ({ ...f, patientId: v }))} placeholder="Select patient" />
          </FormField>
          <FormField label="Start" required>
            <input type="datetime-local" className="form-control" value={form.startsAtUtc} onChange={e => setForm(f => ({ ...f, startsAtUtc: e.target.value }))} required />
          </FormField>
          <FormField label="End" required>
            <input type="datetime-local" className="form-control" value={form.endsAtUtc} onChange={e => setForm(f => ({ ...f, endsAtUtc: e.target.value }))} required />
          </FormField>
          <FormField label="Reason">
            <input type="text" className="form-control" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Reason for visit" />
          </FormField>
          <div className="modal-footer">
            <Button type="button" variant="ghost" onClick={() => setComposeOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="primary" loading={saving}>Create</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
