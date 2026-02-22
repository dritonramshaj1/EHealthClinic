import { useState, useEffect } from 'react'
import PageHeader from '../../components/layout/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Modal from '../../components/ui/Modal.jsx'
import FormField from '../../components/ui/FormField.jsx'
import Select from '../../components/ui/Select.jsx'
import { Card, CardHeader, CardBody } from '../../components/ui/Card.jsx'
import { queueApi } from '../../api/services/queueApi.js'
import { branchesApi } from '../../api/services/branchesApi.js'
import { directoryApi } from '../../api/services/directoryApi.js'
import { useAuth } from '../../state/AuthContext.jsx'
import { useUI } from '../../state/UIContext.jsx'
import { useLang } from '../../state/LanguageContext.jsx'

const POLL_MS = 30000

export default function QueuePage() {
  const { hasPermission } = useAuth()
  const { activeBranchId } = useUI()
  const { t } = useLang()
  const [branches, setBranches] = useState([])
  const [branchId, setBranchId] = useState(activeBranchId || '')
  const [entries, setEntries] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [patients, setPatients] = useState([])
  const [addForm, setAddForm] = useState({ patientId: '', priority: 'Normal', notes: '' })
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (addOpen) directoryApi.getPatients().then(r => setPatients(r.data || [])).catch(() => setPatients([]))
  }, [addOpen])

  const handleAddToQueue = (e) => {
    e.preventDefault()
    if (!branchId || !addForm.patientId) return
    setAdding(true)
    queueApi.add({
      branchId,
      patientId: addForm.patientId,
      appointmentId: null,
      priority: addForm.priority,
      notes: addForm.notes || null,
    })
      .then(() => { setAddOpen(false); setAddForm({ patientId: '', priority: 'Normal', notes: '' }); loadQueue() })
      .catch(() => {})
      .finally(() => setAdding(false))
  }

  const loadBranches = () => {
    branchesApi.list()
      .then(res => {
        const list = res.data || []
        setBranches(list)
        if (!branchId && list.length) setBranchId(list[0].id)
      })
      .catch(() => setBranches([]))
  }

  const loadQueue = () => {
    if (!branchId) { setLoading(false); return }
    setLoading(true)
    Promise.all([queueApi.getQueue(branchId), queueApi.getStats(branchId)])
      .then(([queueRes, statsRes]) => {
        setEntries(queueRes.data || [])
        setStats(statsRes.data)
      })
      .catch(() => { setEntries([]); setStats(null) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadBranches() }, [])
  useEffect(() => { loadQueue() }, [branchId])
  useEffect(() => {
    if (!branchId) return
    const t = setInterval(loadQueue, POLL_MS)
    return () => clearInterval(t)
  }, [branchId])

  const handleCall = (id) => {
    queueApi.updateStatus(id, 'Called').then(loadQueue).catch(() => {})
  }
  const handleDone = (id) => {
    queueApi.updateStatus(id, 'Done').then(loadQueue).catch(() => {})
  }
  const handleSkip = (id) => {
    queueApi.updateStatus(id, 'Skipped').then(loadQueue).catch(() => {})
  }

  const waiting = entries.filter(e => e.status === 'Waiting')
  const inProgress = entries.filter(e => e.status === 'Called' || e.status === 'InProgress')

  return (
    <>
      <PageHeader
        title={t('pages.queue.title')}
        subtitle={t('pages.queue.subtitle')}
        actions={
          <>
            <select
              className="form-control"
              value={branchId}
              onChange={e => setBranchId(e.target.value)}
              style={{ width: 220 }}
            >
              <option value="">Select branch</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {hasPermission('queue.write') && branchId && (
              <Button variant="primary" onClick={() => setAddOpen(true)}>Add to queue</Button>
            )}
          </>
        }
      />

      {stats && (
        <div className="d-flex gap-4 mb-6 flex-wrap">
          <div className="stat-card"><span className="stat-card-label">Waiting</span><div className="stat-card-value">{stats.waiting ?? waiting.length}</div></div>
          <div className="stat-card"><span className="stat-card-label">In progress</span><div className="stat-card-value">{stats.inProgress ?? inProgress.length}</div></div>
          <div className="stat-card"><span className="stat-card-label">Done today</span><div className="stat-card-value">{stats.done ?? 0}</div></div>
        </div>
      )}

      <div className="d-grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        <Card>
          <CardHeader title="Waiting" subtitle={`${waiting.length} patients`} />
          <CardBody>
            {loading && !entries.length ? (
              <p className="text-muted">Loading...</p>
            ) : waiting.length === 0 ? (
              <p className="text-muted">No one waiting</p>
            ) : (
              <ul className="p-0" style={{ listStyle: 'none' }}>
                {waiting.map(e => (
                  <li key={e.id} className="d-flex items-center justify-between py-2 border-bottom">
                    <span><strong>#{e.queueNumber}</strong> {e.patientName}</span>
                    {hasPermission('queue.write') && (
                      <Button size="sm" variant="primary" onClick={() => handleCall(e.id)}>Call</Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="In progress" />
          <CardBody>
            {inProgress.length === 0 ? (
              <p className="text-muted">None</p>
            ) : (
              <ul className="p-0" style={{ listStyle: 'none' }}>
                {inProgress.map(e => (
                  <li key={e.id} className="d-flex items-center justify-between py-2 border-bottom">
                    <span><Badge>{e.status}</Badge> #{e.queueNumber} {e.patientName}</span>
                    {hasPermission('queue.write') && (
                      <span className="d-flex gap-2">
                        <Button size="sm" variant="success" onClick={() => handleDone(e.id)}>Done</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleSkip(e.id)}>Skip</Button>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Modal open={addOpen} onClose={() => !adding && setAddOpen(false)} title="Add to queue">
        <form onSubmit={handleAddToQueue}>
          <FormField label="Patient" required>
            <Select
              options={patients.map(p => ({ value: p.id, label: p.name || p.email }))}
              value={addForm.patientId}
              onChange={v => setAddForm(f => ({ ...f, patientId: v }))}
              placeholder="Select patient"
            />
          </FormField>
          <FormField label="Priority">
            <Select
              options={[{ value: 'Normal', label: 'Normal' }, { value: 'Urgent', label: 'Urgent' }, { value: 'Emergency', label: 'Emergency' }]}
              value={addForm.priority}
              onChange={v => setAddForm(f => ({ ...f, priority: v }))}
            />
          </FormField>
          <FormField label="Notes">
            <input type="text" className="form-control" value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
          </FormField>
          <div className="modal-footer">
            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)} disabled={adding}>Cancel</Button>
            <Button type="submit" variant="primary" loading={adding}>Add</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
