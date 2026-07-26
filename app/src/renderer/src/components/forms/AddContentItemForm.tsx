import { FormEvent, useState } from 'react'
import type { ContentItem } from '@shared/schemas'
import { buttonClassName } from '@renderer/components/Button'
import formStyles from './Form.module.css'

interface AddContentItemFormProps {
  onCreated: (item: ContentItem) => void
  onCancel: () => void
}

const STATUS_OPTIONS: ContentItem['status'][] = ['idea', 'captured', 'drafting', 'ready-for-review', 'approved', 'published']

export function AddContentItemForm({ onCreated, onCancel }: AddContentItemFormProps): JSX.Element {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('clip')
  const [status, setStatus] = useState<ContentItem['status']>('idea')
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    if (!title.trim() || !type.trim()) {
      setError('Give the content item a title and a type.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const item = await window.commandCenter.db.createContentItem({
        title: title.trim(),
        type: type.trim(),
        status,
        draft: draft.trim() || undefined
      })
      onCreated(item)
    } catch {
      setError("Couldn't save this content item — check the fields and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className={formStyles.form} onSubmit={handleSubmit}>
      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="content-title">
          Title
        </label>
        <input id="content-title" className={formStyles.input} value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className={formStyles.row}>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="content-type">
            Type
          </label>
          <input
            id="content-type"
            className={formStyles.input}
            placeholder="clip, title, post…"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
          />
        </div>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="content-status">
            Status
          </label>
          <select
            id="content-status"
            className={formStyles.select}
            value={status}
            onChange={(e) => setStatus(e.target.value as ContentItem['status'])}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.replace(/-/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="content-draft">
          Draft (optional)
        </label>
        <textarea id="content-draft" className={formStyles.textarea} value={draft} onChange={(e) => setDraft(e.target.value)} />
      </div>

      {error && <span className={formStyles.error}>{error}</span>}

      <div className={formStyles.actions}>
        <button type="button" className={buttonClassName('quiet')} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={buttonClassName('primary')} disabled={submitting}>
          {submitting ? 'Saving…' : 'Save content item'}
        </button>
      </div>
    </form>
  )
}
