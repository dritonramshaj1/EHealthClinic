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
import { prescriptionsApi } from '../../api/services/prescriptionsApi.js'
import { appointmentsApi } from '../../api/services/appointmentsApi.js'
import { useAuth } from '../../state/AuthContext.jsx'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString()
}

const defaultItem = () => ({ medicationName: '', dosage: '', frequency: '', durationDays: 7, instructions: '', quantity: null })

export default function PrescriptionsPage() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [appointments, setAppointments] = useState([])
  const [form, setForm] = useState({
    appointmentId: '',
    doctorId: '',
    patientId: '',
    notes: '',
    expiresAtUtc: '',
    items: [defaultItem()],
  })
  const [creating, setCreating] = useState(false)

  const loadList = () => {
    setLoading(true)
    prescriptionsApi.list({ status: statusFilter || undefined })
      .then(res => setList(res.data || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadList() }, [statusFilter])

  useEffect(() => {
    if (createOpen) {
      appointmentsApi.list({ status: 'Scheduled' })
        .then(res => {
          const data = res.data || []
          setAppointments(data)
          setForm(f => ({ ...f, appointmentId: '', doctorId: '', patientId: '', items: [defaultItem()] }))
        })
        .catch(() => setAppointments([]))
    }
  }, [createOpen])

  const onSelectAppointment = (appointmentId) => {
    const appt = appointments.find(a => a.id === appointmentId)
    setForm(f => ({
      ...f,
      appointmentId: appointmentId || '',
      doctorId: appt?.doctor?.doctorId ?? appt?.doctorId ?? '',
      patientId: appt?.patient?.patientId ?? appt?.patientId ?? '',
    }))
  }

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, defaultItem()] }))
  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))
  const updateItem = (idx, field, value) => setForm(f => ({
    ...f,
    items: f.items.map((it, i) => i === idx ? { ...it, [field]: value } : it),
  }))

  const handleCreate = (e) => {
    e.preventDefault()
    if (!form.appointmentId || !form.doctorId || !form.patientId || !form.items.length) return
    const items = form.items
      .filter(it => it.medicationName?.trim())
      .map(it => ({
        medicationName: it.medicationName.trim(),
        dosage: (it.dosage || '').trim(),
        frequency: (it.frequency || '').trim(),
        durationDays: Math.max(1, parseInt(it.durationDays, 10) || 7),
        instructions: it.instructions?.trim() || null,
        quantity: it.quantity != null && it.quantity !== '' ? parseInt(it.quantity, 10) : null,
      }))
    if (!items.length) return
    setCreating(true)
    prescriptionsApi.create({
      appointmentId: form.appointmentId,
      doctorId: form.doctorId,
      patientId: form.patientId,
      notes: form.notes?.trim() || null,
      expiresAtUtc: form.expiresAtUtc ? new Date(form.expiresAtUtc).toISOString() : null,
      items,
    })
      .then(() => { setCreateOpen(false); setForm({ appointmentId: '', doctorId: '', patientId: '', notes: '', expiresAtUtc: '', items: [defaultItem()] }); loadList() })
      .catch(() => {})
      .finally(() => setCreating(false))
  }

  const columns = [
    { key: 'patientName', header: 'Patient' },
    { key: 'doctorName', header: 'Doctor' },
    { key: 'status', header: 'Status', render: row => <Badge>{row.status}</Badge> },
    { key: 'issuedAtUtc', header: 'Issued', render: row => formatDate(row.issuedAtUtc) },
  ]

  const appointmentOptions = appointments.map(a => ({
    value: a.id,
    label: `${a.patient?.name ?? a.patientName ?? a.patientId} — ${a.doctor?.name ?? a.doctorName ?? a.doctorId} (${formatDate(a.startsAtUtc)})`,
  }))

  return (
    <>
      <PageHeader
        title="Prescriptions"
        subtitle="View and manage prescriptions"
        actions={
          hasPermission('prescriptions.write') && (
            <Button variant="primary" onClick={() => setCreateOpen(true)}>New prescription</Button>
          )
        }
      />
      <div className="content-block">
        <div className="flex gap-2 mb-3">
          <select
            className="form-control"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ width: 180 }}
          >
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <Card>
          <CardBody className="p-0">
            <Table
              columns={columns}
              data={list}
              loading={loading}
              emptyMessage="No prescriptions found"
              emptyIcon="💊"
              onRowClick={row => navigate(`/clinical/prescriptions/${row.id}`)}
            />
          </CardBody>
        </Card>
      </div>

      <Modal open={createOpen} onClose={() => !creating && setCreateOpen(false)} title="New prescription" size="lg">
        <form onSubmit={handleCreate}>
          <FormField label="Appointment" required>
            <Select
              options={appointmentOptions}
              value={form.appointmentId}
              onChange={v => onSelectAppointment(v)}
              placeholder="Select appointment"
            />
          </FormField>
          {form.appointmentId && (
            <>
              <FormField label="Notes">
                <input type="text" className="form-control" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
              </FormField>
              <FormField label="Expires (optional)">
                <input type="datetime-local" className="form-control" value={form.expiresAtUtc} onChange={e => setForm(f => ({ ...f, expiresAtUtc: e.target.value }))} />
              </FormField>
              <h5 className="mt-3">Medications</h5>
              {form.items.map((item, idx) => (
                <div key={idx} className="border rounded p-3 mb-2">
                  <div className="grid grid-2 gap-2">
                    <FormField label="Medication" required>
                      <input type="text" className="form-control" value={item.medicationName} onChange={e => updateItem(idx, 'medicationName', e.target.value)} placeholder="Name" />
                    </FormField>
                    <FormField label="Dosage">
                      <input type="text" className="form-control" value={item.dosage} onChange={e => updateItem(idx, 'dosage', e.target.value)} placeholder="e.g. 10mg" />
                    </FormField>
                    <FormField label="Frequency">
                      <input type="text" className="form-control" value={item.frequency} onChange={e => updateItem(idx, 'frequency', e.target.value)} placeholder="e.g. twice daily" />
                    </FormField>
                    <FormField label="Duration (days)">
                      <input type="number" min={1} className="form-control" value={item.durationDays} onChange={e => updateItem(idx, 'durationDays', e.target.value)} />
                    </FormField>
                    <FormField label="Instructions">
                      <input type="text" className="form-control" value={item.instructions} onChange={e => updateItem(idx, 'instructions', e.target.value)} placeholder="Optional" />
                    </FormField>
                    <FormField label="Quantity">
                      <input type="number" min={0} className="form-control" value={item.quantity ?? ''} onChange={e => updateItem(idx, 'quantity', e.target.value === '' ? null : e.target.value)} placeholder="Optional" />
                    </FormField>
                  </div>
                  <div className="mt-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(idx)} disabled={form.items.length <= 1}>Remove</Button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="secondary" size="sm" onClick={addItem}>Add medication</Button>
            </>
          )}
          <div className="modal-footer mt-4">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} disabled={creating}>Cancel</Button>
            <Button type="submit" variant="primary" loading={creating} disabled={!form.appointmentId || !form.items.some(it => it.medicationName?.trim())}>Create</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
