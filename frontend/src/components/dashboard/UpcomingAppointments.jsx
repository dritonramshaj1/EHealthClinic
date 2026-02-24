import { Link } from 'react-router-dom'

function formatTime(utcStr) {
  if (!utcStr) return '—'
  const d = new Date(utcStr)
  return d.toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })
}
function formatDate(utcStr) {
  if (!utcStr) return '—'
  const d = new Date(utcStr)
  return d.toLocaleDateString('sq-AL', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function UpcomingAppointments({ list = [], max = 7 }) {
  const items = list.slice(0, max)
  if (items.length === 0) {
    return (
      <p className="text-secondary text-sm mb-0">Nuk ka takime të ardhshme.</p>
    )
  }
  return (
    <ul className="upcoming-appointments-list">
      {items.map((a) => {
        const patientName = a.patient?.name || a.patientName
        const doctorName = a.doctor?.name || a.doctorName
        const primaryName = patientName || doctorName || 'Takim'
        const subtitle = patientName && doctorName
          ? `Dr. ${doctorName}`
          : (a.reason || null)

        return (
          <li key={a.id} className="upcoming-appointments-item">
            <Link to={`/appointments/${a.id}`} className="upcoming-appointments-link">
              <div className="upcoming-appointments-row">
                <span className="upcoming-appointments-time">{formatTime(a.startsAtUtc)}</span>
                <span className="upcoming-appointments-date">{formatDate(a.startsAtUtc)}</span>
                {a.status && (
                  <span className={`upcoming-appointments-badge status-${(a.status || '').toLowerCase()}`}>
                    {a.status}
                  </span>
                )}
              </div>
              <span className="upcoming-appointments-title">{primaryName}</span>
              {subtitle && (
                <span className="upcoming-appointments-subtitle">{subtitle}</span>
              )}
              {a.reason && patientName && (
                <span className="upcoming-appointments-reason">{a.reason}</span>
              )}
            </Link>
          </li>
        )
      })}
      <style>{`
        .upcoming-appointments-list { list-style: none; padding: 0; margin: 0; }
        .upcoming-appointments-item { border-bottom: 1px solid var(--border-color); }
        .upcoming-appointments-item:last-child { border-bottom: none; }
        .upcoming-appointments-link {
          display: block; padding: var(--space-2) 0; text-decoration: none; color: var(--text-primary);
          font-size: var(--font-size-sm);
        }
        .upcoming-appointments-link:hover { background: var(--color-gray-50); border-radius: var(--radius-sm); padding-left: 4px; }
        .upcoming-appointments-row { display: flex; align-items: center; gap: var(--space-2); margin-bottom: 2px; }
        .upcoming-appointments-time { font-weight: 600; color: var(--color-primary); }
        .upcoming-appointments-date { color: var(--text-secondary); font-size: var(--font-size-xs); flex: 1; }
        .upcoming-appointments-title { display: block; font-weight: 500; color: var(--text-primary); }
        .upcoming-appointments-subtitle { display: block; font-size: var(--font-size-xs); color: var(--text-secondary); }
        .upcoming-appointments-reason { display: block; font-size: var(--font-size-xs); color: var(--text-secondary); font-style: italic; }
        .upcoming-appointments-badge { font-size: 10px; padding: 1px 6px; border-radius: 999px; background: var(--color-gray-200); color: var(--text-secondary); white-space: nowrap; }
        .upcoming-appointments-badge.status-scheduled { background: var(--color-primary-subtle); color: var(--color-primary); }
        .upcoming-appointments-badge.status-confirmed { background: var(--color-teal-subtle); color: var(--color-teal); }
        .upcoming-appointments-badge.status-completed { background: var(--color-success-subtle); color: var(--color-success); }
        .upcoming-appointments-badge.status-cancelled { background: var(--color-danger-subtle); color: var(--color-danger); }
      `}</style>
    </ul>
  )
}
