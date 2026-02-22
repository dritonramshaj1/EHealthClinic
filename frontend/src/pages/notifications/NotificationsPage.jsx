import { useState, useEffect } from 'react'
import PageHeader from '../../components/layout/PageHeader.jsx'
import { Card, CardBody } from '../../components/ui/Card.jsx'
import Button from '../../components/ui/Button.jsx'
import { notificationsApi } from '../../api/services/notificationsApi.js'
import { useLang } from '../../state/LanguageContext.jsx'

const TYPE_LABELS = {
  All: 'Të gjitha',
  Appointment: 'Takime',
  Lab: 'Analiza',
  Message: 'Mesazhe',
  Prescription: 'Receta',
  Payment: 'Pagesa',
  Info: 'Info',
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('sq-AL')
}

export default function NotificationsPage() {
  const { t } = useLang()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')

  const load = () => {
    setLoading(true)
    notificationsApi.list({ limit: 200 })
      .then((res) => setNotifications(res.data || []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    const handler = () => load()
    window.addEventListener('ehealth:notification', handler)
    return () => window.removeEventListener('ehealth:notification', handler)
  }, [])

  const markRead = async (id) => {
    try {
      await notificationsApi.markAsRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true, readAtUtc: new Date().toISOString() } : n)))
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead()
      const now = new Date().toISOString()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, readAtUtc: n.readAtUtc || now })))
    } catch {}
  }

  const types = ['All', 'Appointment', 'Lab', 'Message', 'Prescription', 'Payment', 'Info']
  const filtered = filter === 'All' ? notifications : notifications.filter((n) => n.type === filter)
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <>
      <PageHeader
        title={t('pages.notifications.title')}
        subtitle={t('pages.notifications.subtitle')}
      />
      <div className="content-block">
        <Card>
          <CardBody>
            <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
              {types.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`btn btn-sm ${filter === t ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter(t)}
                >
                  {TYPE_LABELS[t] ?? t}
                </button>
              ))}
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllRead}>
                  Shëno të gjitha si të lexuara
                </Button>
              )}
              <span className="text-secondary text-sm ms-auto">{unreadCount} të palexuara</span>
            </div>

            {loading ? (
              <p className="text-secondary">Duke ngarkuar...</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Lloji</th>
                      <th>Mesazhi</th>
                      <th>Data</th>
                      <th>Statusi</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-secondary py-5">
                          Nuk ka njoftime.
                        </td>
                      </tr>
                    )}
                    {filtered.map((n) => (
                      <tr key={n.id} className={!n.read ? 'notification-row-unread' : ''}>
                        <td>
                          <span className={`badge ${n.read ? '' : 'badge-primary'}`}>{TYPE_LABELS[n.type] ?? n.type}</span>
                        </td>
                        <td className="notification-message">{n.message}</td>
                        <td className="text-sm text-secondary">{formatDate(n.createdAtUtc)}</td>
                        <td>{n.read ? 'Lexuar' : 'E palexuar'}</td>
                        <td>
                          {!n.read && (
                            <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}>
                              Shëno si të lexuar
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
      <style>{`
        .notification-row-unread { background: var(--color-primary-subtle, #eff6ff); }
        .notification-message { max-width: 400px; }
      `}</style>
    </>
  )
}
