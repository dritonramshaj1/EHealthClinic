export default function Button({
  children,
  variant = 'primary',
  size = '',
  icon,
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const cls = [
    'btn',
    `btn-${variant}`,
    size ? `btn-${size}` : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      className={cls}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading
        ? <span className="spinner spinner-sm" />
        : icon && <span>{icon}</span>
      }
      {children}
    </button>
  )
}
