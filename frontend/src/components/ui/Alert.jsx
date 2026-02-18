export default function Alert({ variant = 'info', title, children, className = '' }) {
  return (
    <div className={`alert alert-${variant} ${className}`} role="alert">
      <span>{variant === 'success' ? '✓' : variant === 'danger' ? '✕' : variant === 'warning' ? '!' : 'ℹ'}</span>
      <div>
        {title && <div className="font-semibold mb-1">{title}</div>}
        {children}
      </div>
    </div>
  )
}
