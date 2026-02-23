import { useState, useEffect } from 'react'
import PageHeader from '../../components/layout/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import { Card, CardBody } from '../../components/ui/Card.jsx'
import { auditApi } from '../../api/services/auditApi.js'
import { useLang } from '../../state/LanguageContext.jsx'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString()
}

const MODULE_OPTIONS = [
  'Branch', 'Insurance', 'InventoryItem', 'Invoice',
  'LabOrder', 'LabResult', 'LeaveRequest', 'PatientDocument',
  'Prescription', 'Queue', 'StaffShift',
]

const ACTION_OPTIONS = [
  'Create', 'Update', 'Delete', 'Upload', 'Cancel', 'Call', 'Review', 'Movement', 'Pay',
  'AdminCreatedUser', 'AdminUpdatedUser', 'AdminDisabledUser', 'AdminEnabledUser', 'AdminDeletedUser',
  'AppointmentCreated', 'AppointmentStatusChanged',
  'ImportPatients', 'MedicalRecordEntryAdded',
  'PaymentCreated', 'PaymentStatusChanged', 'PaymentCompleted',
]

const EMPTY_FILTERS = { userEmail: '', module: '', action: '', from: '', to: '' }

export default function AuditPage() {
  const { t } = useLang()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  const load = () => {
    setLoading(true)
    const params = { limit: 200 }
    if (filters.userEmail?.trim()) params.userEmail = filters.userEmail.trim()
    if (filters.module) params.module = filters.module
    if (filters.action) params.action = filters.action
    if (filters.from) params.from = new Date(filters.from).toISOString()
    if (filters.to) params.to = new Date(filters.to).toISOString()
    auditApi.getLogs(params)
      .then(res => setList(res.data || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), [])

  const handleClear = () => {
    setFilters(EMPTY_FILTERS)
  }

  const columns = [
    {
      key: 'createdAtUtc', header: 'Koha',
      render: row => (
        <span style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{formatDate(row.createdAtUtc)}</span>
      ),
    },
    {
      key: 'userEmail', header: 'Përdoruesi',
      render: row => (
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{row.userEmail || '—'}</div>
          {row.userRole && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{row.userRole}</div>}
        </div>
      ),
    },
    {
      key: 'action', header: 'Veprimi',
      render: row => (
        <span style={{
          display: 'inline-block', padding: '2px 8px',
          background: 'var(--color-primary-subtle)', color: 'var(--color-primary)',
          borderRadius: 4, fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap',
        }}>{row.action}</span>
      ),
    },
    { key: 'module', header: 'Moduli', render: row => row.module || '—' },
    { key: 'entityType', header: 'Entiteti', render: row => row.entityType || '—' },
    {
      key: 'details', header: 'Detajet',
      render: row => (
        <span style={{
          fontSize: '0.8rem', color: 'var(--text-secondary)',
          display: 'block', maxWidth: 220,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }} title={row.details}>
          {row.details || '—'}
        </span>
      ),
    },
    {
      key: 'ipAddress', header: 'IP',
      render: row => <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{row.ipAddress || '—'}</span>,
    },
  ]

  const selectStyle = {
    padding: '6px 10px',
    border: '1px solid var(--border-color-strong)',
    borderRadius: 6,
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    cursor: 'pointer',
    minWidth: 130,
  }

  return (
    <>
      <PageHeader title={t('pages.audit.title')} subtitle={t('pages.audit.subtitle')} />
      <div className="content-block">

        {/* Filter card — all fields in one line */}
        <Card style={{ marginBottom: '1rem' }}>
          <CardBody>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>Email</div>
                <input
                  type="text"
                  className="form-control"
                  placeholder="user@example.com"
                  value={filters.userEmail}
                  onChange={e => setFilters(f => ({ ...f, userEmail: e.target.value }))}
                  style={{ width: 180 }}
                />
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>Moduli</div>
                <select
                  style={selectStyle}
                  value={filters.module}
                  onChange={e => setFilters(f => ({ ...f, module: e.target.value }))}
                >
                  <option value="">— Të gjitha —</option>
                  {MODULE_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>Veprimi</div>
                <select
                  style={selectStyle}
                  value={filters.action}
                  onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
                >
                  <option value="">— Të gjitha —</option>
                  {ACTION_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>Nga data</div>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={filters.from}
                  onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
                  style={{ width: 180 }}
                />
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>Deri më</div>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={filters.to}
                  onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
                  style={{ width: 180 }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', paddingBottom: 1 }}>
                <Button variant="primary" onClick={load}>Apliko</Button>
                <Button variant="ghost" onClick={handleClear}>Pastro</Button>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-0">
            <Table
              columns={columns}
              data={list}
              loading={loading}
              emptyMessage="Nuk ka regjistrime auditimi"
              emptyIcon="🔍"
            />
          </CardBody>
        </Card>
      </div>
    </>
  )
}
