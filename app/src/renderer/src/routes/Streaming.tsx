import { FormEvent, useEffect, useState } from 'react'
import { Card } from '@renderer/components/Card'
import { StatusPill } from '@renderer/components/StatusPill'
import { EmptyState } from '@renderer/components/EmptyState'
import { buttonClassName } from '@renderer/components/Button'
import { useObsStatus } from '@renderer/lib/useObsStatus'
import { obsStatusDisplay } from '@renderer/lib/obsStatusDisplay'
import type { ChecklistItem } from '@shared/schemas'
import styles from './Streaming.module.css'

export function Streaming(): JSX.Element {
  const obsStatus = useObsStatus()
  const display = obsStatusDisplay(obsStatus)

  const [items, setItems] = useState<ChecklistItem[]>([])
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [newLabel, setNewLabel] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.commandCenter.db.listChecklistItems().then((result) => {
      setItems(result)
      setLoading(false)
    })
  }, [])

  async function handleAdd(event: FormEvent): Promise<void> {
    event.preventDefault()
    const label = newLabel.trim()
    if (!label) return
    const item = await window.commandCenter.db.createChecklistItem({ label })
    setItems((prev) => [...prev, item])
    setNewLabel('')
  }

  async function handleRemove(id: string): Promise<void> {
    setItems((prev) => prev.filter((item) => item.id !== id))
    setChecked((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    await window.commandCenter.db.deleteChecklistItem(id)
  }

  function toggleChecked(id: string): void {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const emptyDescription =
    obsStatus.status === 'connected'
      ? `OBS is connected${obsStatus.sceneName ? ` — current scene: ${obsStatus.sceneName}` : ''}. Session start/end controls arrive later in Sprint 3.`
      : obsStatus.status === 'auth-required'
        ? 'OBS was found but needs a password. Set the OBS WebSocket password in Settings to connect.'
        : "OBS isn't connected yet. This screen will host start/end session controls once that slice of Sprint 3 lands."

  return (
    <div className={styles.wrap}>
      <Card title="OBS connection" subtitle="Local WebSocket connection">
        <div className={styles.statusRow}>
          <StatusPill tone={display.tone} label={display.label} pulse={display.pulse} />
        </div>
        <p className={styles.hint}>{emptyDescription}</p>
      </Card>

      <Card title="Pre-stream checklist" subtitle="Review before you go live — checked items reset each time you open the app">
        <form className={styles.addRow} onSubmit={handleAdd}>
          <input
            className={styles.addInput}
            placeholder="Add a checklist item…"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            aria-label="New checklist item"
          />
          <button type="submit" className={buttonClassName('secondary')}>
            Add
          </button>
        </form>

        {!loading && items.length === 0 && (
          <EmptyState icon="☑" title="No checklist items yet" description="Add the things you check before every stream." />
        )}

        {items.length > 0 && (
          <div className={styles.itemList}>
            {items.map((item) => {
              const isChecked = checked.has(item.id)
              return (
                <div className={styles.itemRow} key={item.id}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={isChecked}
                    onChange={() => toggleChecked(item.id)}
                    aria-label={item.label}
                  />
                  <span className={[styles.itemLabel, isChecked ? styles.itemLabelChecked : ''].join(' ')}>{item.label}</span>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => handleRemove(item.id)}
                    aria-label={`Remove ${item.label}`}
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card title="What's coming" subtitle="Rest of Sprint 3">
        <div className={styles.upcoming}>
          <div className={styles.upcomingItem}>
            <span className={styles.upcomingSprint}>Sprint 3</span>
            <span>Session start/end tracking and a live-session view</span>
          </div>
          <div className={styles.upcomingItem}>
            <span className={styles.upcomingSprint}>Sprint 3</span>
            <span>Confirmed OBS start/stop stream actions with audit logging</span>
          </div>
          <div className={styles.upcomingItem}>
            <span className={styles.upcomingSprint}>Sprint 3</span>
            <span>Post-stream briefing and manual metrics entry</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
