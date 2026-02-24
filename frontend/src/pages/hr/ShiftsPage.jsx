import { useState, useEffect } from 'react'
import PageHeader from '../../components/layout/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Modal from '../../components/ui/Modal.jsx'
import FormField from '../../components/ui/FormField.jsx'
import Select from '../../components/ui/Select.jsx'
import { Card, CardBody } from '../../components/ui/Card.jsx'
import { hrApi } from '../../api/services/hrApi.js'
import { usersApi } from '../../api/services/usersApi.js'
import { branchesApi } from '../../api/services/branchesApi.js'
import { useAuth } from '../../state/AuthContext.jsx'
import { useLang } from '../../state/LanguageContext.jsx'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString()
}

function toLocalInput(utcString) {
  if (!utcString) return ''
  const d = new Date(utcString)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const SHIFT_TYPES = [
  { value: 'Regular', label: 'Regular' },
  { value: 'Overtime', label: 'Overtime' },
]

export default function ShiftsPage() {
  const { hasPermission } = useAuth()
  const { t } = useLang()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [staff, setStaff] = useState([])
  const [branches, setBranches] = useState([])
  const [form, setForm] = useState({
    userId: '', branchId: '', shiftStartUtc: '', shiftEndUtc: '', shiftType: 'Regular', notes: '',
  })
  const [editForm, setEditForm] = useState({
    branchId: '', shiftStartUtc: '', shiftEndUtc: '', shiftType: 'Regular', notes: '',
  })
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [statusOpen, setStatusOpen] = useState(false)
  const [statusShift, setStatusShift] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [changingStatus, setChangingStatus] = useState(false)

  const loadList = () => {
    setLoading(true)
    hrApi.getShifts()
      .then(res => setList(res.data || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => loadList(), [])

  useEffect(() => {
    if (createOpen || editOpen) {
      Promise.all([usersApi.list(), branchesApi.list()])
        .then(([uRes, bRes]) => {
          setStaff(uRes.data || [])
          setBranches(bRes.data || [])
        })
        .catch(() => { setStaff([]); setBranches([]) })
    }
  }, [createOpen, editOpen])

  const handleCreate = (e) => {
    e.preventDefault()
    if (!form.userId || !form.shiftStartUtc || !form.shiftEndUtc) return
    setCreating(true)
    hrApi.createShift({
      userId: form.userId,
      branchId: form.branchId || null,
      shiftStartUtc: new Date(form.shiftStartUtc).toISOString(),
      shiftEndUtc: new Date(form.shiftEndUtc).toISOString(),
      shiftType: form.shiftType,
      notes: form.notes?.trim() || null,
    })
      .then(() => {
        setCreateOpen(false)
        setForm({ userId: '', branchId: '', shiftStartUtc: '', shiftEndUtc: '', shiftType: 'Regular', notes: '' })
        loadList()
      })
      .catch(() => {})
      .finally(() => setCreating(false))
  }

  const openEdit = (shift) => {
    setEditingId(shift.id)
    setEditForm({
      branchId: shift.branchId || '',
      shiftStartUtc: toLocalInput(shift.shiftStartUtc),
      shiftEndUtc: toLocalInput(shift.shiftEndUtc),
      shiftType: shift.shiftType || 'Regular',
      notes: shift.notes || '',
    })
    setEditOpen(true)
  }

  const handleEdit = (e) => {
    e.preventDefault()
    if (!editingId || !editForm.shiftStartUtc || !editForm.shiftEndUtc) return
    setUpdating(true)
    hrApi.updateShift(editingId, {
      branchId: editForm.branchId || null,
      shiftStartUtc: new Date(editForm.shiftStartUtc).toISOString(),
      shiftEndUtc: new Date(editForm.shiftEndUtc).toISOString(),
      shiftType: editForm.shiftType,
      notes: editForm.notes?.trim() || null,
    })
      .then(() => { setEditOpen(false); setEditingId(null); loadList() })
      .catch(() => {})
      .finally(() => setUpdating(false))
  }

  const handleDelete = (id) => {
    if (!confirm('Delete this shift?')) return
    setDeletingId(id)
    hrApi.deleteShift(id)
      .then(() => loadList())
      .catch(() => {})
      .finally(() => setDeletingId(null))
  }

  const openStatusChange = (shift) => {
    setStatusShift(shift)
    setNewStatus(shift.status || 'Scheduled')
    setStatusOpen(true)
  }

  const handleStatusChange = (e) => {
    e.preventDefault()
    if (!statusShift || !newStatus) return
    setChangingStatus(true)
    hrApi.updateShiftStatus(statusShift.id, newStatus)
      .then(() => { setStatusOpen(false); setStatusShift(null); loadList() })
      .catch(() => {})
      .finally(() => setChangingStatus(false))
  }

  const columns = [
    { key: 'userName', header: 'Staff' },
    { key: 'branchName', header: 'Branch', render: row => row.branchName || '—' },
    { key: 'shiftType', header: 'Type' },
    { key: 'status', header: 'Status', render: row => <Badge>{row.status}</Badge> },
    { key: 'shiftStartUtc', header: 'Start', render: row => formatDate(row.shiftStartUtc) },
    { key: 'shiftEndUtc', header: 'End', render: row => formatDate(row.shiftEndUtc) },
    ...(hasPermission('hr.write') ? [{
      key: 'actions',
      header: '',
      render: row => (
        <span className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); openStatusChange(row) }}>Status</Button>
          <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); openEdit(row) }}>Edit</Button>
          <Button variant="ghost" size="sm" className="text-danger" loading={deletingId === row.id} onClick={e => { e.stopPropagation(); handleDelete(row.id) }}>Delete</Button>
        </span>
      ),
    }] : []),
  ]

  const staffOptions = staff.map(u => ({ value: u.id, label: u.fullName || u.email }))
  const branchOptions = branches.map(b => ({ value: b.id, label: b.name }))

  return (
    <>
      <PageHeader
        title={t('pages.shifts.title')}
        subtitle={t('pages.shifts.subtitle')}
        actions={
          hasPermission('hr.write') && (
            <Button variant="primary" onClick={() => setCreateOpen(true)}>New shift</Button>
          )
        }
      />
      <Card>
        <CardBody className="p-0">
          <Table columns={columns} data={list} loading={loading} emptyMessage="No shifts" emptyIcon="🕐" />
        </CardBody>
      </Card>

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => !creating && setCreateOpen(false)} title="New shift">
        <form onSubmit={handleCreate}>
          <FormField label="Staff" required>
            <Select options={staffOptions} value={form.userId} onChange={v => setForm(f => ({ ...f, userId: v }))} placeholder="Select staff member" />
          </FormField>
          <FormField label="Branch">
            <Select options={branchOptions} value={form.branchId} onChange={v => setForm(f => ({ ...f, branchId: v }))} placeholder="Optional" />
          </FormField>
          <FormField label="Start" required>
            <input type="datetime-local" className="form-control" value={form.shiftStartUtc} onChange={e => setForm(f => ({ ...f, shiftStartUtc: e.target.value }))} />
          </FormField>
          <FormField label="End" required>
            <input type="datetime-local" className="form-control" value={form.shiftEndUtc} onChange={e => setForm(f => ({ ...f, shiftEndUtc: e.target.value }))} />
          </FormField>
          <FormField label="Type">
            <Select options={SHIFT_TYPES} value={form.shiftType} onChange={v => setForm(f => ({ ...f, shiftType: v }))} />
          </FormField>
          <FormField label="Notes">
            <input type="text" className="form-control" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </FormField>
          <div className="modal-footer">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} disabled={creating}>Cancel</Button>
            <Button type="submit" variant="primary" loading={creating} disabled={!form.userId || !form.shiftStartUtc || !form.shiftEndUtc}>Create</Button>
          </div>
        </form>
      </Modal>

      {/* Change Status modal */}
      <Modal open={statusOpen} onClose={() => !changingStatus && setStatusOpen(false)} title="Change shift status">
        <form onSubmit={handleStatusChange}>
          {statusShift && <p className="mb-3"><strong>{statusShift.userName}</strong> — {formatDate(statusShift.shiftStartUtc)}</p>}
          <FormField label="New status" required>
            <Select
              options={[
                { value: 'Scheduled', label: 'Scheduled' },
                { value: 'Confirmed', label: 'Confirmed' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Cancelled', label: 'Cancelled' },
              ]}
              value={newStatus}
              onChange={v => setNewStatus(v)}
            />
          </FormField>
          <div className="modal-footer">
            <Button type="button" variant="ghost" onClick={() => setStatusOpen(false)} disabled={changingStatus}>Cancel</Button>
            <Button type="submit" variant="primary" loading={changingStatus} disabled={!newStatus}>Save</Button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => !updating && setEditOpen(false)} title="Edit shift">
        <form onSubmit={handleEdit}>
          <FormField label="Branch">
            <Select options={branchOptions} value={editForm.branchId} onChange={v => setEditForm(f => ({ ...f, branchId: v }))} placeholder="Optional" />
          </FormField>
          <FormField label="Start" required>
            <input type="datetime-local" className="form-control" value={editForm.shiftStartUtc} onChange={e => setEditForm(f => ({ ...f, shiftStartUtc: e.target.value }))} />
          </FormField>
          <FormField label="End" required>
            <input type="datetime-local" className="form-control" value={editForm.shiftEndUtc} onChange={e => setEditForm(f => ({ ...f, shiftEndUtc: e.target.value }))} />
          </FormField>
          <FormField label="Type">
            <Select options={SHIFT_TYPES} value={editForm.shiftType} onChange={v => setEditForm(f => ({ ...f, shiftType: v }))} />
          </FormField>
          <FormField label="Notes">
            <input type="text" className="form-control" value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
          </FormField>
          <div className="modal-footer">
            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)} disabled={updating}>Cancel</Button>
            <Button type="submit" variant="primary" loading={updating} disabled={!editForm.shiftStartUtc || !editForm.shiftEndUtc}>Save</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
