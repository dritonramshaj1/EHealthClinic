import { useState, useEffect } from 'react'
import PageHeader from '../../components/layout/PageHeader.jsx'
import NotificationPanel from '../../components/NotificationPanel.jsx'
import { notificationsApi } from '../../api/services/notificationsApi.js'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    notificationsApi.list({ limit: 100 })
      .then((res) => setNotifications(res.data || []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const handler = () => load()
    window.addEventListener('ehealth:notification', handler)
    return () => window.removeEventListener('ehealth:notification', handler)
  }, [])

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Real-time updates. New notifications appear automatically."
      />
      <div className="content-block">
        {loading ? (
          <p className="text-secondary">Loading...</p>
        ) : (
          <NotificationPanel notifications={notifications} onUpdate={setNotifications} />
        )}
      </div>
    </>
  )
}
