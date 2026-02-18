import { Link } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader.jsx'
import { Card, CardBody } from '../../components/ui/Card.jsx'
import { useAuth } from '../../state/AuthContext.jsx'

export default function ReportsPage() {
  const { hasPermission } = useAuth()

  return (
    <>
      <PageHeader title="Reports" subtitle="Analytics and exports" />
      <div className="content-block">
        <Card>
          <CardBody>
            <h4 className="mb-2">Reports & exports</h4>
            <p className="text-secondary mb-4">
              Use the modules below to view and filter data. Export features (e.g. Excel) are available where supported.
            </p>
            <ul className="p-0" style={{ listStyle: 'none' }}>
              {hasPermission('appointments.read') && (
                <li className="py-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                  <Link to="/appointments" style={{ color: 'var(--text-primary)' }}>📅 Appointments</Link>
                  <span className="text-muted text-sm"> — Filter by date and status</span>
                </li>
              )}
              {hasPermission('billing.read') && (
                <li className="py-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                  <Link to="/billing/invoices" style={{ color: 'var(--text-primary)' }}>🧾 Invoices</Link>
                  <span className="text-muted text-sm"> — Filter by patient and status</span>
                </li>
              )}
              {hasPermission('patients.read') && (
                <li className="py-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                  <Link to="/patients" style={{ color: 'var(--text-primary)' }}>👥 Patients</Link>
                  <span className="text-muted text-sm"> — Search and view list</span>
                </li>
              )}
              {hasPermission('audit.read') && (
                <li className="py-2" style={{ borderColor: 'var(--border-color)' }}>
                  <Link to="/audit" style={{ color: 'var(--text-primary)' }}>🔍 Audit log</Link>
                  <span className="text-muted text-sm"> — Filter by user, module, date</span>
                </li>
              )}
            </ul>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
