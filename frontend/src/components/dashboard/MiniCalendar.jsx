import { useState } from 'react'
import { Link } from 'react-router-dom'

const DAY_NAMES = ['D', 'L', 'M', 'M', 'E', 'P', 'S']

export default function MiniCalendar({ appointmentsByDate = {} }) {
  const [view, setView] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const year = view.year
  const month = view.month
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startPad = first.getDay()
  const daysInMonth = last.getDate()
  const monthLabel = first.toLocaleDateString('sq-AL', { month: 'long', year: 'numeric' })

  const today = new Date()
  const todayKey = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')

  const cells = []
  for (let i = 0; i < startPad; i++) cells.push({ day: null, key: `pad-${i}` })
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const key = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0')
    const count = appointmentsByDate[key] ?? 0
    cells.push({ day: d, key, isToday: key === todayKey, count, date })
  }

  const prevMonth = () => {
    if (month === 0) setView({ year: year - 1, month: 11 })
    else setView({ year, month: month - 1 })
  }
  const nextMonth = () => {
    if (month === 11) setView({ year: year + 1, month: 0 })
    else setView({ year, month: month + 1 })
  }

  return (
    <div className="mini-calendar">
      <div className="mini-calendar-header">
        <button type="button" className="mini-calendar-nav" onClick={prevMonth} aria-label="Muaji para">‹</button>
        <span className="mini-calendar-title">{monthLabel}</span>
        <button type="button" className="mini-calendar-nav" onClick={nextMonth} aria-label="Muaji pas">›</button>
      </div>
      <div className="mini-calendar-weekdays">
        {DAY_NAMES.map((d, i) => (
          <span key={i} className="mini-calendar-weekday">{d}</span>
        ))}
      </div>
      <div className="mini-calendar-grid">
        {cells.map(({ day, key, isToday, count }) => (
          <div key={key} className={`mini-calendar-cell ${day == null ? 'empty' : ''} ${isToday ? 'today' : ''} ${count > 0 ? 'has-appointments' : ''}`}>
            {day != null ? (
              <Link to={`/appointments?date=${key}`} className="mini-calendar-day" title={count > 0 ? `${count} takim(e)` : ''}>
                {day}
                {count > 0 && <span className="mini-calendar-dot" />}
              </Link>
            ) : null}
          </div>
        ))}
      </div>
      <style>{`
        .mini-calendar { background: var(--bg-surface); border-radius: var(--radius-lg); padding: var(--space-3); border: 1px solid var(--border-color); }
        .mini-calendar-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3); }
        .mini-calendar-title { font-weight: 600; font-size: var(--font-size-sm); color: var(--text-primary); text-transform: capitalize; }
        .mini-calendar-nav { background: none; border: none; cursor: pointer; font-size: 1.25rem; color: var(--text-secondary); padding: 0 var(--space-2); line-height: 1; }
        .mini-calendar-nav:hover { color: var(--color-primary); }
        .mini-calendar-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: var(--space-2); }
        .mini-calendar-weekday { font-size: 10px; color: var(--text-secondary); text-align: center; font-weight: 600; }
        .mini-calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
        .mini-calendar-cell { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); }
        .mini-calendar-cell.empty { background: transparent; }
        .mini-calendar-cell.today { background: var(--color-primary-subtle); }
        .mini-calendar-cell.has-appointments .mini-calendar-day { font-weight: 600; color: var(--color-primary); }
        .mini-calendar-day { text-decoration: none; color: var(--text-primary); font-size: 12px; position: relative; padding: 4px; }
        .mini-calendar-day:hover { color: var(--color-primary); }
        .mini-calendar-dot { position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); width: 4px; height: 4px; background: var(--color-primary); border-radius: 50%; }
      `}</style>
    </div>
  )
}
