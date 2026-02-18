export default function Select({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled,
  error,
  className = '',
  id,
  ...props
}) {
  return (
    <select
      id={id}
      className={`form-control${error ? ' error' : ''} ${className}`}
      value={value ?? ''}
      onChange={e => onChange?.(e.target.value === '' ? null : e.target.value)}
      disabled={disabled}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
