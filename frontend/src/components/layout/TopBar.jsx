import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../state/AuthContext.jsx'
import { useUI } from '../../state/UIContext.jsx'
import { messagesApi } from '../../api/services/messagesApi.js'

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export default function TopBar() {
  const { user, primaryRole, logout, hasPermission } = useAuth()
  const { toggleSidebar, darkMode, toggleDarkMode } = useUI()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef(null)

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

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
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
