import React, { useState } from 'react'
import { api } from '../api/axios.js'

export default function NotificationPanel({ notifications, onUpdate }) {
  const [activeFilter, setActiveFilter] = useState('All')

  const categories = ['All', 'Appointment', 'Payment', 'Info']
  const unreadCount = notifications.filter(n => !n.read).length

  const filtered = activeFilter === 'All'
    ? notifications
    : notifications.filter(n => n.type === activeFilter)

  async function markRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`)
      onUpdate(prev => prev.map(n =>
        n.id === id ? { ...n, read: true, readAtUtc: new Date().toISOString() } : n
      ))
    } catch { /* silent */ }
  }

  async function markAllRead() {
    try {
      await api.patch('/notifications/read-all')
      const now = new Date().toISOString()
      onUpdate(prev => prev.map(n => ({ ...n, read: true, readAtUtc: n.readAtUtc || now })))
    } catch { /* silent */ }
  }

  return (
    <div className="card">
      <div className="card-title">
        Notifications
        <div className="flex-center gap-2">
          {unreadCount > 0 && (
            <button className="btn-ghost btn-sm" onClick={markAllRead}>Mark all read</button>
          )}
          <span className="badge">{unreadCount} new</span>
        </div>
      </div>

      <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat}
            className={activeFilter === cat ? 'btn-sm' : 'btn-ghost btn-sm'}
            onClick={() => setActiveFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="list">
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">No notifications</div>
          </div>
        )}
        {filtered.map(n => (
          <div
            key={n.id}
            className={`item ${!n.read ? 'item-unread' : 'item-read'}`}
          >
            <div className="flex-between mb-1">
              <span className={`badge ${n.read ? '' : 'badge-primary'}`}>{n.type}</span>
              {!n.read && (
                <button className="btn-ghost btn-sm" onClick={() => markRead(n.id)}>
                  Mark read
                </button>
              )}
            </div>
            <div className="text-sm mt-1">{n.message}</div>
            <div className="text-xs text-muted mt-1">
              {new Date(n.createdAtUtc).toLocaleString()}
            </div>
            {n.read && n.readAtUtc && (
              <div className="text-xs mt-1" style={{ color: 'var(--success, #22c55e)' }}>
                Read at {new Date(n.readAtUtc).toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
