import { useState, useEffect } from 'react'
import PageHeader from '../../components/layout/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Modal from '../../components/ui/Modal.jsx'
import FormField from '../../components/ui/FormField.jsx'
import Select from '../../components/ui/Select.jsx'
import { Card, CardBody } from '../../components/ui/Card.jsx'
import { insuranceApi } from '../../api/services/insuranceApi.js'
import { invoicesApi } from '../../api/services/invoicesApi.js'
import { useAuth } from '../../state/AuthContext.jsx'
import { useLang } from '../../state/LanguageContext.jsx'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString()
}

export default function InsurancePage() {
  const { hasPermission } = useAuth()
  const { t } = useLang()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [invoices, setInvoices] = useState([])
  const [form, setForm] = useState({ invoiceId: '', patientId: '', insuranceCompany: '', policyNumber: '', claimAmount: '' })
  const [creating, setCreating] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewClaim, setReviewClaim] = useState(null)
  const [reviewAction, setReviewAction] = useState('') // 'Approved' | 'Rejected'
  const [reviewApprovedAmount, setReviewApprovedAmount] = useState('')
  const [reviewReferenceNumber, setReviewReferenceNumber] = useState('')
  const [reviewRejectionReason, setReviewRejectionReason] = useState('')
  const [reviewing, setReviewing] = useState(false)

  const loadList = () => {
    setLoading(true)
    const params = statusFilter ? { status: statusFilter } : {}
    insuranceApi.list(params)
      .then(res => setList(res.data || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => loadList(), [statusFilter])

  useEffect(() => {
    if (createOpen) {
      // Load all non-cancelled invoices so user can create a claim (Draft/Issued)
      invoicesApi.list().then(r => {
        const all = r.data || []
        setInvoices(all.filter(inv => inv.status !== 'Cancelled'))
      }).catch(() => setInvoices([]))
      setForm({ invoiceId: '', patientId: '', insuranceCompany: '', policyNumber: '', claimAmount: '' })
    }
  }, [createOpen])

  const onSelectInvoice = (invoiceId) => {
    const inv = invoices.find(i => i.id === invoiceId)
    setForm(f => ({
      ...f,
      invoiceId: invoiceId || '',
      patientId: inv?.patientId ?? '',
      claimAmount: inv?.totalAmount ?? '',
    }))
  }

  const handleCreate = (e) => {
    e.preventDefault()
    if (!form.invoiceId || !form.patientId || !form.insuranceCompany?.trim() || !form.policyNumber?.trim()) return
    setCreating(true)
    insuranceApi.create({
      invoiceId: form.invoiceId,
      patientId: form.patientId,
      insuranceCompany: form.insuranceCompany.trim(),
      policyNumber: form.policyNumber.trim(),
      claimAmount: parseFloat(form.claimAmount) || 0,
    })
      .then(() => { setCreateOpen(false); loadList() })
      .catch(() => {})
      .finally(() => setCreating(false))
  }

  const openReview = (claim, action) => {
    setReviewClaim(claim)
    setReviewAction(action)
    setReviewApprovedAmount(claim?.claimAmount ?? '')
    setReviewReferenceNumber('')
    setReviewRejectionReason('')
    setReviewOpen(true)
  }

  const handleReview = (e) => {
    e.preventDefault()
    if (!reviewClaim) return
    setReviewing(true)
    const payload = reviewAction === 'Approved'
      ? { status: 'Approved', approvedAmount: parseFloat(reviewApprovedAmount) || null, referenceNumber: reviewReferenceNumber?.trim() || null, rejectionReason: null }
      : { status: 'Rejected', approvedAmount: null, referenceNumber: null, rejectionReason: reviewRejectionReason?.trim() || null }
    insuranceApi.updateStatus(reviewClaim.id, payload)
      .then(() => { setReviewOpen(false); setReviewClaim(null); loadList() })
      .finally(() => setReviewing(false))
  }

  const columns = [
    { key: 'patientName', header: 'Patient' },
    { key: 'insuranceCompany', header: 'Company' },
    { key: 'policyNumber', header: 'Policy' },
    { key: 'claimAmount', header: 'Claim', render: row => `${row.claimAmount?.toFixed(2) ?? '0'}` },
    { key: 'status', header: 'Status', render: row => <Badge>{row.status}</Badge> },
    { key: 'submittedAtUtc', header: 'Submitted', render: row => formatDate(row.submittedAtUtc) },
    {
      key: 'actions',
      header: 'Actions',
      render: row => row.status === 'Submitted' && hasPermission('insurance.write') ? (
        <span className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => openReview(row, 'Approved')}>Approve</Button>
          <Button variant="ghost" size="sm" className="text-danger" onClick={() => openReview(row, 'Rejected')}>Reject</Button>
        </span>
      ) : '—',
    },
  ]

  const invoiceOptions = invoices.map(i => ({
    value: i.id,
    label: `${i.invoiceNumber} — ${i.patientName} (${i.totalAmount?.toFixed(2)} ${i.currency || 'EUR'})`,
  }))

  return (
    <>
      <PageHeader
        title={t('pages.insurance.title')}
        subtitle={t('pages.insurance.subtitle')}
        actions={
          hasPermission('insurance.write') && (
            <Button variant="primary" onClick={() => setCreateOpen(true)}>New claim</Button>
          )
        }
      />
      <Card>
        <div className="filter-bar">
          <select
            className="form-control"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ maxWidth: 180 }}
          >
            <option value="">All statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
        <CardBody className="p-0">
          <Table
            columns={columns}
            data={list}
            loading={loading}
            emptyMessage="No insurance claims found"
            emptyIcon="🛡️"
          />
        </CardBody>
      </Card>

      <Modal open={createOpen} onClose={() => !creating && setCreateOpen(false)} title="New insurance claim">
        <form onSubmit={handleCreate}>
          <FormField label="Invoice" required>
            <Select options={invoiceOptions} value={form.invoiceId} onChange={v => onSelectInvoice(v)} placeholder="Select invoice" />
          </FormField>
          <FormField label="Insurance company" required>
            <input type="text" className="form-control" value={form.insuranceCompany} onChange={e => setForm(f => ({ ...f, insuranceCompany: e.target.value }))} />
          </FormField>
          <FormField label="Policy number" required>
            <input type="text" className="form-control" value={form.policyNumber} onChange={e => setForm(f => ({ ...f, policyNumber: e.target.value }))} />
          </FormField>
          <FormField label="Claim amount">
            <input type="number" step="0.01" min={0} className="form-control" value={form.claimAmount} onChange={e => setForm(f => ({ ...f, claimAmount: e.target.value }))} />
          </FormField>
          <div className="modal-footer">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} disabled={creating}>Cancel</Button>
            <Button type="submit" variant="primary" loading={creating} disabled={!form.invoiceId || !form.patientId || !form.insuranceCompany?.trim() || !form.policyNumber?.trim()}>Create</Button>
          </div>
        </form>
      </Modal>

      <Modal open={reviewOpen} onClose={() => !reviewing && setReviewOpen(false)} title={reviewAction === 'Approved' ? 'Approve claim' : 'Reject claim'}>
        <form onSubmit={handleReview}>
          {reviewClaim && <p><strong>{reviewClaim.insuranceCompany}</strong> — {reviewClaim.claimAmount?.toFixed(2)}</p>}
          {reviewAction === 'Approved' && (
            <>
              <FormField label="Approved amount">
                <input type="number" step="0.01" className="form-control" value={reviewApprovedAmount} onChange={e => setReviewApprovedAmount(e.target.value)} />
              </FormField>
              <FormField label="Reference number">
                <input type="text" className="form-control" value={reviewReferenceNumber} onChange={e => setReviewReferenceNumber(e.target.value)} placeholder="Optional" />
              </FormField>
            </>
          )}
          {reviewAction === 'Rejected' && (
            <FormField label="Rejection reason">
              <input type="text" className="form-control" value={reviewRejectionReason} onChange={e => setReviewRejectionReason(e.target.value)} placeholder="Reason" />
            </FormField>
          )}
          <div className="modal-footer">
            <Button type="button" variant="ghost" onClick={() => setReviewOpen(false)} disabled={reviewing}>Cancel</Button>
            <Button type="submit" variant="primary" loading={reviewing}>{reviewAction === 'Approved' ? 'Approve' : 'Reject'}</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
