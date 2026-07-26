import { FormEvent, useState } from 'react'
import type { StreamSession } from '@shared/schemas'
import { buttonClassName } from '@renderer/components/Button'
import formStyles from './Form.module.css'

interface AddSessionFormProps {
  onCreated: (session: StreamSession) => void
  onCancel: () => void
}

function toIsoOrUndefined(localValue: string): string | undefined {
  if (!localValue) return undefined
  const date = new Date(localValue)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export function AddSessionForm({ onCreated, onCancel }: AddSessionFormProps): JSX.Element {
  const [title, setTitle] = useState('')
  const [platform, setPlatform] = useState('Twitch')
  const [status, setStatus] = useState<'live' | 'completed' | 'cancelled'>('completed')
  const [startedAt, setStartedAt] = useState('')
  const [endedAt, setEndedAt] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    const startedIso = toIsoOrUndefined(startedAt)
    if (!title.trim() || !platform.trim() || !startedIso) {
      setError('Title, platform, and start time are required.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const session = await window.commandCenter.db.createSession({
        title: title.trim(),
        platform: platform.trim(),
        status,
        startedAt: startedIso,
        endedAt: toIsoOrUndefined(endedAt),
        notes: notes.trim() || undefined
      })
      onCreated(session)
    } catch {
      setError("Couldn't save this session — check the fields and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className={formStyles.form} onSubmit={handleSubmit}>
      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="session-title">
          Title
        </label>
        <input id="session-title" className={formStyles.input} value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className={formStyles.row}>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="session-platform">
            Platform
          </label>
          <input
            id="session-platform"
            className={formStyles.input}
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            required
          />
        </div>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="session-status">
            Status
          </label>
          <select
            id="session-status"
            className={formStyles.select}
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="live">Live</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className={formStyles.row}>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="session-started">
            Started
          </label>
          <input
            id="session-started"
            type="datetime-local"
            className={formStyles.input}
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
            required
          />
        </div>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="session-ended">
            Ended (optional)
          </label>
          <input
            id="session-ended"
            type="datetime-local"
            className={formStyles.input}
            value={endedAt}
            onChange={(e) => setEndedAt(e.target.value)}
          />
        </div>
      </div>

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="session-notes">
          Notes (optional)
        </label>
        <textarea id="session-notes" className={formStyles.textarea} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error && <span className={formStyles.error}>{error}</span>}

      <div className={formStyles.actions}>
        <button type="button" className={buttonClassName('quiet')} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={buttonClassName('primary')} disabled={submitting}>
          {submitting ? 'Saving…' : 'Save session'}
        </button>
      </div>
    </form>
  )
}
