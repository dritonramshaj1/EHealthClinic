import { useState, useEffect } from 'react'
import PageHeader from '../../components/layout/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import Modal from '../../components/ui/Modal.jsx'
import FormField from '../../components/ui/FormField.jsx'
import Select from '../../components/ui/Select.jsx'
import { Card, CardBody } from '../../components/ui/Card.jsx'
import Table from '../../components/ui/Table.jsx'
import { documentsApi } from '../../api/services/documentsApi.js'
import { directoryApi } from '../../api/services/directoryApi.js'
import { useAuth } from '../../state/AuthContext.jsx'
import { useLang } from '../../state/LanguageContext.jsx'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString()
}

function formatSize(bytes) {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentsPage() {
  const { hasPermission } = useAuth()
  const { t } = useLang()
  const [patients, setPatients] = useState([])
  const [patientId, setPatientId] = useState('')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadForm, setUploadForm] = useState({ file: null, documentType: 'General', description: '' })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    directoryApi.getPatients().then(r => setPatients(r.data || [])).catch(() => setPatients([]))
  }, [])

  useEffect(() => {
    if (!patientId) { setList([]); return }
    setLoading(true)
    documentsApi.getByPatient(patientId)
      .then(res => setList(res.data || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [patientId])

  const handleDownload = (doc) => {
    documentsApi.download(doc.id)
      .then(res => {
        const blob = res.data
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = doc.originalFileName || 'document'
        a.click()
        URL.revokeObjectURL(url)
      })
      .catch(() => {})
  }

  const handleDelete = (doc) => {
    if (!confirm(`Delete "${doc.originalFileName}"?`)) return
    documentsApi.delete(doc.id).then(() => setList(prev => prev.filter(d => d.id !== doc.id))).catch(() => {})
  }

  const handleUpload = (e) => {
    e.preventDefault()
    if (!patientId || !uploadForm.file) return
    const formData = new FormData()
    formData.append('file', uploadForm.file)
    formData.append('documentType', uploadForm.documentType)
    if (uploadForm.description) formData.append('description', uploadForm.description)
    setUploading(true)
    documentsApi.upload(patientId, formData)
      .then(() => {
        setUploadOpen(false)
        setUploadForm({ file: null, documentType: 'General', description: '' })
        documentsApi.getByPatient(patientId).then(res => setList(res.data || []))
      })
      .catch(() => {})
      .finally(() => setUploading(false))
  }

  const columns = [
    { key: 'originalFileName', header: 'File' },
    { key: 'documentType', header: 'Type' },
    { key: 'description', header: 'Description', render: row => row.description || '—' },
    { key: 'fileSizeBytes', header: 'Size', render: row => formatSize(row.fileSizeBytes) },
    { key: 'uploadedAtUtc', header: 'Uploaded', render: row => formatDate(row.uploadedAtUtc) },
    {
      key: 'actions',
      header: 'Actions',
      render: row => (
        <span className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleDownload(row)}>Download</Button>
          {hasPermission('documents.write') && <Button variant="ghost" size="sm" className="text-danger" onClick={() => handleDelete(row)}>Delete</Button>}
        </span>
      ),
    },
  ]

  const patientOptions = patients.map(p => ({ value: p.id, label: p.name || p.email }))

  return (
    <>
      <PageHeader
        title={t('pages.documents.title')}
        subtitle={t('pages.documents.subtitle')}
        actions={
          patientId && hasPermission('documents.write') && (
            <Button variant="primary" onClick={() => setUploadOpen(true)}>Upload</Button>
          )
        }
      />
      <div className="content-block">
        <div className="mb-3">
          <Select
            options={patientOptions}
            value={patientId}
            onChange={setPatientId}
            placeholder="Select patient"
            style={{ width: 280 }}
          />
        </div>
        {!patientId ? (
          <Card>
            <CardBody>
              <p className="text-muted">Select a patient to view and manage their documents.</p>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody className="p-0">
              <Table
                columns={columns}
                data={list}
                loading={loading}
                emptyMessage="No documents"
                emptyIcon="📄"
              />
            </CardBody>
          </Card>
        )}
      </div>

      <Modal open={uploadOpen} onClose={() => !uploading && setUploadOpen(false)} title="Upload document">
        <form onSubmit={handleUpload}>
          <FormField label="File" required>
            <input
              type="file"
              className="form-control"
              onChange={e => setUploadForm(f => ({ ...f, file: e.target.files?.[0] || null }))}
            />
          </FormField>
          <FormField label="Type">
            <input type="text" className="form-control" value={uploadForm.documentType} onChange={e => setUploadForm(f => ({ ...f, documentType: e.target.value }))} placeholder="e.g. Lab, X-Ray" />
          </FormField>
          <FormField label="Description">
            <input type="text" className="form-control" value={uploadForm.description} onChange={e => setUploadForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" />
          </FormField>
          <div className="modal-footer">
            <Button type="button" variant="ghost" onClick={() => setUploadOpen(false)} disabled={uploading}>Cancel</Button>
            <Button type="submit" variant="primary" loading={uploading} disabled={!uploadForm.file}>Upload</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
