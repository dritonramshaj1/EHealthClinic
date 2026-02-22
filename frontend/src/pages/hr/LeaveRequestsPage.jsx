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
import { useAuth } from '../../state/AuthContext.jsx'
import { useLang } from '../../state/LanguageContext.jsx'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString()
}

export default function LeaveRequestsPage() {
  const { user, hasPermission } = useAuth()
  const { t } = useLang()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ leaveType: 'Annual', startDate: '', endDate: '', reason: '' })
  const [creating, setCreating] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewClaim, setReviewClaim] = useState(null)
  const [reviewStatus, setReviewStatus] = useState('Approved')
  const [reviewNote, setReviewNote] = useState('')
  const [reviewing, setReviewing] = useState(false)

  const loadList = () => {
    setLoading(true)
    hrApi.getLeaveRequests(statusFilter ? { status: statusFilter } : {})
      .then(res => setList(res.data || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => loadList(), [statusFilter])

  const handleCreate = (e) => {
    e.preventDefault()
    if (!user?.id || !form.startDate || !form.endDate) return
    setCreating(true)
    hrApi.createLeaveRequest({
      userId: user.id,
      leaveType: form.leaveType,
      startDate: form.startDate,
      endDate: form.endDate,
      reason: form.reason?.trim() || null,
    })
      .then(() => { setCreateOpen(false); setForm({ leaveType: 'Annual', startDate: '', endDate: '', reason: '' }); loadList() })
      .catch(() => {})
      .finally(() => setCreating(false))
  }

  const openReview = (row, status) => {
    setReviewClaim(row)
    setReviewStatus(status)
    setReviewNote('')
    setReviewOpen(true)
  }

  const handleReview = (e) => {
    e.preventDefault()
    if (!reviewClaim) return
    setReviewing(true)
    hrApi.reviewLeaveRequest(reviewClaim.id, { status: reviewStatus, reviewerNote: reviewNote?.trim() || null })
      .then(() => { setReviewOpen(false); setReviewClaim(null); loadList() })
      .finally(() => setReviewing(false))
  }

  const columns = [
    { key: 'userName', header: 'Employee' },
    { key: 'leaveType', header: 'Type' },
    { key: 'startDate', header: 'From', render: row => formatDate(row.startDate) },
    { key: 'endDate', header: 'To', render: row => formatDate(row.endDate) },
    { key: 'status', header: 'Status', render: row => <Badge>{row.status}</Badge> },
    {
      key: 'actions',
      header: 'Actions',
      render: row => row.status === 'Pending' && hasPermission('hr.write') ? (
        <span className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => openReview(row, 'Approved')}>Approve</Button>
          <Button variant="ghost" size="sm" className="text-danger" onClick={() => openReview(row, 'Rejected')}>Reject</Button>
        </span>
      ) : '—',
    },
  ]

  return (
    <>
      <PageHeader
        title={t('pages.leaveRequests.title')}
        subtitle={t('pages.leaveRequests.subtitle')}
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>Request leave</Button>
        }
      />
      <div className="mb-3">
        <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 160 }}>
          <option value="">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>
      <Card>
        <CardBody className="p-0">
          <Table columns={columns} data={list} loading={loading} emptyMessage="No leave requests" emptyIcon="🏖️" />
        </CardBody>
      </Card>

      <Modal open={createOpen} onClose={() => !creating && setCreateOpen(false)} title="Request leave">
        <form onSubmit={handleCreate}>
          <FormField label="Type">
            <Select options={[{ value: 'Annual', label: 'Annual' }, { value: 'Sick', label: 'Sick' }, { value: 'Unpaid', label: 'Unpaid' }]} value={form.leaveType} onChange={v => setForm(f => ({ ...f, leaveType: v }))} />
          </FormField>
          <FormField label="Start date" required>
            <input type="date" className="form-control" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
          </FormField>
          <FormField label="End date" required>
            <input type="date" className="form-control" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
          </FormField>
          <FormField label="Reason">
            <input type="text" className="form-control" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
          </FormField>
          <div className="modal-footer">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} disabled={creating}>Cancel</Button>
            <Button type="submit" variant="primary" loading={creating} disabled={!form.startDate || !form.endDate}>Submit</Button>
          </div>
        </form>
      </Modal>

      <Modal open={reviewOpen} onClose={() => !reviewing && setReviewOpen(false)} title={reviewStatus === 'Approved' ? 'Approve leave' : 'Reject leave'}>
        <form onSubmit={handleReview}>
          {reviewClaim && <p><strong>{reviewClaim.userName}</strong> — {reviewClaim.leaveType} ({formatDate(reviewClaim.startDate)} – {formatDate(reviewClaim.endDate)})</p>}
          <FormField label="Note">
            <input type="text" className="form-control" value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="Optional" />
          </FormField>
          <div className="modal-footer">
            <Button type="button" variant="ghost" onClick={() => setReviewOpen(false)} disabled={reviewing}>Cancel</Button>
            <Button type="submit" variant="primary" loading={reviewing}>{reviewStatus === 'Approved' ? 'Approve' : 'Reject'}</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
