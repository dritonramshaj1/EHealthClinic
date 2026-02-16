import React from 'react'

const statusMap = {
  Scheduled: 'badge-warning',
  Completed: 'badge-success',
  Cancelled: 'badge-danger',
  Pending:   'badge-info',
  Paid:      'badge-success',
  Failed:    'badge-danger',
}

export default function StatusBadge({ status }) {
  const cls = statusMap[status] || ''
  return <span className={`badge ${cls}`}>{status}</span>
}
