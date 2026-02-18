export default function Spinner({ size = '', center = false, label }) {
  const cls = ['spinner', size ? `spinner-${size}` : ''].filter(Boolean).join(' ')
  const el = <span className={cls} />
  if (center || label) {
    return (
      <div className="spinner-overlay">
        {el}
        {label && <span>{label}</span>}
      </div>
    )
  }
  return el
}
