import { NavLink } from 'react-router-dom'
import { useAuth } from '../../state/AuthContext.jsx'
import { useUI } from '../../state/UIContext.jsx'

// Nav item definitions with required permission
const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
      { to: '/messages', icon: '✉️', label: 'Messages', perm: 'messages.read' },
    ],
  },
  {
    label: 'Patients & Clinical',
    items: [
      { to: '/patients', icon: '👥', label: 'Patients', perm: 'patients.read' },
      { to: '/appointments', icon: '📅', label: 'Appointments', perm: 'appointments.read' },
      { to: '/queue', icon: '🔢', label: 'Queue', perm: 'queue.read' },
      { to: '/clinical/prescriptions', icon: '💊', label: 'Prescriptions', perm: 'prescriptions.read' },
      { to: '/laboratory', icon: '🧪', label: 'Laboratory', perm: 'lab.read' },
      { to: '/documents', icon: '📄', label: 'Documents', perm: 'documents.read' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/billing/invoices', icon: '🧾', label: 'Invoices', perm: 'billing.read' },
      { to: '/billing/insurance', icon: '🛡️', label: 'Insurance', perm: 'insurance.read' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/inventory', icon: '📦', label: 'Inventory', perm: 'inventory.read' },
      { to: '/hr/shifts', icon: '🕐', label: 'Shifts', perm: 'hr.read' },
      { to: '/hr/leave', icon: '🏖️', label: 'Leave Requests', perm: 'hr.read' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/reports', icon: '📊', label: 'Reports', perm: 'reports.read' },
      { to: '/audit', icon: '🔍', label: 'Audit Log', perm: 'audit.read' },
      { to: '/settings', icon: '⚙️', label: 'Settings', perm: 'settings.read' },
      { to: '/settings/branches', icon: '🏢', label: 'Branches', perm: 'branches.read' },
    ],
  },
]

export default function Sidebar() {
  const { hasPermission } = useAuth()
  const { sidebarCollapsed, toggleSidebar } = useUI()

  return (
    <aside className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">E</div>
        <span className="sidebar-logo-text">EHealthClinic</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_SECTIONS.map(section => {
          const visibleItems = section.items.filter(
            item => !item.perm || hasPermission(item.perm)
          )
          if (visibleItems.length === 0) return null
          return (
            <div key={section.label}>
              <div className="sidebar-section-label">{section.label}</div>
              {visibleItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar-item${isActive ? ' active' : ''}`
                  }
                  end={item.to === '/dashboard'}
                >
                  <span className="sidebar-item-icon">{item.icon}</span>
                  <span className="sidebar-item-text">{item.label}</span>
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="sidebar-footer">
        <button
          className="sidebar-item"
          onClick={toggleSidebar}
          style={{ width: '100%' }}
        >
          <span className="sidebar-item-icon">
            {sidebarCollapsed ? '→' : '←'}
          </span>
          <span className="sidebar-item-text">Collapse</span>
        </button>
      </div>
    </aside>
  )
}
