export function Card({ children, className = '', ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, actions, children }) {
  return (
    <div className="card-header">
      <div>
        {title && <div className="card-title">{title}</div>}
        {subtitle && <div className="text-sm text-secondary mt-1">{subtitle}</div>}
        {children}
      </div>
      {actions && <div className="d-flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function CardBody({ children, className = '', ...props }) {
  return (
    <div className={`card-body ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`card-footer ${className}`}>
      {children}
    </div>
  )
}
