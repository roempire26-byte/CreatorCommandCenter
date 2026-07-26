import { useEffect, useState } from 'react'
import { Card } from '@renderer/components/Card'
import { StatusPill } from '@renderer/components/StatusPill'
import { EmptyState } from '@renderer/components/EmptyState'
import { automationRunTone } from '@renderer/lib/statusTones'
import { formatDateTime } from '@renderer/lib/format'
import type { AutomationRun } from '@shared/schemas'
import styles from './Automations.module.css'

export function Automations(): JSX.Element {
  const [runs, setRuns] = useState<AutomationRun[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.commandCenter.db.listAutomationRuns().then((result) => {
      setRuns(result)
      setLoading(false)
    })
  }, [])

  return (
    <div className={styles.wrap}>
      <Card title="Automation runs" subtitle="Every run — status, timing, and result">
        {loading ? (
          <p className={styles.hint}>Loading…</p>
        ) : runs.length === 0 ? (
          <EmptyState
            icon="◈"
            title="No automation runs yet"
            description="Workflows run locally, always logged here, and never post, delete, or spend money without a separate confirmation."
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

      <Card title="What's coming" subtitle="Rest of Sprint 5">
        <p className={styles.hint}>
          A "Content review check" workflow you can run on demand — it scans content items sitting in review too long and
          logs what it would flag, without changing anything. No workflow in this app posts, deletes, or spends money
          without a separate, explicit confirmation.
        </p>
      </Card>
    </div>
  )
}
