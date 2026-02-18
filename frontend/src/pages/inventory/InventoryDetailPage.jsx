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
import { inventoryApi } from '../../api/services/inventoryApi.js'
import { useAuth } from '../../state/AuthContext.jsx'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString()
}

export default function InventoryDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [item, setItem] = useState(null)
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [movementOpen, setMovementOpen] = useState(false)
  const [movementForm, setMovementForm] = useState({ movementType: 'In', quantity: 1, reason: '' })
  const [adding, setAdding] = useState(false)

  const load = () => {
    if (!id) return
    setLoading(true)
    Promise.all([inventoryApi.getById(id), inventoryApi.getMovements(id)])
      .then(([resItem, resMov]) => {
        setItem(resItem.data)
        setMovements(resMov.data || [])
      })
      .catch(() => { setItem(null); setMovements([]) })
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), [id])

  const handleAddMovement = (e) => {
    e.preventDefault()
    if (!movementForm.quantity || movementForm.quantity < 1) return
    setAdding(true)
    inventoryApi.addMovement(id, {
      movementType: movementForm.movementType,
      quantity: parseInt(movementForm.quantity, 10),
      reason: movementForm.reason?.trim() || null,
      referenceId: null,
    })
      .then(() => { setMovementOpen(false); setMovementForm({ movementType: 'In', quantity: 1, reason: '' }); load() })
      .finally(() => setAdding(false))
  }

  if (loading && !item) return <Spinner center label="Loading..." />
  if (!item) return <p className="text-danger">Item not found.</p>

  const movementColumns = [
    { key: 'movementType', header: 'Type' },
    { key: 'quantity', header: 'Qty' },
    { key: 'quantityAfter', header: 'Qty after' },
    { key: 'reason', header: 'Reason', render: row => row.reason || '—' },
    { key: 'createdAtUtc', header: 'Date', render: row => formatDate(row.createdAtUtc) },
  ]

  return (
    <>
      <PageHeader
        title={item.name}
        subtitle={item.category}
        actions={
          <>
            <Button variant="ghost" onClick={() => navigate('/inventory')}>Back</Button>
            {hasPermission('inventory.write') && (
              <Button variant="primary" onClick={() => setMovementOpen(true)}>Add movement</Button>
            )}
          </>
        }
      />
      <Card className="mb-4">
        <CardHeader title="Item" />
        <CardBody>
          <p><strong>Name:</strong> {item.name}</p>
          <p><strong>Category:</strong> {item.category}</p>
          {item.description && <p><strong>Description:</strong> {item.description}</p>}
          <p><strong>SKU:</strong> {item.sku || '—'}</p>
          <p><strong>Quantity on hand:</strong> {item.quantityOnHand} {item.unit}</p>
          <p><strong>Reorder level:</strong> {item.reorderLevel}</p>
          {item.isLowStock && <Badge variant="danger">Low stock</Badge>}
          {item.unitCost != null && <p><strong>Unit cost:</strong> {item.unitCost}</p>}
          {item.branchName && <p><strong>Branch:</strong> {item.branchName}</p>}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Movements" />
        <CardBody className="p-0">
          <Table columns={movementColumns} data={movements} emptyMessage="No movements" />
        </CardBody>
      </Card>

      <Modal open={movementOpen} onClose={() => !adding && setMovementOpen(false)} title="Add movement">
        <form onSubmit={handleAddMovement}>
          <FormField label="Type">
            <Select
              options={[{ value: 'In', label: 'In' }, { value: 'Out', label: 'Out' }, { value: 'Adjustment', label: 'Adjustment' }]}
              value={movementForm.movementType}
              onChange={v => setMovementForm(f => ({ ...f, movementType: v }))}
            />
          </FormField>
          <FormField label="Quantity" required>
            <input type="number" min={1} className="form-control" value={movementForm.quantity} onChange={e => setMovementForm(f => ({ ...f, quantity: e.target.value }))} />
          </FormField>
          <FormField label="Reason">
            <input type="text" className="form-control" value={movementForm.reason} onChange={e => setMovementForm(f => ({ ...f, reason: e.target.value }))} placeholder="Optional" />
          </FormField>
          <div className="modal-footer">
            <Button type="button" variant="ghost" onClick={() => setMovementOpen(false)} disabled={adding}>Cancel</Button>
            <Button type="submit" variant="primary" loading={adding}>Add</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
