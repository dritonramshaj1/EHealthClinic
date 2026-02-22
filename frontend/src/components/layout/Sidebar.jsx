import { NavLink } from 'react-router-dom'
import { useAuth } from '../../state/AuthContext.jsx'
import { useUI } from '../../state/UIContext.jsx'
import { useLang } from '../../state/LanguageContext.jsx'

// Nav sections use translation keys
const NAV_SECTIONS = [
  {
    labelKey: 'nav.main',
    items: [
      { to: '/dashboard',      icon: '🏠', labelKey: 'nav.dashboard' },
      { to: '/notifications',  icon: '🔔', labelKey: 'nav.notifications', perm: 'notifications.read' },
      { to: '/messages',       icon: '✉️', labelKey: 'nav.messages',      perm: 'messages.read' },
    ],
  },
  {
    labelKey: 'nav.patientsAndClinical',
    items: [
      { to: '/patients',              icon: '👥', labelKey: 'nav.patients',      perm: 'patients.read' },
      { to: '/appointments',          icon: '📅', labelKey: 'nav.appointments',  perm: 'appointments.read' },
      { to: '/queue',                 icon: '🔢', labelKey: 'nav.queue',         perm: 'queue.read' },
      { to: '/clinical/prescriptions',icon: '💊', labelKey: 'nav.prescriptions', perm: 'prescriptions.read' },
      { to: '/laboratory',            icon: '🧪', labelKey: 'nav.laboratory',    perm: 'lab.read' },
      { to: '/documents',             icon: '📄', labelKey: 'nav.documents',     perm: 'documents.read' },
    ],
  },
  {
    labelKey: 'nav.finance',
    items: [
      { to: '/billing/invoices',  icon: '🧾', labelKey: 'nav.invoices',  perm: 'billing.read' },
      { to: '/billing/insurance', icon: '🛡️', labelKey: 'nav.insurance', perm: 'insurance.read' },
    ],
  },
  {
    labelKey: 'nav.operations',
    items: [
      { to: '/inventory', icon: '📦', labelKey: 'nav.inventory',     perm: 'inventory.read' },
      { to: '/hr/shifts', icon: '🕐', labelKey: 'nav.shifts',        perm: 'hr.read' },
      { to: '/hr/leave',  icon: '🏖️', labelKey: 'nav.leaveRequests', perm: 'hr.read' },
    ],
  },
  {
    labelKey: 'nav.admin',
    items: [
      { to: '/reports',          icon: '📊', labelKey: 'nav.reports',   perm: 'reports.read' },
      { to: '/audit',            icon: '🔍', labelKey: 'nav.auditLog',  perm: 'audit.read' },
      { to: '/settings',         icon: '⚙️', labelKey: 'nav.settings',  perm: 'settings.read' },
      { to: '/settings/branches',icon: '🏢', labelKey: 'nav.branches',  perm: 'branches.read' },
    ],
  },
]

export default function Sidebar() {
  const { hasPermission } = useAuth()
  const { sidebarCollapsed, toggleSidebar } = useUI()
  const { t } = useLang()

  return (
    <aside className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
      {/* Logo */}
      <NavLink to="/dashboard" className="sidebar-logo" style={{ textDecoration: 'none' }}>
        <div className="sidebar-logo-icon">
          <img src="/logo.png" alt="EHealthClinic" />
        </div>
        <span className="sidebar-logo-text">EHealthClinic</span>
      </NavLink>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_SECTIONS.map(section => {
          const visibleItems = section.items.filter(
            item => !item.perm || hasPermission(item.perm)
          )
          if (visibleItems.length === 0) return null
          return (
            <div key={section.labelKey}>
              <div className="sidebar-section-label">{t(section.labelKey)}</div>
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
                  <span className="sidebar-item-text">{t(item.labelKey)}</span>
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
          <span className="sidebar-item-text">{t('nav.collapse')}</span>
        </button>
      </div>
    </aside>
  )
}
