import Modal from './Modal.jsx'
import Button from './Button.jsx'

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  const footer = (
    <>
      <Button variant="ghost" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
      <Button variant={variant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
    </>
  )
  return (
    <Modal open={open} onClose={onClose} title={title} footer={footer}>
      <div className="confirm-dialog">
        {message && <p className="text-secondary mb-4">{message}</p>}
      </div>
    </Modal>
  )
}
