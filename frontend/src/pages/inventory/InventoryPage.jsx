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
import { inventoryApi } from '../../api/services/inventoryApi.js'
import { branchesApi } from '../../api/services/branchesApi.js'
import { useAuth } from '../../state/AuthContext.jsx'
import { useLang } from '../../state/LanguageContext.jsx'

export default function InventoryPage() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const { t } = useLang()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [branches, setBranches] = useState([])
  const [form, setForm] = useState({
    name: '', description: '', category: 'General', sku: '', reorderLevel: 0, unitCost: '', unit: 'pcs', branchId: '', expiresAtUtc: '',
  })
  const [creating, setCreating] = useState(false)

  const loadList = () => {
    setLoading(true)
    inventoryApi.list({ lowStockOnly })
      .then(res => setList(res.data || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => loadList(), [lowStockOnly])

  useEffect(() => {
    if (createOpen) branchesApi.list().then(r => setBranches(r.data || [])).catch(() => setBranches([]))
  }, [createOpen])

  const handleCreate = (e) => {
    e.preventDefault()
    if (!form.name?.trim()) return
    setCreating(true)
    inventoryApi.create({
      name: form.name.trim(),
      description: form.description?.trim() || null,
      category: form.category?.trim() || 'General',
      sku: form.sku?.trim() || null,
      reorderLevel: parseInt(form.reorderLevel, 10) || 0,
      unitCost: form.unitCost !== '' ? parseFloat(form.unitCost) : null,
      unit: form.unit?.trim() || 'pcs',
      branchId: form.branchId || null,
      expiresAtUtc: form.expiresAtUtc ? new Date(form.expiresAtUtc).toISOString() : null,
    })
      .then(() => { setCreateOpen(false); setForm({ name: '', description: '', category: 'General', sku: '', reorderLevel: 0, unitCost: '', unit: 'pcs', branchId: '', expiresAtUtc: '' }); loadList() })
      .catch(() => {})
      .finally(() => setCreating(false))
  }

  const columns = [
    { key: 'name', header: 'Item' },
    { key: 'category', header: 'Category' },
    { key: 'sku', header: 'SKU' },
    { key: 'quantityOnHand', header: 'Qty' },
    { key: 'reorderLevel', header: 'Reorder at' },
    { key: 'isLowStock', header: 'Alert', render: row => row.isLowStock ? <Badge variant="danger">Low</Badge> : '—' },
  ]

  const branchOptions = branches.map(b => ({ value: b.id, label: b.name }))

  return (
    <>
      <PageHeader
        title={t('pages.inventory.title')}
        subtitle={t('pages.inventory.subtitle')}
        actions={
          hasPermission('inventory.write') && (
            <Button variant="primary" onClick={() => setCreateOpen(true)}>Add item</Button>
          )
        }
      />
      <Card>
        <div className="filter-bar">
          <label className="d-flex items-center gap-2">
            <input type="checkbox" checked={lowStockOnly} onChange={e => setLowStockOnly(e.target.checked)} />
            <span className="text-sm">Low stock only</span>
          </label>
        </div>
        <CardBody className="p-0">
          <Table
            columns={columns}
            data={list}
            loading={loading}
            emptyMessage="No inventory items"
            emptyIcon="📦"
            onRowClick={row => navigate(`/inventory/${row.id}`)}
          />
        </CardBody>
      </Card>

      <Modal open={createOpen} onClose={() => !creating && setCreateOpen(false)} title="Add inventory item" size="lg">
        <form onSubmit={handleCreate}>
          <FormField label="Name" required>
            <input type="text" className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </FormField>
          <FormField label="Description">
            <input type="text" className="form-control" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </FormField>
          <FormField label="Category">
            <input type="text" className="form-control" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. General" />
          </FormField>
          <FormField label="SKU">
            <input type="text" className="form-control" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
          </FormField>
          <div className="grid grid-2 gap-2">
            <FormField label="Reorder level">
              <input type="number" min={0} className="form-control" value={form.reorderLevel} onChange={e => setForm(f => ({ ...f, reorderLevel: e.target.value }))} />
            </FormField>
            <FormField label="Unit">
              <input type="text" className="form-control" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="pcs" />
            </FormField>
            <FormField label="Unit cost">
              <input type="number" step="0.01" min={0} className="form-control" value={form.unitCost} onChange={e => setForm(f => ({ ...f, unitCost: e.target.value }))} />
            </FormField>
            <FormField label="Branch">
              <Select options={branchOptions} value={form.branchId} onChange={v => setForm(f => ({ ...f, branchId: v }))} placeholder="Optional" />
            </FormField>
          </div>
          <FormField label="Expires">
            <input type="datetime-local" className="form-control" value={form.expiresAtUtc} onChange={e => setForm(f => ({ ...f, expiresAtUtc: e.target.value }))} />
          </FormField>
          <div className="modal-footer mt-3">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} disabled={creating}>Cancel</Button>
            <Button type="submit" variant="primary" loading={creating} disabled={!form.name?.trim()}>Create</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
