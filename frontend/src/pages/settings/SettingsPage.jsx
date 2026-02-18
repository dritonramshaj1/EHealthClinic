import { Link } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader.jsx'
import { Card, CardBody } from '../../components/ui/Card.jsx'
import { useAuth } from '../../state/AuthContext.jsx'

export default function SettingsPage() {
  const { hasPermission } = useAuth()

  return (
    <>
      <PageHeader title="Settings" subtitle="Application and organization settings" />
      <div className="content-block">
        <Card>
          <CardBody>
            <ul className="p-0" style={{ listStyle: 'none' }}>
              <li className="py-3 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                <Link to="/settings/branches" className="d-flex align-items-center gap-2" style={{ textDecoration: 'none', color: 'var(--text-primary)' }}>
                  <span>🏢</span>
                  <span><strong>Branches</strong></span>
                  <span className="text-muted text-sm">— Clinic locations</span>
                </Link>
              </li>
              {hasPermission('users.read') && (
                <li className="py-3 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                  <Link to="/settings/users" className="d-flex align-items-center gap-2" style={{ textDecoration: 'none', color: 'var(--text-primary)' }}>
                    <span>👥</span>
                    <span><strong>Users</strong></span>
                    <span className="text-muted text-sm">— Manage accounts and roles</span>
                  </Link>
                </li>
              )}
              {hasPermission('users.read') && (
                <li className="py-3" style={{ borderColor: 'var(--border-color)' }}>
                  <Link to="/settings/roles" className="d-flex align-items-center gap-2" style={{ textDecoration: 'none', color: 'var(--text-primary)' }}>
                    <span>🔐</span>
                    <span><strong>Roles</strong></span>
                    <span className="text-muted text-sm">— View system roles and permissions</span>
                  </Link>
                </li>
              )}
            </ul>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
