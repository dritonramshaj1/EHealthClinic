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
import { labApi } from '../../api/services/labApi.js'
import { appointmentsApi } from '../../api/services/appointmentsApi.js'
import { useAuth } from '../../state/AuthContext.jsx'
import { useLang } from '../../state/LanguageContext.jsx'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString()
}

const defaultTest = () => ({ testName: '', testCode: '', specimenType: '' })

export default function LabOrdersPage() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const { t } = useLang()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [appointments, setAppointments] = useState([])
  const [form, setForm] = useState({
    appointmentId: '',
    doctorId: '',
    patientId: '',
    priority: 'Routine',
    notes: '',
    tests: [defaultTest()],
  })
  const [creating, setCreating] = useState(false)

  const loadList = () => {
    setLoading(true)
    labApi.listOrders()
      .then(res => setList(res.data || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadList() }, [])

  useEffect(() => {
    if (createOpen) {
      appointmentsApi.list({ status: 'Scheduled' })
        .then(res => {
          const data = res.data || []
          setAppointments(data)
          setForm(f => ({ ...f, appointmentId: '', doctorId: '', patientId: '', tests: [defaultTest()] }))
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

  const addTest = () => setForm(f => ({ ...f, tests: [...f.tests, defaultTest()] }))
  const removeTest = (idx) => setForm(f => ({ ...f, tests: f.tests.filter((_, i) => i !== idx) }))
  const updateTest = (idx, field, value) => setForm(f => ({
    ...f,
    tests: f.tests.map((t, i) => i === idx ? { ...t, [field]: value } : t),
  }))

  const handleCreate = (e) => {
    e.preventDefault()
    if (!form.appointmentId || !form.doctorId || !form.patientId) return
    const tests = form.tests
      .filter(t => t.testName?.trim())
      .map(t => ({ testName: t.testName.trim(), testCode: t.testCode?.trim() || null, specimenType: t.specimenType?.trim() || null }))
    setCreating(true)
    labApi.createOrder({
      appointmentId: form.appointmentId,
      doctorId: form.doctorId,
      patientId: form.patientId,
      priority: form.priority,
      notes: form.notes?.trim() || null,
      tests: tests.length ? tests : null,
    })
      .then(() => { setCreateOpen(false); loadList() })
      .catch(() => {})
      .finally(() => setCreating(false))
  }

  const appointmentOptions = appointments.map(a => ({
    value: a.id,
    label: `${a.patient?.name ?? 'Patient'} — ${a.doctor?.name ?? 'Doctor'} (${formatDate(a.startsAtUtc)})`,
  }))

  const columns = [
    { key: 'patientName', header: 'Patient' },
    { key: 'doctorName', header: 'Doctor' },
    { key: 'status', header: 'Status', render: row => <Badge>{row.status}</Badge> },
    { key: 'priority', header: 'Priority' },
    { key: 'orderedAtUtc', header: 'Ordered', render: row => formatDate(row.orderedAtUtc) },
  ]

  return (
    <>
      <PageHeader
        title={t('pages.laboratory.title')}
        subtitle={t('pages.laboratory.subtitle')}
        actions={
          hasPermission('lab.write') && (
            <Button variant="primary" onClick={() => setCreateOpen(true)}>New order</Button>
          )
        }
      />
      <Card>
        <CardBody className="p-0">
          <Table
            columns={columns}
            data={list}
            loading={loading}
            emptyMessage="No lab orders found"
            emptyIcon="🧪"
            onRowClick={row => navigate(`/laboratory/${row.id}`)}
          />
        </CardBody>
      </Card>

      <Modal open={createOpen} onClose={() => !creating && setCreateOpen(false)} title="New lab order" size="lg">
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
              <FormField label="Priority">
                <Select
                  options={[{ value: 'Routine', label: 'Routine' }, { value: 'Urgent', label: 'Urgent' }, { value: 'Stat', label: 'Stat' }]}
                  value={form.priority}
                  onChange={v => setForm(f => ({ ...f, priority: v }))}
                />
              </FormField>
              <FormField label="Notes">
                <input type="text" className="form-control" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
              </FormField>
              <h5 className="mt-3">Tests</h5>
              {form.tests.map((t, idx) => (
                <div key={idx} className="border rounded p-2 mb-2 flex gap-2 align-items-center">
                  <input type="text" className="form-control" placeholder="Test name" value={t.testName} onChange={e => updateTest(idx, 'testName', e.target.value)} />
                  <input type="text" className="form-control" placeholder="Code" value={t.testCode} onChange={e => updateTest(idx, 'testCode', e.target.value)} style={{ width: 100 }} />
                  <input type="text" className="form-control" placeholder="Specimen" value={t.specimenType} onChange={e => updateTest(idx, 'specimenType', e.target.value)} style={{ width: 120 }} />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeTest(idx)} disabled={form.tests.length <= 1}>Remove</Button>
                </div>
              ))}
              <Button type="button" variant="secondary" size="sm" onClick={addTest}>Add test</Button>
            </>
          )}
          <div className="modal-footer mt-4">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} disabled={creating}>Cancel</Button>
            <Button type="submit" variant="primary" loading={creating} disabled={!form.appointmentId}>Create</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
