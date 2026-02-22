import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FileSpreadsheet, Download } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import Table from '../../components/ui/Table.jsx'
import { Card, CardBody } from '../../components/ui/Card.jsx'
import ExportDropdown from '../../components/ui/ExportDropdown.jsx'
import Modal from '../../components/ui/Modal.jsx'
import FormField from '../../components/ui/FormField.jsx'
import { api } from '../../api/axios.js'
import { patientsApi } from '../../api/services/patientsApi.js'
import { useAuth } from '../../state/AuthContext.jsx'
import { useLang } from '../../state/LanguageContext.jsx'

async function downloadPatientImportTemplate() {
  const res = await api.get('/import/patients/template', { responseType: 'blob' })
  const disposition = res.headers['content-disposition']
  let filename = `Patient_Import_Template_${new Date().toISOString().slice(0, 10)}.xlsx`
  if (disposition) {
    const m = disposition.match(/filename="?([^";\n]+)"?/i)
    if (m) filename = m[1].trim()
  }
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function PatientsPage() {
  const navigate = useNavigate()
  const { hasPermission, hasRole } = useAuth()
  const { t } = useLang()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importPassword, setImportPassword] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    patientsApi.list({ q: search || undefined })
      .then(res => { if (!cancelled) setList(res.data || []) })
      .catch(() => { if (!cancelled) setList([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [search])

  const handleImport = async (e) => {
    e.preventDefault()
    if (!importFile || !importPassword.trim() || importPassword.length < 8) return
    setImporting(true)
    setImportResult(null)
    const form = new FormData()
    form.append('file', importFile)
    form.append('defaultPassword', importPassword)
    try {
      const res = await api.post('/import/patients', form)
      setImportResult(res.data)
      if (res.data?.created > 0) {
        const n = res.data.created
        toast.success(n === 1 ? 'Keni regjistruar me sukses një përdorues të ri.' : `Keni regjistruar me sukses ${n} përdorues të rinj.`)
        patientsApi.list({ q: search || undefined }).then(r => setList(r.data || []))
        setImportOpen(false)
        setImportFile(null)
        setImportPassword('')
      }
    } catch (err) {
      const data = err.response?.data
      const message = typeof data === 'string' ? data : (data?.error ?? data?.message ?? data?.title)
      setImportResult({ error: message || err.message || 'Import dështoi. Kontrollo skedarin dhe fjalëkalimin.' })
    } finally {
      setImporting(false)
    }
  }

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'id', header: 'MRN / ID', render: row => <span className="text-muted text-sm">{row.id?.slice(0, 8)}…</span> },
  ]

  return (
    <>
      <PageHeader
        title={t('pages.patients.title')}
        subtitle={t('pages.patients.subtitle')}
        actions={
          <div className="d-flex gap-2 align-items-center flex-wrap">
            {hasRole('Admin') && <ExportDropdown resource="patients" />}
            {hasRole('Admin') && (
              <Button variant="secondary" onClick={() => setImportOpen(true)}>
                <span className="d-inline-flex align-items-center gap-1">
                  <FileSpreadsheet size={18} strokeWidth={2} />
                  Import
                </span>
              </Button>
            )}
            {hasPermission('patients.write') && hasPermission('users.write') && (
              <Button variant="primary" onClick={() => navigate('/patients/new')}>
                New patient
              </Button>
            )}
          </div>
        }
      />
      <Card>
        <div className="filter-bar">
          <input
            type="search"
            className="form-control"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 320 }}
          />
        </div>
        <CardBody className="p-0">
          <Table
            columns={columns}
            data={list}
            loading={loading}
            emptyMessage="No patients found"
            emptyIcon="👥"
            onRowClick={row => navigate(`/patients/${row.id}`, { state: { patient: row } })}
          />
        </CardBody>
      </Card>

      <Modal open={importOpen} onClose={() => !importing && setImportOpen(false)} title="Import patients">
        <p className="text-secondary small mb-2">
          Ngarko një skedar CSV ose Excel (.xlsx). Kolonat: FullName, Email, BloodType, DateOfBirth, Allergies, Phone (opsional). Rreshti i parë = header.
        </p>
        <p className="mb-3">
          <Button type="button" variant="ghost" size="sm" onClick={downloadPatientImportTemplate} className="d-inline-flex align-items-center gap-1">
            <Download size={16} />
            Shkarko shabllonin Excel
          </Button>
        </p>
        <form onSubmit={handleImport}>
          <FormField label="Skedar (CSV ose Excel)" required>
            <input
              type="file"
              accept=".csv,.xlsx"
              className="form-control"
              onChange={e => setImportFile(e.target.files?.[0] || null)}
            />
          </FormField>
          <FormField label="Fjalëkalimi fillestar (për llogaritë e reja)" required>
            <input
              type="password"
              className="form-control"
              value={importPassword}
              onChange={e => setImportPassword(e.target.value)}
              placeholder="Min. 8 karaktere, shkronjë e vogël + shifër"
              minLength={8}
            />
          </FormField>
          {importResult?.error && <p className="text-danger mb-2">{importResult.error}</p>}
          {importResult?.created != null && !importResult.error && (
            <p className="text-success mb-2">{importResult.message}</p>
          )}
          {importResult?.errors?.length > 0 && (
            <ul className="small text-warning mb-2" style={{ maxHeight: 120, overflow: 'auto' }}>
              {importResult.errors.slice(0, 10).map((err, i) => <li key={i}>{err}</li>)}
              {importResult.errors.length > 10 && <li>… and {importResult.errors.length - 10} more</li>}
            </ul>
          )}
          <div className="modal-footer">
            <Button type="button" variant="ghost" onClick={() => setImportOpen(false)} disabled={importing}>Anulo</Button>
            <Button type="submit" variant="primary" loading={importing} disabled={!importFile || importPassword.length < 8}>
              Ngarko
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
