import { useState, useRef, useEffect } from 'react'
import { Download, FileSpreadsheet, FileText, Braces, FileType } from 'lucide-react'
import Button from './Button.jsx'
import { downloadExport } from '../../api/services/exportApi.js'

const FORMATS = [
  { value: 'csv', label: 'CSV', Icon: FileText },
  { value: 'xlsx', label: 'Excel', Icon: FileSpreadsheet },
  { value: 'json', label: 'JSON', Icon: Braces },
  { value: 'pdf', label: 'PDF', Icon: FileText },
  { value: 'docx', label: 'Word (DOCX)', Icon: FileType },
]

export default function ExportDropdown({ resource, params = {}, label = 'Export', variant = 'secondary' }) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    if (open) document.addEventListener('click', onOutside)
    return () => document.removeEventListener('click', onOutside)
  }, [open])

  const handleExport = async (format) => {
    setOpen(false)
    setLoading(true)
    try {
      await downloadExport(resource, format, params)
    } catch (e) {
      console.error('Export failed', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dropdown" style={{ display: 'inline-block' }} ref={ref}>
      <Button
        variant={variant}
        disabled={loading}
        loading={loading}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {loading ? 'Exporting…' : (
          <span className="d-inline-flex align-items-center gap-1">
            <Download size={18} strokeWidth={2} />
            {label}
          </span>
        )}
      </Button>
      {open && (
        <ul className="dropdown-menu dropdown-menu-end show" style={{ display: 'block' }}>
          {FORMATS.map(({ value, label: fmtLabel, Icon }) => (
            <li key={value}>
              <button
                type="button"
                className="dropdown-item d-flex align-items-center gap-2"
                onClick={() => handleExport(value)}
                disabled={loading}
              >
                {Icon && <Icon size={18} strokeWidth={2} />}
                {fmtLabel}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
