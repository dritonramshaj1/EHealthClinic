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
import { invoicesApi } from '../../api/services/invoicesApi.js'
import { useAuth } from '../../state/AuthContext.jsx'

const STATUS_OPTIONS = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Issued', label: 'Issued' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Cancelled', label: 'Cancelled' },
]

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [itemForm, setItemForm] = useState({ description: '', quantity: 1, unitPrice: 0 })
  const [updating, setUpdating] = useState(false)
  const [addingItem, setAddingItem] = useState(false)

  const loadInvoice = () => {
    if (!id || id === 'new') return
    setLoading(true)
    invoicesApi.getById(id)
      .then(res => { setInvoice(res.data); setNewStatus(res.data?.status || '') })
      .catch(() => setInvoice(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => loadInvoice(), [id])

  const handleMarkPaid = () => {
    invoicesApi.markPaid(id).then(() => setInvoice(prev => prev ? { ...prev, status: 'Paid' } : null)).catch(() => {})
  }

  const handleUpdateStatus = (e) => {
    e.preventDefault()
    if (!newStatus) return
    setUpdating(true)
    invoicesApi.updateStatus(id, newStatus)
      .then(() => { setInvoice(prev => prev ? { ...prev, status: newStatus } : null); setStatusModalOpen(false) })
      .finally(() => setUpdating(false))
  }

  const handleAddItem = (e) => {
    e.preventDefault()
    if (!itemForm.description?.trim()) return
    setAddingItem(true)
    invoicesApi.addItem(id, {
      description: itemForm.description.trim(),
      quantity: Math.max(1, parseInt(itemForm.quantity, 10) || 1),
      unitPrice: parseFloat(itemForm.unitPrice) || 0,
    })
      .then(() => {
        setAddItemOpen(false)
        setItemForm({ description: '', quantity: 1, unitPrice: 0 })
        loadInvoice()
      })
      .finally(() => setAddingItem(false))
  }

  if (loading && id !== 'new') return <Spinner center label="Loading invoice..." />
  if (!invoice && id !== 'new') return <p className="text-danger">Invoice not found.</p>

  const itemColumns = [
    { key: 'description', header: 'Description' },
    { key: 'quantity', header: 'Qty' },
    { key: 'unitPrice', header: 'Unit price' },
    { key: 'lineTotal', header: 'Total' },
  ]

  return (
    <>
      <PageHeader
        title={invoice ? `Invoice ${invoice.invoiceNumber}` : 'New invoice'}
        subtitle={invoice?.patientName}
        breadcrumb={[{ label: 'Billing', to: '/billing/invoices' }, { label: invoice?.invoiceNumber || 'Detail' }]}
        actions={
          <>
            <Button variant="ghost" onClick={() => navigate('/billing/invoices')}>Back</Button>
            {hasPermission('billing.write') && invoice?.status !== 'Paid' && invoice?.status !== 'Cancelled' && (
              <>
                <Button variant="secondary" onClick={() => setStatusModalOpen(true)}>Change status</Button>
                {invoice?.status === 'Draft' && <Button variant="secondary" onClick={() => setAddItemOpen(true)}>Add item</Button>}
                {invoice?.status === 'Issued' && <Button variant="primary" onClick={handleMarkPaid}>Mark as paid</Button>}
              </>
            )}
          </>
        }
      />
      {invoice && (
        <>
          <Card className="mb-4">
            <CardHeader title="Summary" />
            <CardBody>
              <p><strong>Status:</strong> <Badge>{invoice.status}</Badge></p>
              <p><strong>Subtotal:</strong> {invoice.subtotal?.toFixed(2)} {invoice.currency}</p>
              <p><strong>Tax:</strong> {invoice.taxAmount?.toFixed(2)}</p>
              <p><strong>Total:</strong> {invoice.totalAmount?.toFixed(2)} {invoice.currency}</p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Line items" />
            <CardBody className="p-0">
              <Table columns={itemColumns} data={invoice.items || []} emptyMessage="No items" />
            </CardBody>
          </Card>
        </>
      )}

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

      <Modal open={addItemOpen} onClose={() => !addingItem && setAddItemOpen(false)} title="Add line item">
        <form onSubmit={handleAddItem}>
          <FormField label="Description" required>
            <input type="text" className="form-control" value={itemForm.description} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))} />
          </FormField>
          <FormField label="Quantity">
            <input type="number" min={1} className="form-control" value={itemForm.quantity} onChange={e => setItemForm(f => ({ ...f, quantity: e.target.value }))} />
          </FormField>
          <FormField label="Unit price">
            <input type="number" step="0.01" min={0} className="form-control" value={itemForm.unitPrice} onChange={e => setItemForm(f => ({ ...f, unitPrice: e.target.value }))} />
          </FormField>
          <div className="modal-footer">
            <Button type="button" variant="ghost" onClick={() => setAddItemOpen(false)} disabled={addingItem}>Cancel</Button>
            <Button type="submit" variant="primary" loading={addingItem} disabled={!itemForm.description?.trim()}>Add</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
