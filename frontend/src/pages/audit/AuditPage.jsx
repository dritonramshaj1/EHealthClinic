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

export default function AuditPage() {
  const { t } = useLang()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ userId: '', module: '', action: '', from: '', to: '' })

  const load = () => {
    setLoading(true)
    const params = { limit: 100 }
    if (filters.userId?.trim()) params.userId = filters.userId.trim()
    if (filters.module?.trim()) params.module = filters.module.trim()
    if (filters.action?.trim()) params.action = filters.action.trim()
    if (filters.from) params.from = new Date(filters.from).toISOString()
    if (filters.to) params.to = new Date(filters.to).toISOString()
    auditApi.getLogs(params)
      .then(res => setList(res.data || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), [])

  const columns = [
    { key: 'createdAtUtc', header: 'Time', render: row => formatDate(row.createdAtUtc) },
    { key: 'userEmail', header: 'User' },
    { key: 'action', header: 'Action' },
    { key: 'module', header: 'Module' },
    { key: 'entityType', header: 'Entity' },
    { key: 'details', header: 'Details', render: row => <span className="text-sm text-secondary truncate" style={{ maxWidth: 200 }}>{row.details}</span> },
  ]

  return (
    <>
      <PageHeader title={t('pages.audit.title')} subtitle={t('pages.audit.subtitle')} />
      <div className="content-block">
        <div className="d-flex flex-wrap gap-2 mb-3 align-items-end">
          <div>
            <label className="text-sm">User ID</label>
            <input type="text" className="form-control" placeholder="User ID" value={filters.userId} onChange={e => setFilters(f => ({ ...f, userId: e.target.value }))} style={{ width: 140 }} />
          </div>
          <div>
            <label className="text-sm">Module</label>
            <input type="text" className="form-control" placeholder="e.g. Prescription" value={filters.module} onChange={e => setFilters(f => ({ ...f, module: e.target.value }))} style={{ width: 120 }} />
          </div>
          <div>
            <label className="text-sm">Action</label>
            <input type="text" className="form-control" placeholder="e.g. Create" value={filters.action} onChange={e => setFilters(f => ({ ...f, action: e.target.value }))} style={{ width: 100 }} />
          </div>
          <div>
            <label className="text-sm">From</label>
            <input type="datetime-local" className="form-control" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm">To</label>
            <input type="datetime-local" className="form-control" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
          </div>
          <Button variant="primary" onClick={load}>Apply</Button>
        </div>
        <Card>
          <CardBody className="p-0">
            <Table
              columns={columns}
              data={list}
              loading={loading}
              emptyMessage="No audit entries"
              emptyIcon="🔍"
            />
          </CardBody>
        </Card>
      </div>
    </>
  )
}
