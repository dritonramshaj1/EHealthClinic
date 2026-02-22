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
import { directoryApi } from '../../api/services/directoryApi.js'
import { branchesApi } from '../../api/services/branchesApi.js'
import { useAuth } from '../../state/AuthContext.jsx'
import { useLang } from '../../state/LanguageContext.jsx'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString()
}

export default function ShiftsPage() {
  const { hasPermission } = useAuth()
  const { t } = useLang()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [doctors, setDoctors] = useState([])
  const [branches, setBranches] = useState([])
  const [form, setForm] = useState({
    userId: '', branchId: '', shiftStartUtc: '', shiftEndUtc: '', shiftType: 'Regular', notes: '',
  })
  const [creating, setCreating] = useState(false)

  const loadList = () => {
    setLoading(true)
    hrApi.getShifts()
      .then(res => setList(res.data || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => loadList(), [])

  useEffect(() => {
    if (createOpen) {
      Promise.all([directoryApi.getDoctors(), branchesApi.list()])
        .then(([dRes, bRes]) => {
          setDoctors(dRes.data || [])
          setBranches(bRes.data || [])
        })
        .catch(() => { setDoctors([]); setBranches([]) })
    }
  }, [createOpen])

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
      .then(() => { setCreateOpen(false); setForm({ userId: '', branchId: '', shiftStartUtc: '', shiftEndUtc: '', shiftType: 'Regular', notes: '' }); loadList() })
      .catch(() => {})
      .finally(() => setCreating(false))
  }

  const columns = [
    { key: 'userName', header: 'Staff' },
    { key: 'branchName', header: 'Branch' },
    { key: 'shiftType', header: 'Type' },
    { key: 'status', header: 'Status', render: row => <Badge>{row.status}</Badge> },
    { key: 'shiftStartUtc', header: 'Start', render: row => formatDate(row.shiftStartUtc) },
    { key: 'shiftEndUtc', header: 'End', render: row => formatDate(row.shiftEndUtc) },
  ]

  const userOptions = doctors.map(d => ({ value: d.userId, label: d.name || d.email }))
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

      <Modal open={createOpen} onClose={() => !creating && setCreateOpen(false)} title="New shift">
        <form onSubmit={handleCreate}>
          <FormField label="Staff (doctor)" required>
            <Select options={userOptions} value={form.userId} onChange={v => setForm(f => ({ ...f, userId: v }))} placeholder="Select" />
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
            <Select options={[{ value: 'Regular', label: 'Regular' }, { value: 'Overtime', label: 'Overtime' }]} value={form.shiftType} onChange={v => setForm(f => ({ ...f, shiftType: v }))} />
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
    </>
  )
}
