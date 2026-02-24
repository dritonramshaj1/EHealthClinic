import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Select from '../../components/ui/Select.jsx'
import { Card, CardBody } from '../../components/ui/Card.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import { appointmentsApi } from '../../api/services/appointmentsApi.js'
import { useAuth } from '../../state/AuthContext.jsx'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString()
}

export default function AppointmentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [appt, setAppt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!id) return
    appointmentsApi.getById(id)
      .then(res => setAppt(res.data))
      .catch(() => setAppt(null))
      .finally(() => setLoading(false))
  }, [id])

  const handleReport = () => {
    if (!appt) return
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>Appointment Report</title>
<style>
  body{font-family:Arial,sans-serif;margin:40px;color:#000}
  h1{font-size:20px;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:20px}
  .section{margin-bottom:20px}
  .lbl{font-size:11px;font-weight:bold;color:#555;text-transform:uppercase;margin-bottom:2px}
  .val{font-size:14px;margin-bottom:12px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:0 32px}
  .badge{display:inline-block;padding:2px 10px;border-radius:4px;background:#e0e0e0;font-size:12px;font-weight:bold}
  .footer{margin-top:48px;font-size:11px;color:#999;border-top:1px solid #ddd;padding-top:8px}
  @media print{body{margin:20px}}
</style></head><body>
<h1>EHealth Clinic — Appointment Report</h1>
<div class="section grid">
  <div>
    <div class="lbl">Patient</div>
    <div class="val">${appt.patient?.name ?? '—'}</div>
    <div class="lbl">Doctor</div>
    <div class="val">${appt.doctor?.name ?? '—'}${appt.doctor?.specialty ? ` (${appt.doctor.specialty})` : ''}</div>
  </div>
  <div>
    <div class="lbl">Status</div>
    <div class="val"><span class="badge">${appt.status}</span></div>
    <div class="lbl">Reason</div>
    <div class="val">${appt.reason || '—'}</div>
  </div>
</div>
<div class="section grid">
  <div>
    <div class="lbl">Start</div>
    <div class="val">${formatDate(appt.startsAtUtc)}</div>
  </div>
  <div>
    <div class="lbl">End</div>
    <div class="val">${formatDate(appt.endsAtUtc)}</div>
  </div>
</div>
<div class="footer">Generated: ${new Date().toLocaleString()}</div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`
    const w = window.open('', '_blank', 'width=860,height=540')
    if (w) { w.document.write(html); w.document.close() }
  }

  const handleStatusChange = (newStatus) => {
    if (!id || !newStatus) return
    setUpdating(true)
    appointmentsApi.updateStatus(id, newStatus)
      .then(() => setAppt(prev => prev ? { ...prev, status: newStatus } : null))
      .catch(() => {})
      .finally(() => setUpdating(false))
  }

  if (loading) return <Spinner center label="Loading..." />
  if (!appt) return <p className="text-danger">Appointment not found.</p>

  const statusOptions = [
    { value: 'Scheduled', label: 'Scheduled' },
    { value: 'Confirmed', label: 'Confirmed' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'NoShow', label: 'No Show' },
  ]

  return (
    <>
      <PageHeader
        title={`Appointment ${formatDate(appt.startsAtUtc)}`}
        subtitle={`${appt.patient?.name ?? 'Patient'} with ${appt.doctor?.name ?? 'Doctor'}`}
        breadcrumb={[{ label: 'Appointments', to: '/appointments' }, { label: 'Detail' }]}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/appointments')}>Back</Button>
            <Button variant="secondary" onClick={handleReport}>Generate Report</Button>
            {hasPermission('appointments.write') && (
              <Select
                value={appt.status}
                onChange={handleStatusChange}
                options={statusOptions}
                disabled={updating}
                className="d-inline-block"
                style={{ width: 140 }}
              />
            )}
          </>
        }
      />
      <Card>
        <CardBody>
          <dl className="d-grid gap-3" style={{ gridTemplateColumns: 'auto 1fr', maxWidth: 480 }}>
            <dt className="text-secondary">Patient</dt><dd>{appt.patient?.name ?? '—'}</dd>
            <dt className="text-secondary">Doctor</dt><dd>{appt.doctor?.name ?? '—'} {appt.doctor?.specialty ? `(${appt.doctor.specialty})` : ''}</dd>
            <dt className="text-secondary">Start</dt><dd>{formatDate(appt.startsAtUtc)}</dd>
            <dt className="text-secondary">End</dt><dd>{formatDate(appt.endsAtUtc)}</dd>
            <dt className="text-secondary">Status</dt><dd><Badge>{appt.status}</Badge></dd>
            <dt className="text-secondary">Reason</dt><dd>{appt.reason || '—'}</dd>
          </dl>
        </CardBody>
      </Card>
    </>
  )
}
