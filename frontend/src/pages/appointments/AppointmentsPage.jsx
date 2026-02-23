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
import ExportDropdown from '../../components/ui/ExportDropdown.jsx'
import { appointmentsApi } from '../../api/services/appointmentsApi.js'
import { directoryApi } from '../../api/services/directoryApi.js'
import { useAuth } from '../../state/AuthContext.jsx'
import { useLang } from '../../state/LanguageContext.jsx'

function formatDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const STATUS_OPTIONS = ['Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'NoShow']

const STATUS_VARIANT = {
  Scheduled: 'info',
  Confirmed: 'success',
  Completed: 'success',
  Cancelled: 'danger',
  NoShow: 'warning',
}

const EMPTY_FILTERS = { search: '', status: '', from: '', to: '' }

export default function AppointmentsPage() {
  const navigate = useNavigate()
  const { user, hasPermission, hasRole } = useAuth()
  const { t } = useLang()

  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [activeParams, setActiveParams] = useState({})

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

  const doctorOptionsForForm = (() => {
    if (hasRole('Admin')) return doctors
    if (hasRole('Doctor') && user?.id) {
      const me = doctors.find(d => d.userId === user.id)
      return me ? [me] : doctors
    }
    return doctors
  })()

  const load = (params) => {
    let cancelled = false
    setLoading(true)
    appointmentsApi.list(params)
      .then(res => { if (!cancelled) setList(res.data || []) })
      .catch(() => { if (!cancelled) setList([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }

  useEffect(() => { load({}) }, [])

  const handleApply = () => {
    const params = {}
    if (filters.search.trim()) params.search = filters.search.trim()
    if (filters.status) params.status = filters.status
    if (filters.from) params.fromUtc = new Date(filters.from).toISOString()
    if (filters.to) params.toUtc = new Date(filters.to).toISOString()
    setActiveParams(params)
    load(params)
  }

  const handleClear = () => {
    setFilters(EMPTY_FILTERS)
    setActiveParams({})
    load({})
  }

  const handleCreate = (e) => {
    e.preventDefault()
    setSaveError('')
    const start = new Date(form.startsAtUtc)
    const end = new Date(form.endsAtUtc)
    if (!form.doctorId || !form.patientId || !form.startsAtUtc || !form.endsAtUtc) {
      setSaveError('Plotëso mjekun, pacientin, fillimin dhe mbarimin.')
      return
    }
    if (end <= start) {
      setSaveError('Mbarimi duhet të jetë pas fillimit.')
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
        load(activeParams)
      })
      .catch(err => setSaveError(err.response?.data?.error || 'Krijimi dështoi'))
      .finally(() => setSaving(false))
  }

  const doctorOptions = doctorOptionsForForm.map(d => ({ value: d.id, label: `${d.name}${d.specialty ? ` (${d.specialty})` : ''}` }))
  const patientOptions = patients.map(p => ({ value: p.id, label: p.name || p.email }))

  const columns = [
    {
      key: 'startsAtUtc', header: 'Data & Ora',
      render: row => (
        <span style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{formatDate(row.startsAtUtc)}</span>
      ),
    },
    {
      key: 'doctor', header: 'Mjeku',
      render: row => (
        <div>
          <div style={{ fontWeight: 500 }}>{row.doctor?.name ?? '—'}</div>
          {row.doctor?.specialty && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.doctor.specialty}</div>}
        </div>
      ),
    },
    { key: 'patient', header: 'Pacienti', render: row => row.patient?.name ?? '—' },
    {
      key: 'status', header: 'Statusi',
      render: row => <Badge variant={STATUS_VARIANT[row.status] || 'gray'}>{row.status}</Badge>,
    },
    {
      key: 'reason', header: 'Arsyeja',
      render: row => (
        <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
          {row.reason || '—'}
        </span>
      ),
    },
    {
      key: 'endsAtUtc', header: 'Përfundon',
      render: row => <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(row.endsAtUtc)}</span>,
    },
  ]

  const inputStyle = { height: 36, fontSize: '0.875rem' }
  const selectStyle = {
    padding: '6px 10px',
    border: '1px solid var(--border-color-strong)',
    borderRadius: 6,
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    height: 36,
    cursor: 'pointer',
    minWidth: 140,
  }

  return (
    <>
      <PageHeader
        title={t('pages.appointments.title')}
        subtitle={t('pages.appointments.subtitle')}
        actions={
          <div className="d-flex gap-2 align-items-center flex-wrap">
            {hasPermission('appointments.read') && (
              <ExportDropdown resource="appointments" params={activeParams} />
            )}
            {hasPermission('appointments.write') && (
              <Button variant="primary" onClick={() => setComposeOpen(true)}>
                + Takim i ri
              </Button>
            )}
          </div>
        }
      />

      {/* Filter bar */}
      <Card style={{ marginBottom: '1rem' }}>
        <CardBody>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>

            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>Kërko</div>
              <input
                type="text"
                className="form-control"
                placeholder="Mjek, pacient, arsye..."
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleApply()}
                style={{ ...inputStyle, width: 200 }}
              />
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>Statusi</div>
              <select
                style={selectStyle}
                value={filters.status}
                onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
              >
                <option value="">— Të gjitha —</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>Nga data</div>
              <input
                type="date"
                className="form-control"
                value={filters.from}
                onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
                style={{ ...inputStyle, width: 150 }}
              />
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>Deri më</div>
              <input
                type="date"
                className="form-control"
                value={filters.to}
                onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
                style={{ ...inputStyle, width: 150 }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', paddingBottom: 1 }}>
              <Button variant="primary" onClick={handleApply}>Apliko</Button>
              <Button variant="ghost" onClick={handleClear}>Pastro</Button>
            </div>
          </div>

          {/* Active filter chips */}
          {Object.keys(activeParams).length > 0 && (
            <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {activeParams.search && (
                <span style={chipStyle}>Kërko: "{activeParams.search}"</span>
              )}
              {activeParams.status && (
                <span style={chipStyle}>Status: {activeParams.status}</span>
              )}
              {activeParams.fromUtc && (
                <span style={chipStyle}>Nga: {filters.from}</span>
              )}
              {activeParams.toUtc && (
                <span style={chipStyle}>Deri: {filters.to}</span>
              )}
              <span
                style={{ ...chipStyle, background: 'var(--color-danger-subtle)', color: 'var(--color-danger)', cursor: 'pointer' }}
                onClick={handleClear}
              >
                × Pastro filtrat
              </span>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          <Table
            columns={columns}
            data={list}
            loading={loading}
            emptyMessage="Nuk u gjetën takime"
            emptyIcon="📅"
            onRowClick={row => navigate(`/appointments/${row.id}`, { state: { appointment: row } })}
          />
        </CardBody>
      </Card>

      <Modal open={composeOpen} onClose={() => !saving && setComposeOpen(false)} title="Takim i ri" size="lg">
        <form onSubmit={handleCreate}>
          {saveError && <p className="text-danger mb-3">{saveError}</p>}
          <FormField label="Mjeku" required>
            <Select options={doctorOptions} value={form.doctorId} onChange={v => setForm(f => ({ ...f, doctorId: v }))} placeholder="Zgjidh mjekun" />
          </FormField>
          <FormField label="Pacienti" required>
            <Select options={patientOptions} value={form.patientId} onChange={v => setForm(f => ({ ...f, patientId: v }))} placeholder="Zgjidh pacientin" />
          </FormField>
          <FormField label="Fillon" required>
            <input type="datetime-local" className="form-control" value={form.startsAtUtc} onChange={e => setForm(f => ({ ...f, startsAtUtc: e.target.value }))} required />
          </FormField>
          <FormField label="Përfundon" required>
            <input type="datetime-local" className="form-control" value={form.endsAtUtc} onChange={e => setForm(f => ({ ...f, endsAtUtc: e.target.value }))} required />
          </FormField>
          <FormField label="Arsyeja e vizitës">
            <input type="text" className="form-control" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Arsyeja e vizitës" />
          </FormField>
          <div className="modal-footer">
            <Button type="button" variant="ghost" onClick={() => setComposeOpen(false)} disabled={saving}>Anulo</Button>
            <Button type="submit" variant="primary" loading={saving}>Krijo</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

const chipStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 10px',
  borderRadius: 999,
  fontSize: '0.75rem',
  fontWeight: 500,
  background: 'var(--color-primary-subtle)',
  color: 'var(--color-primary)',
}
