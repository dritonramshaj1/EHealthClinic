export default function DatePicker({
  value,
  onChange,
  min,
  max,
  disabled,
  error,
  className = '',
  id,
  ...props
}) {
  const str = value instanceof Date ? value.toISOString().slice(0, 10) : (value || '')
  return (
    <input
      type="date"
      id={id}
      className={`form-control${error ? ' error' : ''} ${className}`}
      value={str}
      onChange={e => onChange?.(e.target.value ? new Date(e.target.value) : null)}
      min={min instanceof Date ? min.toISOString().slice(0, 10) : min}
      max={max instanceof Date ? max.toISOString().slice(0, 10) : max}
      disabled={disabled}
      {...props}
    />
  )
}
