import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import { Card, CardBody } from '../../components/ui/Card.jsx'
import { patientsApi } from '../../api/services/patientsApi.js'
import { useAuth } from '../../state/AuthContext.jsx'

export default function PatientsPage() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    patientsApi.list({ q: search || undefined })
      .then(res => { if (!cancelled) setList(res.data || []) })
      .catch(() => { if (!cancelled) setList([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [search])

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'id', header: 'MRN / ID', render: row => <span className="text-muted text-sm">{row.id?.slice(0, 8)}…</span> },
  ]

  return (
    <>
      <PageHeader
        title="Patients"
        subtitle="Search and manage patients"
        actions={
          hasPermission('patients.write') && hasPermission('users.write') && (
            <Button variant="primary" onClick={() => navigate('/patients/new')}>
              New patient
            </Button>
          )
        }
      />
      <Card>
        <div className="filter-bar">
          <input
            type="search"
            className="form-control"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 320 }}
          />
        </div>
        <CardBody className="p-0">
          <Table
            columns={columns}
            data={list}
            loading={loading}
            emptyMessage="No patients found"
            emptyIcon="👥"
            onRowClick={row => navigate(`/patients/${row.id}`, { state: { patient: row } })}
          />
        </CardBody>
      </Card>
    </>
  )
}
