export default function FormField({
  label,
  required,
  error,
  hint,
  children,
  htmlFor,
  className = '',
}) {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label className={`form-label${required ? ' required' : ''}`} htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {error && <div className="form-error">{error}</div>}
      {hint && !error && <div className="form-hint">{hint}</div>}
    </div>
  )
}
