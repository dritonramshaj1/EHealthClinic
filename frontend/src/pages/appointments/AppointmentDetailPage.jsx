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
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
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
