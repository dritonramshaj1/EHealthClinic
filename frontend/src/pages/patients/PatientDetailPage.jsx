import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader.jsx'
import { Card, CardHeader, CardBody } from '../../components/ui/Card.jsx'
import Button from '../../components/ui/Button.jsx'
import Alert from '../../components/ui/Alert.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import FormField from '../../components/ui/FormField.jsx'
import { patientsApi } from '../../api/services/patientsApi.js'
import { usersApi } from '../../api/services/usersApi.js'
import { useAuth } from '../../state/AuthContext.jsx'

const TABS = [
  { id: 'info', label: 'Info' },
  { id: 'appointments', label: 'Appointments' },
  { id: 'medical', label: 'Medical Records' },
  { id: 'lab', label: 'Lab' },
  { id: 'prescriptions', label: 'Prescriptions' },
  { id: 'documents', label: 'Documents' },
  { id: 'billing', label: 'Billing' },
]

export default function PatientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { hasPermission } = useAuth()
  const statePatient = location.state?.patient
  const [patient, setPatient] = useState(statePatient || null)
  const [loading, setLoading] = useState(!statePatient && !!id && id !== 'new')
  const [activeTab, setActiveTab] = useState('info')
  const [newPatientForm, setNewPatientForm] = useState({ fullName: '', email: '', password: '' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    if (statePatient && statePatient.id === id) {
      setPatient(statePatient)
      setLoading(false)
      return
    }
    if (!id || id === 'new') {
      setLoading(false)
      return
    }
    setLoading(true)
    patientsApi.getById(id)
      .then(res => setPatient(res.data))
      .catch(() => setPatient(null))
      .finally(() => setLoading(false))
  }, [id, statePatient])

  if (loading && id !== 'new') return <Spinner center label="Loading patient..." />
  if (id && id !== 'new' && !patient) {
    return (
      <>
        <PageHeader title="Patient not found" />
        <Alert variant="warning" title="Not found">This patient may have been removed or you don't have access.</Alert>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/patients')}>Back to list</Button>
      </>
    )
  }

  const handleCreatePatient = (e) => {
    e.preventDefault()
    setCreateError('')
    if (!newPatientForm.fullName?.trim() || !newPatientForm.email?.trim() || !newPatientForm.password) {
      setCreateError('Name, email and password are required.')
      return
    }
    setCreating(true)
    usersApi.create({
      fullName: newPatientForm.fullName.trim(),
      email: newPatientForm.email.trim(),
      password: newPatientForm.password,
      role: 'Patient',
    })
      .then(() => navigate('/patients'))
      .catch(err => setCreateError(err.response?.data?.error || 'Failed to create patient'))
      .finally(() => setCreating(false))
  }

  if (id === 'new') {
    return (
      <>
        <PageHeader title="New patient" subtitle="Create a new patient account" breadcrumb={[{ label: 'Patients', to: '/patients' }, { label: 'New' }]} actions={<Button variant="ghost" onClick={() => navigate('/patients')}>Back</Button>} />
        <Card className="content-block" style={{ maxWidth: 420 }}>
          <CardHeader title="Create patient" />
          <CardBody>
            {!hasPermission('users.write') && <div className="alert alert-warning mb-4">Only administrators can create new patient accounts. Use Settings → Users to manage accounts.</div>}
            <form onSubmit={handleCreatePatient} className="form-stack">
              {createError && <div className="alert alert-danger">{createError}</div>}
              <FormField label="Full name" required>
                <input type="text" className="form-control" value={newPatientForm.fullName} onChange={e => setNewPatientForm(f => ({ ...f, fullName: e.target.value }))} />
              </FormField>
              <FormField label="Email" required>
                <input type="email" className="form-control" value={newPatientForm.email} onChange={e => setNewPatientForm(f => ({ ...f, email: e.target.value }))} />
              </FormField>
              <FormField label="Password" required>
                <input type="password" className="form-control" value={newPatientForm.password} onChange={e => setNewPatientForm(f => ({ ...f, password: e.target.value }))} minLength={6} />
              </FormField>
              <Button type="submit" variant="primary" disabled={creating || !hasPermission('users.write')}>{creating ? 'Creating...' : 'Create patient'}</Button>
            </form>
          </CardBody>
        </Card>
      </>
    )
  }

  const name = patient?.name || patient?.fullName || 'Patient'
  const email = patient?.email || ''
  const patientId = patient?.id

  return (
    <>
      <PageHeader
        title={name}
        subtitle={email}
        breadcrumb={[{ label: 'Patients', to: '/patients' }, { label: name }]}
        actions={
          <Button variant="secondary" onClick={() => navigate('/patients')}>
            Back to list
          </Button>
        }
      />

      <div className="tabs mb-4">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-item${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'info' && (
        <Card>
          <CardHeader title="Patient information" />
          <CardBody>
            <dl className="d-grid gap-3" style={{ gridTemplateColumns: 'auto 1fr', maxWidth: 400 }}>
              <dt className="text-secondary">Name</dt><dd>{name}</dd>
              <dt className="text-secondary">Email</dt><dd>{email}</dd>
              {patient?.id && (<><dt className="text-secondary">ID</dt><dd><code className="text-sm">{patient.id}</code></dd></>)}
            </dl>
          </CardBody>
        </Card>
      )}

      {activeTab === 'appointments' && (
        <Card>
          <CardBody>
            <p className="mb-3">Appointments for this patient.</p>
            <Button variant="secondary" onClick={() => navigate('/appointments', { state: { patientId } })}>View appointments</Button>
          </CardBody>
        </Card>
      )}
      {activeTab === 'medical' && (
        <Card>
          <CardBody>
            <p className="text-muted">Medical records are available in the clinical modules (prescriptions, lab, documents).</p>
          </CardBody>
        </Card>
      )}
      {activeTab === 'lab' && (
        <Card>
          <CardBody>
            <p className="mb-3">Lab orders for this patient.</p>
            <Button variant="secondary" onClick={() => navigate('/laboratory', { state: { patientId } })}>View laboratory</Button>
          </CardBody>
        </Card>
      )}
      {activeTab === 'prescriptions' && (
        <Card>
          <CardBody>
            <p className="mb-3">Prescriptions for this patient.</p>
            <Button variant="secondary" onClick={() => navigate('/clinical/prescriptions', { state: { patientId } })}>View prescriptions</Button>
          </CardBody>
        </Card>
      )}
      {activeTab === 'documents' && (
        <Card>
          <CardBody>
            <p className="mb-3">Documents for this patient.</p>
            <Button variant="secondary" onClick={() => navigate('/documents', { state: { patientId } })}>View documents</Button>
          </CardBody>
        </Card>
      )}
      {activeTab === 'billing' && (
        <Card>
          <CardBody>
            <p className="mb-3">Invoices and billing for this patient.</p>
            <Button variant="secondary" onClick={() => navigate('/billing/invoices', { state: { patientId } })}>View invoices</Button>
          </CardBody>
        </Card>
      )}
    </>
  )
}
