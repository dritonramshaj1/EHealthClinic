import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Modal from '../../components/ui/Modal.jsx'
import FormField from '../../components/ui/FormField.jsx'
import Select from '../../components/ui/Select.jsx'
import { Card, CardBody } from '../../components/ui/Card.jsx'
import { prescriptionsApi } from '../../api/services/prescriptionsApi.js'
import { useAuth } from '../../state/AuthContext.jsx'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString()
}

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
]

export default function PrescriptionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [prescription, setPrescription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    prescriptionsApi.getById(id)
      .then(res => { setPrescription(res.data); setNewStatus(res.data?.status || '') })
      .catch(() => setPrescription(null))
      .finally(() => setLoading(false))
  }, [id])

  const handleUpdateStatus = (e) => {
    e.preventDefault()
    if (!newStatus) return
    setUpdating(true)
    prescriptionsApi.updateStatus(id, newStatus)
      .then(() => { setPrescription(p => p ? { ...p, status: newStatus } : null); setStatusModalOpen(false) })
      .finally(() => setUpdating(false))
  }

  const handleCancel = () => {
    if (!confirm('Cancel this prescription?')) return
    prescriptionsApi.cancel(id).then(() => navigate('/clinical/prescriptions')).catch(() => {})
  }

  const handlePrint = () => {
    if (!prescription) return
    const rows = (prescription.items || []).map(item => `
      <tr>
        <td>${item.medicationName || '—'}</td>
        <td>${item.dosage || '—'}</td>
        <td>${item.frequency || '—'}</td>
        <td>${item.durationDays} days</td>
        <td>${item.instructions || '—'}</td>
        <td>${item.quantity ?? '—'}</td>
      </tr>`).join('')
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>Prescription — ${prescription.patientName}</title>
<style>
  body{font-family:Arial,sans-serif;margin:40px;color:#000}
  h1{font-size:20px;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:16px}
  h2{font-size:15px;margin-top:24px}
  .info{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}
  .lbl{font-size:11px;font-weight:bold;color:#555;text-transform:uppercase}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th,td{border:1px solid #bbb;padding:6px 10px;font-size:13px;text-align:left}
  th{background:#f5f5f5;font-weight:bold}
  .footer{margin-top:40px;font-size:11px;color:#999}
  @media print{body{margin:20px}}
</style></head><body>
<h1>EHealth Clinic — Prescription</h1>
<div class="info">
  <div><span class="lbl">Patient</span><br/>${prescription.patientName}${prescription.patientMRN ? ` (${prescription.patientMRN})` : ''}</div>
  <div><span class="lbl">Doctor</span><br/>${prescription.doctorName}</div>
  <div><span class="lbl">Status</span><br/>${prescription.status}</div>
  <div><span class="lbl">Issued</span><br/>${formatDate(prescription.issuedAtUtc)}</div>
  ${prescription.expiresAtUtc ? `<div><span class="lbl">Expires</span><br/>${formatDate(prescription.expiresAtUtc)}</div>` : ''}
</div>
${prescription.notes ? `<p><strong>Notes:</strong> ${prescription.notes}</p>` : ''}
<h2>Medications</h2>
<table><thead><tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Instructions</th><th>Qty</th></tr></thead>
<tbody>${rows}</tbody></table>
<p class="footer">Printed: ${new Date().toLocaleString()}</p>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`
    const w = window.open('', '_blank', 'width=860,height=620')
    if (w) { w.document.write(html); w.document.close() }
  }

  if (loading) return <div className="text-center py-5"><span className="spinner" /></div>
  if (!prescription) return <div className="alert alert-danger">Prescription not found.</div>

  return (
    <>
      <PageHeader
        title="Prescription"
        subtitle={prescription.patientName}
        actions={
          <>
            <Button variant="ghost" onClick={() => navigate('/clinical/prescriptions')}>Back to list</Button>
            <Button variant="secondary" onClick={handlePrint}>Print / PDF</Button>
            {hasPermission('prescriptions.write') && prescription.status !== 'Cancelled' && (
              <>
                <Button variant="secondary" onClick={() => setStatusModalOpen(true)}>Change status</Button>
                <Button variant="danger" onClick={handleCancel}>Cancel prescription</Button>
              </>
            )}
          </>
        }
      />
      <div className="content-block">
        <Card>
          <CardBody>
            <div className="grid grid-2 gap-4 mb-4">
              <div><strong>Patient</strong><br />{prescription.patientName} {prescription.patientMRN && `(${prescription.patientMRN})`}</div>
              <div><strong>Doctor</strong><br />{prescription.doctorName}</div>
              <div><strong>Status</strong><br /><Badge>{prescription.status}</Badge></div>
              <div><strong>Issued</strong><br />{formatDate(prescription.issuedAtUtc)}</div>
              {prescription.expiresAtUtc && <div><strong>Expires</strong><br />{formatDate(prescription.expiresAtUtc)}</div>}
            </div>
            {prescription.notes && <p><strong>Notes</strong><br />{prescription.notes}</p>}
            <h4 className="mt-4">Items</h4>
            <table className="table">
              <thead>
                <tr>
                  <th>Medication</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                  <th>Instructions</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                {(prescription.items || []).map(item => (
                  <tr key={item.id}>
                    <td>{item.medicationName}</td>
                    <td>{item.dosage}</td>
                    <td>{item.frequency}</td>
                    <td>{item.durationDays} days</td>
                    <td>{item.instructions || '—'}</td>
                    <td>{item.quantity ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>

      <Modal open={statusModalOpen} onClose={() => !updating && setStatusModalOpen(false)} title="Change status">
        <form onSubmit={handleUpdateStatus}>
          <FormField label="Status">
            <Select
              options={STATUS_OPTIONS}
              value={newStatus}
              onChange={setNewStatus}
            />
          </FormField>
          <div className="modal-footer">
            <Button type="button" variant="ghost" onClick={() => setStatusModalOpen(false)} disabled={updating}>Cancel</Button>
            <Button type="submit" variant="primary" loading={updating}>Update</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
