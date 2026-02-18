import { useState, useEffect } from 'react'
import PageHeader from '../../components/layout/PageHeader.jsx'
import { Card, CardBody } from '../../components/ui/Card.jsx'
import { usersApi } from '../../api/services/usersApi.js'
import { PermissionMatrix } from '../../state/PermissionMatrix.js'

const ROLE_DESCRIPTIONS = {
  Admin: 'Full access to all modules and user/role management.',
  Doctor: 'Patients, appointments, prescriptions, lab, documents, messages.',
  Patient: 'Own appointments, prescriptions, lab, billing, messages.',
  Receptionist: 'Patients, appointments, queue, billing, insurance, documents.',
  LabTechnician: 'Patients, lab orders and results, documents.',
  Pharmacist: 'Prescriptions, inventory.',
  HRManager: 'Shifts, leave requests, users (read), reports.',
}

export default function RolesPage() {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    usersApi.getRoles()
      .then(res => setRoles(res.data || []))
      .catch(() => setRoles(Object.keys(PermissionMatrix)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <PageHeader
        title="Roles"
        subtitle="System roles and permissions (read-only)"
        breadcrumb={[{ label: 'Settings', to: '/settings' }, { label: 'Roles' }]}
      />
      <div className="content-block">
        <Card>
          <CardBody>
            <p className="text-muted mb-4">
              Roles are created automatically when the application starts. You cannot create or delete roles from this screen.
              Assign roles to users from <strong>Settings → Users</strong> when creating or managing accounts.
            </p>
            {loading ? (
              <p className="text-muted">Loading...</p>
            ) : (
              <div className="d-grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                {roles.map(role => (
                  <div key={role} className="border rounded p-4" style={{ borderColor: 'var(--border-color)' }}>
                    <h4 className="mb-2" style={{ fontSize: '1rem' }}>{role}</h4>
                    <p className="text-sm text-muted mb-3">{ROLE_DESCRIPTIONS[role] || '—'}</p>
                    <div className="text-xs text-muted">
                      <strong>Permissions:</strong>
                      <ul className="mt-1 mb-0 pl-4">
                        {(PermissionMatrix[role] || []).slice(0, 8).map(p => (
                          <li key={p}>{p}</li>
                        ))}
                        {(PermissionMatrix[role] || []).length > 8 && (
                          <li>+ {(PermissionMatrix[role] || []).length - 8} more</li>
                        )}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
