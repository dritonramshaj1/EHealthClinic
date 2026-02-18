export default function StatCard({ title, value, icon, variant = 'primary', change, changeUp }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-label">{title}</span>
        {icon && <div className={`stat-card-icon ${variant}`}>{icon}</div>}
      </div>
      <div className="stat-card-value">{value}</div>
      {change != null && (
        <div className={`stat-card-change ${changeUp ? 'up' : 'down'}`}>
          {changeUp ? '↑' : '↓'} {change}
        </div>
      )}
    </div>
  )
}
