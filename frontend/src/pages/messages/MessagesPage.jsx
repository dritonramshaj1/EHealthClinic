import { useState, useEffect } from 'react'
import PageHeader from '../../components/layout/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import Modal from '../../components/ui/Modal.jsx'
import FormField from '../../components/ui/FormField.jsx'
import Select from '../../components/ui/Select.jsx'
import { Card, CardBody } from '../../components/ui/Card.jsx'
import { messagesApi } from '../../api/services/messagesApi.js'
import { directoryApi } from '../../api/services/directoryApi.js'
import { useAuth } from '../../state/AuthContext.jsx'
import { useLang } from '../../state/LanguageContext.jsx'

// Kush mund t'i dërgojë mesazhe kujt (sipas rolit). Patient vetëm doktorëve; të tjerët me messages.write → doktorë + pacientë.
const RECIPIENT_BY_ROLE = {
  Patient: 'doctors',
  Doctor: 'doctors_and_patients',
  Admin: 'doctors_and_patients',
  Receptionist: 'doctors_and_patients',
  LabTechnician: 'doctors_and_patients',
  Pharmacist: 'doctors_and_patients',
  HRManager: 'doctors_and_patients',
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString()
}

export default function MessagesPage() {
  const { user, hasPermission, primaryRole } = useAuth()
  const { t } = useLang()
  const [tab, setTab] = useState('inbox')
  const [inbox, setInbox] = useState([])
  const [sent, setSent] = useState([])
  const [loading, setLoading] = useState(true)
  const [composeOpen, setComposeOpen] = useState(false)
  const [threadOpen, setThreadOpen] = useState(false)
  const [thread, setThread] = useState([])
  const [threadId, setThreadId] = useState(null)

  const [recipients, setRecipients] = useState([]) // { value: userId, label }
  const [recipientId, setRecipientId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')

  const loadInbox = () => messagesApi.getInbox(50).then(res => setInbox(res.data || [])).catch(() => setInbox([]))
  const loadSent = () => messagesApi.getSent(50).then(res => setSent(res.data || [])).catch(() => setSent([]))

  useEffect(() => {
    setLoading(true)
    Promise.all([loadInbox(), loadSent()]).finally(() => setLoading(false))
  }, [])

  // Ngarkim marrësish sipas rolit (RECIPIENT_BY_ROLE). Vetëm rolet me messages.write shohin butonin "New message".
  useEffect(() => {
    if (!composeOpen || !hasPermission('messages.write')) return
    const rule = RECIPIENT_BY_ROLE[primaryRole] ?? 'doctors_and_patients'
    if (rule === 'doctors') {
      directoryApi.getDoctors().then(res => {
        const list = (res.data || []).filter(d => d.userId).map(d => ({
          value: String(d.userId),
          label: `${d.name}${d.specialty ? ` (${d.specialty})` : ''}`,
        }))
        setRecipients(list)
      }).catch(() => setRecipients([]))
    } else {
      const buildDoctors = (data) => (data || []).filter(d => d.userId).map(d => ({
        value: String(d.userId),
        label: `${d.name}${d.specialty ? ` (${d.specialty})` : ''} – Doctor`,
      }))
      directoryApi.getDoctors()
        .then(drRes => {
          const doctors = buildDoctors(drRes.data)
          directoryApi.getPatients()
            .then(prRes => {
              const patients = (prRes.data || []).filter(p => p.userId).map(p => ({
                value: String(p.userId),
                label: `${p.name} – Patient`,
              }))
              setRecipients([...doctors, ...patients])
            })
            .catch(() => setRecipients(doctors))
        })
        .catch(() => setRecipients([]))
    }
  }, [composeOpen, primaryRole, hasPermission])

  const openThread = (msg) => {
    setThreadId(msg.threadId)
    setThreadOpen(true)
    messagesApi.getThread(msg.threadId)
      .then(res => setThread(res.data || []))
      .catch(() => setThread([]))
    if (!msg.isRead && msg.recipientId === user?.id) {
      messagesApi.markAsRead(msg.id).then(() => loadInbox()).catch(() => {})
    }
  }

  const handleSend = (e) => {
    e.preventDefault()
    setSendError('')
    if (!recipientId) { setSendError('Select a recipient'); return }
    setSending(true)
    messagesApi.send({
      senderId: user?.id,
      recipientId,
      subject: subject.trim() || '(No subject)',
      body: body.trim() || '',
    })
      .then(() => {
        setComposeOpen(false)
        setRecipientId('')
        setSubject('')
        setBody('')
        loadSent()
        loadInbox()
      })
      .catch(err => {
        const msg = err.response?.data?.message ?? err.response?.data?.title ?? err.message
        setSendError(msg || 'Failed to send')
      })
      .finally(() => setSending(false))
  }

  const list = tab === 'inbox' ? inbox : sent
  const columns = [
    { key: tab === 'inbox' ? 'senderName' : 'recipientName', header: tab === 'inbox' ? 'From' : 'To' },
    { key: 'subject', header: 'Subject' },
    { key: 'isRead', header: '', render: row => (tab === 'inbox' && !row.isRead ? <span className="badge badge-primary">New</span> : null) },
    { key: 'createdAtUtc', header: 'Date', render: row => formatDate(row.createdAtUtc) },
  ]

  const recipientOptions = recipients

  return (
    <>
      <PageHeader
        title={t('pages.messages.title')}
        subtitle={t('pages.messages.subtitle')}
        actions={
          hasPermission('messages.write') && (
            <Button variant="primary" onClick={() => setComposeOpen(true)}>New message</Button>
          )
        }
      />

      <div className="tabs mb-4">
        <button className={`tab-item${tab === 'inbox' ? ' active' : ''}`} onClick={() => setTab('inbox')}>Inbox</button>
        <button className={`tab-item${tab === 'sent' ? ' active' : ''}`} onClick={() => setTab('sent')}>Sent</button>
      </div>

      <Card>
        <CardBody className="p-0">
          {loading ? (
            <p className="p-6 text-muted">Loading...</p>
          ) : list.length === 0 ? (
            <p className="p-6 text-muted">{tab === 'inbox' ? 'No messages in inbox.' : 'No sent messages.'}</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    {columns.map((col, i) => <th key={i}>{col.header}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {list.map(row => (
                    <tr key={row.id} onClick={() => openThread(row)} style={{ cursor: 'pointer' }}>
                      {columns.map((col, ci) => (
                        <td key={ci}>{col.render ? col.render(row) : row[col.key]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Compose modal */}
      <Modal open={composeOpen} onClose={() => !sending && setComposeOpen(false)} title="New message" size="lg">
        <form onSubmit={handleSend}>
          {sendError && <p className="text-danger mb-3">{sendError}</p>}
          <FormField label="To" required>
            <Select
              options={recipientOptions}
              value={recipientId}
              onChange={setRecipientId}
              placeholder={recipientOptions.length ? 'Select recipient' : 'No recipients available'}
            />
            {composeOpen && !recipientOptions.length && (
              <p className="text-sm text-muted mt-1">No recipients in directory for your role.</p>
            )}
          </FormField>
          <FormField label="Subject">
            <input
              type="text"
              className="form-control"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Subject"
            />
          </FormField>
          <FormField label="Message">
            <textarea
              className="form-control"
              rows={5}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your message..."
            />
          </FormField>
          <div className="modal-footer">
            <Button type="button" variant="ghost" onClick={() => setComposeOpen(false)} disabled={sending}>Cancel</Button>
            <Button type="submit" variant="primary" loading={sending}>Send</Button>
          </div>
        </form>
      </Modal>

      {/* Thread modal */}
      <Modal open={threadOpen} onClose={() => setThreadOpen(false)} title="Conversation" size="lg">
        <div className="d-flex flex-col gap-3">
          {thread.map(m => (
            <div
              key={m.id}
              className="p-4 rounded-lg border"
              style={{
                marginLeft: m.senderId === user?.id ? '2rem' : 0,
                marginRight: m.senderId === user?.id ? 0 : '2rem',
                background: m.senderId === user?.id ? 'var(--color-primary-subtle)' : 'var(--color-gray-50)',
              }}
            >
              <div className="d-flex justify-between items-center mb-2">
                <strong>{m.senderId === user?.id ? 'You' : (m.senderName || 'Unknown')}</strong>
                <span className="text-sm text-muted">{formatDate(m.createdAtUtc)}</span>
              </div>
              <div className="font-medium text-secondary mb-1">{m.subject}</div>
              <div>{m.body}</div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  )
}
