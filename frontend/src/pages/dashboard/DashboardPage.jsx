import { Link } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader.jsx'
import { Card, CardBody } from '../../components/ui/Card.jsx'
import StatCard from '../../components/ui/StatCard.jsx'
import { useAuth } from '../../state/AuthContext.jsx'

export default function DashboardPage() {
  const { user, hasRole, hasPermission } = useAuth()
  const isAdmin = hasRole('Admin')
  const isDoctor = hasRole('Doctor')
  const isPatient = hasRole('Patient')
  const isReceptionist = hasRole('Receptionist')

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={user?.fullName ? `Welcome, ${user.fullName}` : 'Overview'}
      />
      <div className="content-block">
        {isAdmin && (
          <>
            <div className="d-grid grid-auto-fit-280 gap-4 mb-6">
              <Link to="/appointments" style={{ textDecoration: 'none' }}>
                <StatCard title="Appointments" value="View all" icon="📅" variant="primary" />
              </Link>
              <Link to="/queue" style={{ textDecoration: 'none' }}>
                <StatCard title="Queue" value="Manage" icon="🔢" variant="teal" />
              </Link>
              <Link to="/billing/invoices" style={{ textDecoration: 'none' }}>
                <StatCard title="Invoices" value="Billing" icon="🧾" variant="warning" />
              </Link>
              <Link to="/settings/users" style={{ textDecoration: 'none' }}>
                <StatCard title="Users & roles" value="Settings" icon="👥" variant="success" />
              </Link>
            </div>
            <Card>
              <CardBody>
                <h4 className="mb-2">Admin overview</h4>
                <p className="text-secondary mb-0">Manage appointments, queue, invoices, users, and branches from the sidebar.</p>
              </CardBody>
            </Card>
          </>
        )}
        {isDoctor && !isAdmin && (
          <>
            <div className="d-grid grid-auto-fit-280 gap-4 mb-6">
              <Link to="/appointments" style={{ textDecoration: 'none' }}>
                <StatCard title="My appointments" value="View" icon="📅" variant="primary" />
              </Link>
              <Link to="/clinical/prescriptions" style={{ textDecoration: 'none' }}>
                <StatCard title="Prescriptions" value="Manage" icon="💊" variant="teal" />
              </Link>
              <Link to="/laboratory" style={{ textDecoration: 'none' }}>
                <StatCard title="Lab orders" value="View" icon="🧪" variant="success" />
              </Link>
              <Link to="/messages" style={{ textDecoration: 'none' }}>
                <StatCard title="Messages" value="Inbox" icon="✉️" variant="warning" />
              </Link>
            </div>
            <Card>
              <CardBody>
                <h4 className="mb-2">Quick access</h4>
                <p className="text-secondary mb-0">Your appointments, prescriptions, lab results, and messages are available from the menu.</p>
              </CardBody>
            </Card>
          </>
        )}
        {isPatient && !isAdmin && (
          <>
            <div className="d-grid grid-auto-fit-280 gap-4 mb-6">
              <Link to="/appointments" style={{ textDecoration: 'none' }}>
                <StatCard title="My appointments" value="View" icon="📅" variant="primary" />
              </Link>
              <Link to="/clinical/prescriptions" style={{ textDecoration: 'none' }}>
                <StatCard title="Prescriptions" value="View" icon="💊" variant="teal" />
              </Link>
              <Link to="/messages" style={{ textDecoration: 'none' }}>
                <StatCard title="Messages" value="Inbox" icon="✉️" variant="success" />
              </Link>
              <Link to="/billing/invoices" style={{ textDecoration: 'none' }}>
                <StatCard title="Invoices" value="Billing" icon="🧾" variant="warning" />
              </Link>
            </div>
            <Card>
              <CardBody>
                <h4 className="mb-2">Your dashboard</h4>
                <p className="text-secondary mb-0">View your appointments, prescriptions, messages, and billing from the menu.</p>
              </CardBody>
            </Card>
          </>
        )}
        {(isReceptionist || (hasPermission('queue.read') && !isAdmin && !isDoctor && !isPatient)) && (
          <>
            <div className="d-grid grid-auto-fit-280 gap-4 mb-6">
              <Link to="/queue" style={{ textDecoration: 'none' }}>
                <StatCard title="Queue" value="Manage" icon="🔢" variant="primary" />
              </Link>
              <Link to="/appointments" style={{ textDecoration: 'none' }}>
                <StatCard title="Appointments" value="View" icon="📅" variant="teal" />
              </Link>
              <Link to="/patients" style={{ textDecoration: 'none' }}>
                <StatCard title="Patients" value="View" icon="👥" variant="success" />
              </Link>
            </div>
            <Card>
              <CardBody>
                <h4 className="mb-2">Reception</h4>
                <p className="text-secondary mb-0">Queue, appointments, and patients are available from the sidebar.</p>
              </CardBody>
            </Card>
          </>
        )}
        {!isAdmin && !isDoctor && !isPatient && !isReceptionist && (
          <Card>
            <CardBody>
              <h4 className="mb-2">Dashboard</h4>
              <p className="text-secondary mb-0">Use the sidebar to access the modules available for your role.</p>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  )
}
