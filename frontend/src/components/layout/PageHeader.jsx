import { Link } from 'react-router-dom'

export default function PageHeader({ title, subtitle, actions, breadcrumb }) {
  return (
    <div className="page-header">
      <div className="page-header-left">
        {breadcrumb && (
          <nav className="breadcrumb">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="d-inline-flex items-center gap-2">
                {i > 0 && <span className="breadcrumb-sep">/</span>}
                {crumb.to ? (
                  <Link to={crumb.to} className="breadcrumb-item" style={{ color: 'var(--color-primary)' }}>
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="breadcrumb-item active">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>

      {actions && (
        <div className="page-header-actions">{actions}</div>
      )}
    </div>
  )
}
