import { useState, useEffect } from 'react'

const STORAGE_KEY = (userId) => `ehealth_dashboard_notes_${userId || 'anon'}`

export default function DashboardNotes({ userId }) {
  const key = STORAGE_KEY(userId)
  const [notes, setNotes] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [newText, setNewText] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(notes))
    } catch {}
  }, [key, notes])

  const addNote = (e) => {
    e.preventDefault()
    const text = newText.trim()
    if (!text) return
    setNotes([{ id: Date.now(), text, createdAt: new Date().toISOString() }, ...notes])
    setNewText('')
  }

  const removeNote = (id) => {
    setNotes(notes.filter((n) => n.id !== id))
  }

  return (
    <div className="dashboard-notes">
      <form onSubmit={addNote} className="dashboard-notes-form">
        <input
          type="text"
          className="form-control"
          placeholder="Shënim i shpejtë..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
        />
        <button type="submit" className="btn btn-primary btn-sm">Shto</button>
      </form>
      <ul className="dashboard-notes-list">
        {notes.length === 0 && (
          <li className="dashboard-notes-empty">Asnjë shënim. Shtoni një kujtesë të shpejtë.</li>
        )}
        {notes.map((n) => (
          <li key={n.id} className="dashboard-notes-item">
            <span className="dashboard-notes-text">{n.text}</span>
            <button type="button" className="dashboard-notes-remove" onClick={() => removeNote(n.id)} aria-label="Fshi">×</button>
          </li>
        ))}
      </ul>
      <style>{`
        .dashboard-notes-form { display: flex; gap: var(--space-2); margin-bottom: var(--space-3); }
        .dashboard-notes-form .form-control { flex: 1; }
        .dashboard-notes-list { list-style: none; padding: 0; margin: 0; max-height: 200px; overflow-y: auto; }
        .dashboard-notes-empty { color: var(--text-secondary); font-size: var(--font-size-sm); padding: var(--space-2) 0; }
        .dashboard-notes-item { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); padding: var(--space-2) 0; border-bottom: 1px solid var(--border-color); font-size: var(--font-size-sm); }
        .dashboard-notes-item:last-child { border-bottom: none; }
        .dashboard-notes-text { flex: 1; word-break: break-word; }
        .dashboard-notes-remove { background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.25rem; line-height: 1; padding: 0 var(--space-1); }
        .dashboard-notes-remove:hover { color: var(--color-danger); }
      `}</style>
    </div>
  )
}
