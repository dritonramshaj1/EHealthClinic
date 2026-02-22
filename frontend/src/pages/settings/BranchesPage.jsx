import { useState, useEffect } from 'react'
import PageHeader from '../../components/layout/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Modal from '../../components/ui/Modal.jsx'
import FormField from '../../components/ui/FormField.jsx'
import { Card, CardBody } from '../../components/ui/Card.jsx'
import { branchesApi } from '../../api/services/branchesApi.js'
import { useAuth } from '../../state/AuthContext.jsx'
import { useLang } from '../../state/LanguageContext.jsx'

export default function BranchesPage() {
  const { hasPermission } = useAuth()
  const { t } = useLang()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)
  const [form, setForm] = useState({ name: '', address: '', city: '', phone: '', email: '', isMain: false, isActive: true })
  const [saving, setSaving] = useState(false)

  const loadList = () => {
    setLoading(true)
    branchesApi.list({ activeOnly: false })
      .then(res => setList(res.data || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => loadList(), [])

  const handleCreate = (e) => {
    e.preventDefault()
    if (!form.name?.trim()) return
    setSaving(true)
    branchesApi.create({
      name: form.name.trim(),
      address: form.address?.trim() || null,
      city: form.city?.trim() || null,
      phone: form.phone?.trim() || null,
      email: form.email?.trim() || null,
      isMain: form.isMain,
    })
      .then(() => { setCreateOpen(false); setForm({ name: '', address: '', city: '', phone: '', email: '', isMain: false }); loadList() })
      .catch(() => {})
      .finally(() => setSaving(false))
  }

  const openEdit = (row) => {
    setEditingBranch(row)
    setForm({
      name: row.name || '',
      address: row.address || '',
      city: row.city || '',
      phone: row.phone || '',
      email: row.email || '',
      isMain: row.isMain || false,
      isActive: row.isActive !== false,
    })
    setEditOpen(true)
  }

  const handleUpdate = (e) => {
    e.preventDefault()
    if (!editingBranch?.id || !form.name?.trim()) return
    setSaving(true)
    branchesApi.update(editingBranch.id, {
      name: form.name.trim(),
      address: form.address?.trim() || null,
      city: form.city?.trim() || null,
      phone: form.phone?.trim() || null,
      email: form.email?.trim() || null,
      isMain: form.isMain,
      isActive: form.isActive,
    })
      .then(() => { setEditOpen(false); setEditingBranch(null); loadList() })
      .catch(() => {})
      .finally(() => setSaving(false))
  }

  const handleDelete = (row) => {
    if (!confirm(`Delete branch "${row.name}"?`)) return
    branchesApi.delete(row.id).then(loadList).catch(() => {})
  }

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'city', header: 'City' },
    { key: 'phone', header: 'Phone' },
    { key: 'isActive', header: 'Status', render: row => <Badge>{row.isActive ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions',
      header: 'Actions',
      render: row => hasPermission('branches.write') ? (
        <span className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>Edit</Button>
          <Button variant="ghost" size="sm" className="text-danger" onClick={() => handleDelete(row)}>Delete</Button>
        </span>
      ) : '—',
    },
  ]

  return (
    <>
      <PageHeader
        title={t('pages.branches.title')}
        subtitle={t('pages.branches.subtitle')}
        breadcrumb={[{ label: 'Settings', to: '/settings' }, { label: 'Branches' }]}
        actions={
          hasPermission('branches.write') && (
            <Button variant="primary" onClick={() => setCreateOpen(true)}>Add branch</Button>
          )
        }
      />
      <Card>
        <CardBody className="p-0">
          <Table
            columns={columns}
            data={list}
            loading={loading}
            emptyMessage="No branches"
            emptyIcon="🏢"
          />
        </CardBody>
      </Card>

      <Modal open={createOpen} onClose={() => !saving && setCreateOpen(false)} title="Add branch">
        <form onSubmit={handleCreate}>
          <FormField label="Name" required>
            <input type="text" className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </FormField>
          <FormField label="Address">
            <input type="text" className="form-control" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </FormField>
          <FormField label="City">
            <input type="text" className="form-control" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
          </FormField>
          <FormField label="Phone">
            <input type="text" className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </FormField>
          <FormField label="Email">
            <input type="email" className="form-control" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </FormField>
          <FormField label="Main branch">
            <label><input type="checkbox" checked={form.isMain} onChange={e => setForm(f => ({ ...f, isMain: e.target.checked }))} /> Is main</label>
          </FormField>
          <div className="modal-footer">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="primary" loading={saving} disabled={!form.name?.trim()}>Create</Button>
          </div>
        </form>
      </Modal>

      <Modal open={editOpen} onClose={() => !saving && setEditOpen(false)} title="Edit branch">
        <form onSubmit={handleUpdate}>
          <FormField label="Name" required>
            <input type="text" className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </FormField>
          <FormField label="Address">
            <input type="text" className="form-control" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </FormField>
          <FormField label="City">
            <input type="text" className="form-control" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
          </FormField>
          <FormField label="Phone">
            <input type="text" className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </FormField>
          <FormField label="Email">
            <input type="email" className="form-control" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </FormField>
          <FormField label="Main branch">
            <label><input type="checkbox" checked={form.isMain} onChange={e => setForm(f => ({ ...f, isMain: e.target.checked }))} /> Is main</label>
          </FormField>
          <FormField label="Active">
            <label><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /> Active</label>
          </FormField>
          <div className="modal-footer">
            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="primary" loading={saving} disabled={!form.name?.trim()}>Save</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
