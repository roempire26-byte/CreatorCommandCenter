import { useEffect, useState } from 'react'
import { Card } from '@renderer/components/Card'
import { StatusPill } from '@renderer/components/StatusPill'
import { EmptyState } from '@renderer/components/EmptyState'
import { buttonClassName } from '@renderer/components/Button'
import { automationRunTone } from '@renderer/lib/statusTones'
import { formatDateTime } from '@renderer/lib/format'
import type { AutomationRun } from '@shared/schemas'
import styles from './Automations.module.css'

export function Automations(): JSX.Element {
  const [runs, setRuns] = useState<AutomationRun[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    window.commandCenter.db.listAutomationRuns().then((result) => {
      setRuns(result)
      setLoading(false)
    })
  }, [])

  async function handleRun(): Promise<void> {
    setRunning(true)
    try {
      const run = await window.commandCenter.automation.runContentReviewCheck()
      setRuns((prev) => [run, ...prev])
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <Card
        title="Content review check"
        subtitle="Flags content items sitting in review for 3+ days — reads only, changes nothing"
      >
        <p className={styles.hint}>
          Runs locally, right now, on demand. It never posts, deletes, or spends money — it only reads content items and
          logs what it would flag for your attention.
        </p>
        <button type="button" className={buttonClassName('secondary')} onClick={handleRun} disabled={running}>
          {running ? 'Running…' : 'Run now'}
        </button>
      </Card>

      <Card title="Automation runs" subtitle="Every run — status, timing, and result">
        {loading ? (
          <p className={styles.hint}>Loading…</p>
        ) : runs.length === 0 ? (
          <EmptyState
            icon="◈"
            title="No automation runs yet"
            description="Run the content review check above, or wait for a future workflow — every run leaves a record here, even when it finds nothing."
          />
        ) : (
          <div className={styles.runList}>
            {runs.map((run) => (
              <div className={styles.runRow} key={run.id}>
                <div className={styles.runLeft}>
                  <span className={styles.runWorkflow}>{run.workflow}</span>
                  <span className={styles.runMeta}>
                    Started {formatDateTime(run.startedAt)}
                    {run.completedAt ? ` · Completed ${formatDateTime(run.completedAt)}` : ''}
                  </span>
                  {run.result && <span className={styles.runResult}>{run.result}</span>}
                </div>
                <StatusPill tone={automationRunTone(run.status)} label={run.status} pulse={run.status === 'running'} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
