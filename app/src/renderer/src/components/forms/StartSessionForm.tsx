import { FormEvent, useState } from 'react'
import type { StartSessionInput } from '@shared/schemas'
import { buttonClassName } from '@renderer/components/Button'
import formStyles from './Form.module.css'

interface StartSessionFormProps {
  submitLabel: string
  onSubmit: (input: StartSessionInput) => Promise<void>
  onCancel: () => void
}

export function StartSessionForm({ submitLabel, onSubmit, onCancel }: StartSessionFormProps): JSX.Element {
  const [title, setTitle] = useState('')
  const [platform, setPlatform] = useState('Twitch')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    if (!title.trim() || !platform.trim()) {
      setError('Give the session a title and a platform.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({ title: title.trim(), platform: platform.trim() })
    } catch {
      setError("Couldn't start the session — check the fields and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className={formStyles.form} onSubmit={handleSubmit}>
      <div className={formStyles.row}>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="start-session-title">
            Title
          </label>
          <input
            id="start-session-title"
            className={formStyles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="start-session-platform">
            Platform
          </label>
          <input
            id="start-session-platform"
            className={formStyles.input}
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            required
          />
        </div>
      </div>

      {error && <span className={formStyles.error}>{error}</span>}

      <div className={formStyles.actions}>
        <button type="button" className={buttonClassName('quiet')} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={buttonClassName('primary')} disabled={submitting}>
          {submitting ? 'Starting…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
