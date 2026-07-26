import { FormEvent, useState } from 'react'
import type { Goal } from '@shared/schemas'
import { buttonClassName } from '@renderer/components/Button'
import formStyles from './Form.module.css'

interface AddGoalFormProps {
  onCreated: (goal: Goal) => void
  onCancel: () => void
}

function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function AddGoalForm({ onCreated, onCancel }: AddGoalFormProps): JSX.Element {
  const [label, setLabel] = useState('')
  const [target, setTarget] = useState('')
  const [unit, setUnit] = useState('')
  const [period, setPeriod] = useState('monthly')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    const targetNumber = Number(target)
    const metric = slugify(label)
    if (!label.trim() || !metric || !Number.isFinite(targetNumber) || targetNumber <= 0) {
      setError('Give the goal a name and a target greater than 0.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const goal = await window.commandCenter.db.createGoal({
        metric,
        label: label.trim(),
        target: targetNumber,
        unit: unit.trim(),
        period: period.trim(),
        currentValue: 0
      })
      onCreated(goal)
    } catch {
      setError("Couldn't save this goal — check the fields and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className={formStyles.form} onSubmit={handleSubmit}>
      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="goal-label">
          Goal
        </label>
        <input
          id="goal-label"
          className={formStyles.input}
          placeholder="Hours streamed this month"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
        />
      </div>

      <div className={formStyles.row}>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="goal-target">
            Target
          </label>
          <input
            id="goal-target"
            type="number"
            min="0"
            step="any"
            className={formStyles.input}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            required
          />
        </div>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="goal-unit">
            Unit (optional)
          </label>
          <input
            id="goal-unit"
            className={formStyles.input}
            placeholder="h"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          />
        </div>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="goal-period">
            Period
          </label>
          <select id="goal-period" className={formStyles.select} value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
        </div>
      </div>

      {error && <span className={formStyles.error}>{error}</span>}

      <div className={formStyles.actions}>
        <button type="button" className={buttonClassName('quiet')} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={buttonClassName('primary')} disabled={submitting}>
          {submitting ? 'Saving…' : 'Save goal'}
        </button>
      </div>
    </form>
  )
}
