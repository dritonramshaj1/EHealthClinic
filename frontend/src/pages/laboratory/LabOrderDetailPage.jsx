import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Modal from '../../components/ui/Modal.jsx'
import FormField from '../../components/ui/FormField.jsx'
import Select from '../../components/ui/Select.jsx'
import { Card, CardHeader, CardBody } from '../../components/ui/Card.jsx'
import Table from '../../components/ui/Table.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import { labApi } from '../../api/services/labApi.js'
import { useAuth } from '../../state/AuthContext.jsx'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString()
}

const STATUS_OPTIONS = [
  { value: 'Ordered', label: 'Ordered' },
  { value: 'InProgress', label: 'In progress' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
]

export default function LabOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [addResultOpen, setAddResultOpen] = useState(false)
  const [resultForm, setResultForm] = useState({ labOrderTestId: '', value: '', unit: '', referenceRange: '', flag: '', isAbnormal: false, notes: '' })
  const [updating, setUpdating] = useState(false)
  const [addingResult, setAddingResult] = useState(false)

  const loadOrder = () => {
    if (!id) return
    setLoading(true)
    labApi.getOrder(id)
      .then(res => { setOrder(res.data); setNewStatus(res.data?.status || '') })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadOrder() }, [id])

  const handleUpdateStatus = (e) => {
    e.preventDefault()
    if (!newStatus) return
    setUpdating(true)
    labApi.updateOrderStatus(id, newStatus)
      .then(() => { setOrder(o => o ? { ...o, status: newStatus } : null); setStatusModalOpen(false) })
      .finally(() => setUpdating(false))
  }

  const handleAddResult = (e) => {
    e.preventDefault()
    if (!resultForm.labOrderTestId || !resultForm.value?.trim()) return
    setAddingResult(true)
    labApi.addResult(id, {
      labOrderTestId: resultForm.labOrderTestId,
      value: resultForm.value.trim(),
      unit: resultForm.unit?.trim() || null,
      referenceRange: resultForm.referenceRange?.trim() || null,
      flag: resultForm.flag?.trim() || null,
      isAbnormal: resultForm.isAbnormal,
      notes: resultForm.notes?.trim() || null,
    })
      .then(() => {
        setAddResultOpen(false)
        setResultForm({ labOrderTestId: '', value: '', unit: '', referenceRange: '', flag: '', isAbnormal: false, notes: '' })
        loadOrder()
      })
      .finally(() => setAddingResult(false))
  }

  if (loading && !order) return <Spinner center label="Loading order..." />
  if (!order && !loading) return <p className="text-danger">Order not found.</p>

  const resultColumns = [
    { key: 'testName', header: 'Test' },
    { key: 'value', header: 'Value' },
    { key: 'unit', header: 'Unit' },
    { key: 'referenceRange', header: 'Reference' },
    { key: 'flag', header: 'Flag', render: row => row.flag ? <Badge>{row.flag}</Badge> : '—' },
    { key: 'resultAtUtc', header: 'Date', render: row => formatDate(row.resultAtUtc) },
  ]

  const testOptions = (order?.tests || []).map(t => ({ value: t.id, label: `${t.testName}${t.testCode ? ` (${t.testCode})` : ''}` }))

  return (
    <>
      <PageHeader
        title={`Lab order ${order?.id?.slice(0, 8)}…`}
        subtitle={`Patient: ${order?.patientName} • ${order?.status}`}
        breadcrumb={[{ label: 'Laboratory', to: '/laboratory' }, { label: 'Order' }]}
        actions={
          <>
            <Button variant="ghost" onClick={() => navigate('/laboratory')}>Back</Button>
            {hasPermission('lab.write') && order?.status !== 'Cancelled' && (
              <>
                <Button variant="secondary" onClick={() => setStatusModalOpen(true)}>Change status</Button>
                <Button variant="primary" onClick={() => setAddResultOpen(true)} disabled={!(order?.tests?.length)}>Add result</Button>
              </>
            )}
          </>
        }
      />
      <Card className="mb-4">
        <CardHeader title="Order info" />
        <CardBody>
          <p><strong>Patient:</strong> {order?.patientName}</p>
          <p><strong>Doctor:</strong> {order?.doctorName}</p>
          <p><strong>Status:</strong> <Badge>{order?.status}</Badge></p>
          <p><strong>Priority:</strong> {order?.priority}</p>
          {order?.notes && <p><strong>Notes:</strong> {order.notes}</p>}
          <p><strong>Ordered:</strong> {formatDate(order?.orderedAtUtc)}</p>
        </CardBody>
      </Card>
      <Card className="mb-4">
        <CardHeader title="Tests" />
        <CardBody className="p-0">
          <ul className="list-unstyled p-3">
            {(order?.tests || []).map(t => (
              <li key={t.id}><Badge variant="secondary">{t.status}</Badge> {t.testName} {t.testCode && `(${t.testCode})`} {t.specimenType && `— ${t.specimenType}`}</li>
            ))}
            {!(order?.tests?.length) && <li className="text-muted">No tests</li>}
          </ul>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Results" />
        <CardBody className="p-0">
          <Table
            columns={resultColumns}
            data={order?.results || []}
            emptyMessage="No results yet"
          />
        </CardBody>
      </Card>

      <Modal open={statusModalOpen} onClose={() => !updating && setStatusModalOpen(false)} title="Change status">
        <form onSubmit={handleUpdateStatus}>
          <FormField label="Status">
            <Select options={STATUS_OPTIONS} value={newStatus} onChange={setNewStatus} />
          </FormField>
          <div className="modal-footer">
            <Button type="button" variant="ghost" onClick={() => setStatusModalOpen(false)} disabled={updating}>Cancel</Button>
            <Button type="submit" variant="primary" loading={updating}>Update</Button>
          </div>
        </form>
      </Modal>

      <Modal open={addResultOpen} onClose={() => !addingResult && setAddResultOpen(false)} title="Add result">
        <form onSubmit={handleAddResult}>
          <FormField label="Test" required>
            <Select options={testOptions} value={resultForm.labOrderTestId} onChange={v => setResultForm(f => ({ ...f, labOrderTestId: v }))} placeholder="Select test" />
          </FormField>
          <FormField label="Value" required>
            <input type="text" className="form-control" value={resultForm.value} onChange={e => setResultForm(f => ({ ...f, value: e.target.value }))} placeholder="Result value" />
          </FormField>
          <FormField label="Unit">
            <input type="text" className="form-control" value={resultForm.unit} onChange={e => setResultForm(f => ({ ...f, unit: e.target.value }))} placeholder="e.g. mg/dL" />
          </FormField>
          <FormField label="Reference range">
            <input type="text" className="form-control" value={resultForm.referenceRange} onChange={e => setResultForm(f => ({ ...f, referenceRange: e.target.value }))} placeholder="e.g. 70-100" />
          </FormField>
          <FormField label="Flag">
            <input type="text" className="form-control" value={resultForm.flag} onChange={e => setResultForm(f => ({ ...f, flag: e.target.value }))} placeholder="H/L/N" />
          </FormField>
          <FormField label="Abnormal">
            <label><input type="checkbox" checked={resultForm.isAbnormal} onChange={e => setResultForm(f => ({ ...f, isAbnormal: e.target.checked }))} /> Mark as abnormal</label>
          </FormField>
          <FormField label="Notes">
            <input type="text" className="form-control" value={resultForm.notes} onChange={e => setResultForm(f => ({ ...f, notes: e.target.value }))} />
          </FormField>
          <div className="modal-footer">
            <Button type="button" variant="ghost" onClick={() => setAddResultOpen(false)} disabled={addingResult}>Cancel</Button>
            <Button type="submit" variant="primary" loading={addingResult} disabled={!resultForm.labOrderTestId || !resultForm.value?.trim()}>Add</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
