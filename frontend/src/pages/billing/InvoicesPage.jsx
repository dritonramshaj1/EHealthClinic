import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Modal from '../../components/ui/Modal.jsx'
import FormField from '../../components/ui/FormField.jsx'
import Select from '../../components/ui/Select.jsx'
import { Card, CardBody } from '../../components/ui/Card.jsx'
import ExportDropdown from '../../components/ui/ExportDropdown.jsx'
import { invoicesApi } from '../../api/services/invoicesApi.js'
import { directoryApi } from '../../api/services/directoryApi.js'
import { useAuth } from '../../state/AuthContext.jsx'
import { useLang } from '../../state/LanguageContext.jsx'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString()
}

const defaultItem = () => ({ description: '', quantity: 1, unitPrice: 0 })

export default function InvoicesPage() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const { t } = useLang()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [patients, setPatients] = useState([])
  const [form, setForm] = useState({
    patientId: '',
    appointmentId: '',
    taxAmount: 0,
    notes: '',
    dueAtUtc: '',
    items: [defaultItem()],
  })
  const [creating, setCreating] = useState(false)

  const loadList = () => {
    setLoading(true)
    const params = statusFilter ? { status: statusFilter } : {}
    invoicesApi.list(params)
      .then(res => setList(res.data || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadList() }, [statusFilter])

  useEffect(() => {
    if (createOpen) directoryApi.getPatients().then(r => setPatients(r.data || [])).catch(() => setPatients([]))
  }, [createOpen])

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, defaultItem()] }))
  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))
  const updateItem = (idx, field, value) => setForm(f => ({
    ...f,
    items: f.items.map((it, i) => i === idx ? { ...it, [field]: value } : it),
  }))

  const handleCreate = (e) => {
    e.preventDefault()
    if (!form.patientId) return
    const items = form.items
      .filter(it => it.description?.trim())
      .map(it => ({
        description: it.description.trim(),
        quantity: Math.max(1, parseInt(it.quantity, 10) || 1),
        unitPrice: parseFloat(it.unitPrice) || 0,
      }))
    setCreating(true)
    invoicesApi.create({
      patientId: form.patientId,
      appointmentId: form.appointmentId || null,
      taxAmount: parseFloat(form.taxAmount) || 0,
      notes: form.notes?.trim() || null,
      dueAtUtc: form.dueAtUtc ? new Date(form.dueAtUtc).toISOString() : null,
      items: items.length ? items : null,
    })
      .then(res => {
        setCreateOpen(false)
        setForm({ patientId: '', appointmentId: '', taxAmount: 0, notes: '', dueAtUtc: '', items: [defaultItem()] })
        const id = res.data?.id
        if (id) navigate(`/billing/invoices/${id}`)
        else loadList()
      })
      .catch(() => {})
      .finally(() => setCreating(false))
  }

  const columns = [
    { key: 'invoiceNumber', header: 'Number' },
    { key: 'patientName', header: 'Patient' },
    { key: 'totalAmount', header: 'Total', render: row => `${row.totalAmount?.toFixed(2) ?? '0'} ${row.currency || 'EUR'}` },
    { key: 'status', header: 'Status', render: row => <Badge>{row.status}</Badge> },
    { key: 'issuedAtUtc', header: 'Issued', render: row => formatDate(row.issuedAtUtc) },
  ]

  const patientOptions = patients.map(p => ({ value: p.id, label: p.name || p.email }))

  return (
    <>
      <PageHeader
        title={t('pages.invoices.title')}
        subtitle={t('pages.invoices.subtitle')}
        actions={
          <div className="d-flex gap-2 align-items-center flex-wrap">
            {hasPermission('billing.read') && (
              <ExportDropdown resource="invoices" params={statusFilter ? { status: statusFilter } : {}} />
            )}
            {hasPermission('billing.write') && (
              <Button variant="primary" onClick={() => setCreateOpen(true)}>New Invoice</Button>
            )}
          </div>
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
            <option value="Draft">Draft</option>
            <option value="Issued">Issued</option>
            <option value="Paid">Paid</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <CardBody className="p-0">
          <Table
            columns={columns}
            data={list}
            loading={loading}
            emptyMessage="No invoices found"
            emptyIcon="🧾"
            onRowClick={row => navigate(`/billing/invoices/${row.id}`)}
          />
        </CardBody>
      </Card>

      <Modal open={createOpen} onClose={() => !creating && setCreateOpen(false)} title="New invoice" size="lg">
        <form onSubmit={handleCreate}>
          <FormField label="Patient" required>
            <Select options={patientOptions} value={form.patientId} onChange={v => setForm(f => ({ ...f, patientId: v }))} placeholder="Select patient" />
          </FormField>
          <FormField label="Tax amount">
            <input type="number" step="0.01" min={0} className="form-control" value={form.taxAmount} onChange={e => setForm(f => ({ ...f, taxAmount: e.target.value }))} />
          </FormField>
          <FormField label="Due date">
            <input type="datetime-local" className="form-control" value={form.dueAtUtc} onChange={e => setForm(f => ({ ...f, dueAtUtc: e.target.value }))} />
          </FormField>
          <FormField label="Notes">
            <input type="text" className="form-control" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </FormField>
          <h5 className="mt-3">Line items</h5>
          {form.items.map((it, idx) => (
            <div key={idx} className="border rounded p-2 mb-2 grid grid-3 gap-2">
              <input type="text" className="form-control" placeholder="Description" value={it.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
              <input type="number" min={1} className="form-control" placeholder="Qty" value={it.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
              <input type="number" step="0.01" min={0} className="form-control" placeholder="Unit price" value={it.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} />
              <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(idx)} disabled={form.items.length <= 1}>Remove</Button>
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={addItem}>Add line</Button>
          <div className="modal-footer mt-4">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} disabled={creating}>Cancel</Button>
            <Button type="submit" variant="primary" loading={creating} disabled={!form.patientId}>Create</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
