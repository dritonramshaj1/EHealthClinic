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
      {items.map((a) => (
        <li key={a.id} className="upcoming-appointments-item">
          <Link to="/appointments" className="upcoming-appointments-link">
            <span className="upcoming-appointments-time">{formatTime(a.startsAtUtc)}</span>
            <span className="upcoming-appointments-date">{formatDate(a.startsAtUtc)}</span>
            <span className="upcoming-appointments-title">
              {a.patient?.name || a.doctor?.name || a.patientName || a.doctorName || a.reason || 'Takim'}
            </span>
            {a.status && (
              <span className={`upcoming-appointments-badge status-${(a.status || '').toLowerCase()}`}>
                {a.status}
              </span>
            )}
          </Link>
        </li>
      ))}
      <style>{`
        .upcoming-appointments-list { list-style: none; padding: 0; margin: 0; }
        .upcoming-appointments-item { border-bottom: 1px solid var(--border-color); }
        .upcoming-appointments-item:last-child { border-bottom: none; }
        .upcoming-appointments-link {
          display: block; padding: var(--space-2) 0; text-decoration: none; color: var(--text-primary);
          font-size: var(--font-size-sm);
        }
        .upcoming-appointments-link:hover { background: var(--color-gray-50); }
        .upcoming-appointments-time { font-weight: 600; color: var(--color-primary); margin-right: var(--space-2); }
        .upcoming-appointments-date { color: var(--text-secondary); margin-right: var(--space-2); font-size: var(--font-size-xs); }
        .upcoming-appointments-title { display: block; margin-top: 2px; }
        .upcoming-appointments-badge { font-size: 10px; padding: 1px 6px; border-radius: 999px; background: var(--color-gray-200); color: var(--text-secondary); }
        .upcoming-appointments-badge.status-scheduled { background: var(--color-primary-subtle); color: var(--color-primary); }
        .upcoming-appointments-badge.status-completed { background: var(--color-success-subtle); color: var(--color-success); }
      `}</style>
    </ul>
  )
}
