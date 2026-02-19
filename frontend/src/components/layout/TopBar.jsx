import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../state/AuthContext.jsx'
import { useUI } from '../../state/UIContext.jsx'
import { messagesApi } from '../../api/services/messagesApi.js'
import { notificationsApi } from '../../api/services/notificationsApi.js'

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function formatNotifDate(d) {
  if (!d) return ''
  const date = new Date(d)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  return sameDay ? date.toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString('sq-AL')
}

export default function TopBar() {
  const { user, primaryRole, logout, hasPermission } = useAuth()
  const { toggleSidebar, darkMode, toggleDarkMode } = useUI()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const dropdownRef = useRef(null)
  const notificationsRef = useRef(null)

  const loadNotifications = () => {
    if (!hasPermission?.('notifications.read')) return
    notificationsApi.list({ limit: 8 })
      .then(res => setNotifications(res.data || []))
      .catch(() => setNotifications([]))
  }

  useEffect(() => {
    if (!hasPermission?.('messages.read')) return
    messagesApi.getUnreadCount()
      .then(res => setUnreadCount(res.data?.count ?? 0))
      .catch(() => setUnreadCount(0))
    const t = setInterval(() => {
      messagesApi.getUnreadCount().then(res => setUnreadCount(res.data?.count ?? 0)).catch(() => {})
    }, 60000)
    return () => clearInterval(t)
  }, [hasPermission])

  useEffect(() => {
    loadNotifications()
    const handler = () => loadNotifications()
    window.addEventListener('ehealth:notification', handler)
    return () => window.removeEventListener('ehealth:notification', handler)
  }, [hasPermission])

  const notificationUnreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) setNotificationsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="topbar">
      {/* Sidebar toggle */}
      <button className="topbar-toggle" onClick={toggleSidebar} title="Toggle sidebar">
        ☰
      </button>

      {/* Search */}
      <div className="topbar-search">
        <span className="topbar-search-icon">🔍</span>
        <input
          type="text"
          className="topbar-search-input"
          placeholder="Search patients, appointments..."
        />
      </div>

      {/* Right actions */}
      <div className="topbar-right">
        {/* Notifications */}
        {hasPermission?.('notifications.read') && (
          <div className="dropdown" ref={notificationsRef}>
            <button
              type="button"
              className="topbar-icon-btn"
              onClick={() => setNotificationsOpen(v => !v)}
              title="Njoftimet"
            >
              🔔
              {notificationUnreadCount > 0 && (
                <span className="topbar-badge">{notificationUnreadCount > 99 ? '99+' : notificationUnreadCount}</span>
              )}
            </button>
            {notificationsOpen && (
              <div className="dropdown-menu dropdown-menu-notifications">
                <div className="dropdown-header">
                  <strong>Njoftimet</strong>
                  <Link to="/notifications" onClick={() => setNotificationsOpen(false)} className="dropdown-link-sm">
                    Shiko të gjitha
                  </Link>
                </div>
                {notifications.length === 0 ? (
                  <div className="dropdown-item text-secondary text-sm">Nuk ka njoftime</div>
                ) : (
                  notifications.map(n => (
                    <Link
                      key={n.id}
                      to="/notifications"
                      onClick={() => setNotificationsOpen(false)}
                      className={`dropdown-item dropdown-item-notification ${!n.read ? 'unread' : ''}`}
                    >
                      <span className="dropdown-notif-type">{n.type}</span>
                      <span className="dropdown-notif-message">{n.message}</span>
                      <span className="dropdown-notif-time">{formatNotifDate(n.createdAtUtc)}</span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Dark mode */}
        <button
          className="topbar-icon-btn"
          onClick={toggleDarkMode}
          title={darkMode ? 'Light mode' : 'Dark mode'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>

        {/* Messages unread */}
        {hasPermission?.('messages.read') && (
          <Link to="/messages" className="topbar-icon-btn" title="Messages">
            ✉️
            {unreadCount > 0 && <span className="topbar-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </Link>
        )}

        {/* User dropdown */}
        <div className="dropdown" ref={dropdownRef}>
          <button
            className="topbar-user"
            onClick={() => setDropdownOpen(v => !v)}
          >
            <div className="topbar-avatar">
              {getInitials(user?.fullName)}
            </div>
            <div className="topbar-user-info">
              <div className="topbar-user-name">{user?.fullName || 'User'}</div>
              <div className="topbar-user-role">{primaryRole}</div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>▾</span>
          </button>

          {dropdownOpen && (
            <div className="dropdown-menu">
              <Link className="dropdown-item" to="/profile" onClick={() => setDropdownOpen(false)}>
                <span>👤</span> Profile
              </Link>
              <Link className="dropdown-item" to="/settings" onClick={() => setDropdownOpen(false)}>
                <span>⚙️</span> Settings
              </Link>
              <div className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={handleLogout}>
                <span>🚪</span> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
