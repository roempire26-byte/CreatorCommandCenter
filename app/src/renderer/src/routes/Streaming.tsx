import { FormEvent, useEffect, useState } from 'react'
import { Card } from '@renderer/components/Card'
import { StatusPill } from '@renderer/components/StatusPill'
import { EmptyState } from '@renderer/components/EmptyState'
import { buttonClassName } from '@renderer/components/Button'
import { ConfirmDialog } from '@renderer/components/ConfirmDialog'
import { PostStreamBriefing } from '@renderer/components/PostStreamBriefing'
import { StartSessionForm } from '@renderer/components/forms/StartSessionForm'
import { useObsStatus } from '@renderer/lib/useObsStatus'
import { obsStatusDisplay } from '@renderer/lib/obsStatusDisplay'
import { useElapsedTime } from '@renderer/lib/useElapsedTime'
import type { ChecklistItem, StartSessionInput, StreamSession } from '@shared/schemas'
import styles from './Streaming.module.css'

export function Streaming(): JSX.Element {
  const obsStatus = useObsStatus()
  const display = obsStatusDisplay(obsStatus)
  const obsControllable = obsStatus.status === 'connected'

  const [items, setItems] = useState<ChecklistItem[]>([])
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [newLabel, setNewLabel] = useState('')
  const [loading, setLoading] = useState(true)

  const [liveSession, setLiveSession] = useState<StreamSession | null>(null)
  const [showStartForm, setShowStartForm] = useState(false)
  const [pendingStart, setPendingStart] = useState<StartSessionInput | null>(null)
  const [pendingEnd, setPendingEnd] = useState(false)
  const [ending, setEnding] = useState(false)
  const [briefingSession, setBriefingSession] = useState<StreamSession | null>(null)
  const elapsed = useElapsedTime(liveSession?.startedAt ?? null)

  useEffect(() => {
    Promise.all([window.commandCenter.db.listChecklistItems(), window.commandCenter.db.listSessions()]).then(
      ([checklistResult, sessions]) => {
        setItems(checklistResult)
        setLiveSession(sessions.find((session) => session.status === 'live') ?? null)
        setLoading(false)
      }
    )
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

  // Only route through the OBS confirmation when there's an actual OBS connection to act on;
  // otherwise this is purely local session bookkeeping and doesn't need approval.
  async function handleStartSubmit(input: StartSessionInput): Promise<void> {
    if (obsControllable) {
      setPendingStart(input)
      setShowStartForm(false)
      return
    }
    const session = await window.commandCenter.db.startSession(input)
    setLiveSession(session)
    setShowStartForm(false)
  }

  async function confirmStart(): Promise<void> {
    if (!pendingStart) return
    await window.commandCenter.obs.startStream()
    const session = await window.commandCenter.db.startSession(pendingStart)
    setLiveSession(session)
  }

  function handleEndClick(): void {
    if (!liveSession) return
    if (obsControllable && obsStatus.streaming) {
      setPendingEnd(true)
      return
    }
    void endLocalOnly()
  }

  async function endLocalOnly(): Promise<void> {
    if (!liveSession) return
    setEnding(true)
    try {
      const ended = await window.commandCenter.db.endSession(liveSession.id)
      setLiveSession(null)
      setChecked(new Set())
      setBriefingSession(ended)
    } finally {
      setEnding(false)
    }
  }

  async function confirmEnd(): Promise<void> {
    if (!liveSession) return
    await window.commandCenter.obs.stopStream()
    const ended = await window.commandCenter.db.endSession(liveSession.id)
    setLiveSession(null)
    setChecked(new Set())
    setBriefingSession(ended)
  }

  const obsHint = obsControllable
    ? `OBS is connected${obsStatus.sceneName ? ` — current scene: ${obsStatus.sceneName}` : ''}. Starting or ending a session here will also control OBS's stream output.`
    : obsStatus.status === 'auth-required'
      ? 'OBS was found but needs a password. Set the OBS WebSocket password in Settings to connect.'
      : "OBS isn't connected — session tracking below still works, it just won't control OBS's stream output."

  return (
    <div className={styles.wrap}>
      <Card title="OBS connection" subtitle="Local WebSocket connection">
        <div className={styles.statusRow}>
          <StatusPill tone={display.tone} label={display.label} pulse={display.pulse} />
        </div>
        <p className={styles.hint}>{obsHint}</p>
      </Card>

      <Card
        title="Session"
        subtitle={liveSession ? liveSession.platform : 'Nothing live right now'}
        action={liveSession ? <StatusPill tone="live" label="Live" pulse /> : undefined}
      >
        {liveSession ? (
          <>
            <p className={styles.hint}>
              <strong>{liveSession.title}</strong> — {elapsed} elapsed
            </p>
            <button type="button" className={buttonClassName('danger')} onClick={handleEndClick} disabled={ending}>
              {ending ? 'Ending…' : 'End stream'}
            </button>
          </>
        ) : showStartForm ? (
          <StartSessionForm
            submitLabel={obsControllable ? 'Review and start' : 'Start stream'}
            onSubmit={handleStartSubmit}
            onCancel={() => setShowStartForm(false)}
          />
        ) : (
          <button type="button" className={buttonClassName('primary')} onClick={() => setShowStartForm(true)}>
            Start stream
          </button>
        )}
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

      {pendingStart && (
        <ConfirmDialog
          title="Start streaming on OBS?"
          message={`This will tell OBS to start streaming now and mark "${pendingStart.title}" as live. Make sure your scene and audio are ready.`}
          confirmLabel="Start stream"
          confirmVariant="primary"
          onConfirm={confirmStart}
          onClose={() => setPendingStart(null)}
        />
      )}

      {pendingEnd && liveSession && (
        <ConfirmDialog
          title="Stop streaming on OBS?"
          message={`This will tell OBS to stop streaming now and end "${liveSession.title}".`}
          confirmLabel="End stream"
          confirmVariant="danger"
          onConfirm={confirmEnd}
          onClose={() => setPendingEnd(false)}
        />
      )}

      {briefingSession && <PostStreamBriefing session={briefingSession} onClose={() => setBriefingSession(null)} />}
    </div>
  )
}
