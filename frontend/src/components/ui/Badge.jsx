// Maps common status values to badge colors automatically
const STATUS_MAP = {
  // Appointment
  Scheduled: 'primary', Completed: 'success', Cancelled: 'danger',
  'No-Show': 'warning', Confirmed: 'teal',
  // Queue
  Waiting: 'warning', Called: 'primary', InProgress: 'teal',
  Done: 'success', Skipped: 'gray',
  // Invoice
  Draft: 'gray', Issued: 'primary', Paid: 'success', Overdue: 'danger',
  Refunded: 'info', PartiallyPaid: 'warning',
  // Lab / Prescription
  Ordered: 'primary', Active: 'success', Dispensed: 'teal',
  Expired: 'gray', Pending: 'warning', Approved: 'success', Rejected: 'danger',
  // Insurance
  Submitted: 'primary', InReview: 'warning',
  // Inventory
  'Low Stock': 'danger',
  // Flags
  Normal: 'success', High: 'danger', Low: 'warning', Critical: 'danger',
  // Shifts
  Regular: 'primary', OnCall: 'warning', Overtime: 'danger',
  // Shift status
  Scheduled2: 'primary',
  // Boolean
  true: 'danger', false: 'success',
  // Generic
  info: 'info', error: 'danger', success: 'success', warning: 'warning',
}

export default function Badge({ children, variant, dot = false }) {
  const color = variant || STATUS_MAP[children] || 'gray'
  return (
    <span className={`badge badge-${color}`}>
      {dot && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'currentColor', display: 'inline-block',
        }} />
      )}
      {children}
    </span>
  )
}
