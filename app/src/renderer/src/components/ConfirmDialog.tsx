import { useState } from 'react'
import { Modal } from './Modal'
import { buttonClassName, type ButtonVariant } from './Button'
import formStyles from './forms/Form.module.css'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel: string
  confirmVariant?: ButtonVariant
  onConfirm: () => Promise<void>
  onClose: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmVariant = 'primary',
  onConfirm,
  onClose
}: ConfirmDialogProps): JSX.Element {
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleConfirm(): Promise<void> {
    setSubmitting(true)
    setError(null)
    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong — try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <p className={formStyles.label}>{message}</p>
      {error && <span className={formStyles.error}>{error}</span>}
      <div className={formStyles.actions}>
        <button type="button" className={buttonClassName('quiet')} onClick={onClose} disabled={submitting}>
          Cancel
        </button>
        <button type="button" className={buttonClassName(confirmVariant)} onClick={handleConfirm} disabled={submitting}>
          {submitting ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
