import { useState, useEffect } from 'react'
import PageHeader from '../../components/layout/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Modal from '../../components/ui/Modal.jsx'
import FormField from '../../components/ui/FormField.jsx'
import Select from '../../components/ui/Select.jsx'
import { Card, CardBody } from '../../components/ui/Card.jsx'
import { usersApi } from '../../api/services/usersApi.js'
import { useAuth } from '../../state/AuthContext.jsx'
import { useLang } from '../../state/LanguageContext.jsx'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString()
}

const ROLE_OPTIONS = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Doctor', label: 'Doctor' },
  { value: 'Patient', label: 'Patient' },
  { value: 'Receptionist', label: 'Receptionist' },
  { value: 'LabTechnician', label: 'Lab Technician' },
  { value: 'Pharmacist', label: 'Pharmacist' },
  { value: 'HRManager', label: 'HR Manager' },
]

export default function UsersPage() {
  const { hasPermission } = useAuth()
  const { t } = useLang()
  const [list, setList] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', role: 'Patient',
    specialty: '', licenseNumber: '', bloodType: '', dateOfBirth: '', allergies: '',
  })
  const [creating, setCreating] = useState(false)

  const loadList = () => {
    setLoading(true)
    usersApi.list(roleFilter ? { role: roleFilter } : {})
      .then(res => setList(res.data || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => loadList(), [roleFilter])

  useEffect(() => {
    usersApi.getRoles().then(r => setRoles(r.data || [])).catch(() => setRoles(ROLE_OPTIONS.map(o => o.value)))
  }, [])

  const handleCreate = (e) => {
    e.preventDefault()
    if (!form.fullName?.trim() || !form.email?.trim() || !form.password?.trim() || !form.role) return
    setCreating(true)
    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
    }
    if (form.role === 'Doctor') {
      payload.specialty = form.specialty?.trim() || 'General'
      payload.licenseNumber = form.licenseNumber?.trim() || ''
    }
    if (form.role === 'Patient') {
      payload.bloodType = form.bloodType?.trim() || ''
      payload.dateOfBirth = form.dateOfBirth || null
      payload.allergies = form.allergies?.trim() || null
    }
    usersApi.create(payload)
      .then(() => {
        setCreateOpen(false)
        setForm({ fullName: '', email: '', password: '', role: 'Patient', specialty: '', licenseNumber: '', bloodType: '', dateOfBirth: '', allergies: '' })
        loadList()
      })
      .catch(() => {})
      .finally(() => setCreating(false))
  }

  const handleDisable = (row) => {
    if (!confirm(`Disable user "${row.fullName}"? They will no longer be able to sign in.`)) return
    usersApi.disable(row.id).then(loadList).catch(() => {})
  }

  const handleEnable = (row) => {
    if (!confirm(`Enable user "${row.fullName}"? They will be able to sign in again.`)) return
    usersApi.enable(row.id).then(loadList).catch(() => {})
  }

  const handleDeletePermanently = (row) => {
    if (!confirm(`⚠️ WARNING: Permanently delete "${row.fullName}"?\n\nThis action cannot be undone. All account data will be removed.`)) return
    if (!confirm(`Are you absolutely sure you want to permanently delete "${row.fullName}"?`)) return
    usersApi.deletePermanently(row.id).then(loadList).catch(err => {
      alert(err.response?.data?.error || 'Failed to delete user.')
    })
  }

  const columns = [
    {
      key: 'fullName',
      header: 'Name',
      render: row => (
        <span style={row.isDisabled ? { color: 'var(--text-secondary)', textDecoration: 'line-through' } : {}}>
          {row.fullName}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: row => (
        <span style={row.isDisabled ? { color: 'var(--text-secondary)' } : {}}>
          {row.email}
        </span>
      ),
    },
    { key: 'roles', header: 'Roles', render: row => (Array.isArray(row.roles) ? row.roles.join(', ') : row.roles) },
    { key: 'createdAtUtc', header: 'Created', render: row => formatDate(row.createdAtUtc) },
    {
      key: 'actions',
      header: 'Actions',
      render: row => (
        <div className="d-flex align-items-center gap-2">
          {row.isDisabled ? (
            <>
              <Badge variant="danger">Disabled</Badge>
              {hasPermission('users.write') && (
                <Button variant="ghost" size="sm" onClick={() => handleEnable(row)}>Enable</Button>
              )}
            </>
          ) : (
            hasPermission('users.write') && (
              <Button variant="ghost" size="sm" className="text-danger" onClick={() => handleDisable(row)}>Disable</Button>
            )
          )}
          {hasPermission('users.write') && (
            <Button variant="ghost" size="sm" style={{ color: 'var(--color-danger)', opacity: 0.7 }} onClick={() => handleDeletePermanently(row)}>🗑 Delete</Button>
          )}
        </div>
      ),
    },
  ]

  const roleOptions = roles.length ? roles.map(r => ({ value: r, label: r })) : ROLE_OPTIONS

  return (
    <>
      <PageHeader
        title={t('pages.users.title')}
        subtitle={t('pages.users.subtitle')}
        breadcrumb={[{ label: 'Settings', to: '/settings' }, { label: 'Users' }]}
        actions={
          hasPermission('users.write') && (
            <Button variant="primary" onClick={() => setCreateOpen(true)}>Add user</Button>
          )
        }
      />
      <div className="content-block">
        <div className="mb-3">
          <select className="form-control" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ width: 180 }}>
            <option value="">All roles</option>
            {roleOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <Card>
          <CardBody className="p-0">
            <Table columns={columns} data={list} loading={loading} emptyMessage="No users" emptyIcon="👥" />
          </CardBody>
        </Card>
      </div>

      <Modal open={createOpen} onClose={() => !creating && setCreateOpen(false)} title="Add user" size="lg">
        <form onSubmit={handleCreate}>
          <FormField label="Full name" required>
            <input type="text" className="form-control" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
          </FormField>
          <FormField label="Email" required>
            <input type="email" className="form-control" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </FormField>
          <FormField label="Password" required>
            <input type="password" className="form-control" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} minLength={6} />
          </FormField>
          <FormField label="Role" required>
            <Select options={roleOptions} value={form.role} onChange={v => setForm(f => ({ ...f, role: v }))} />
          </FormField>

          {form.role === 'Doctor' && (
            <>
              <FormField label="Specialty">
                <input type="text" className="form-control" value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} placeholder="General" />
              </FormField>
              <FormField label="License number">
                <input type="text" className="form-control" value={form.licenseNumber} onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))} />
              </FormField>
            </>
          )}

          {form.role === 'Patient' && (
            <>
              <FormField label="Blood type">
                <select className="form-control" value={form.bloodType} onChange={e => setForm(f => ({ ...f, bloodType: e.target.value }))}>
                  <option value="">—</option>
                  <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                  <option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
                </select>
              </FormField>
              <FormField label="Date of birth">
                <input type="date" className="form-control" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
              </FormField>
              <FormField label="Allergies">
                <input type="text" className="form-control" value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))} />
              </FormField>
            </>
          )}

          <div className="modal-footer mt-4">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} disabled={creating}>Cancel</Button>
            <Button type="submit" variant="primary" loading={creating} disabled={!form.fullName?.trim() || !form.email?.trim() || !form.password}>Create</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
