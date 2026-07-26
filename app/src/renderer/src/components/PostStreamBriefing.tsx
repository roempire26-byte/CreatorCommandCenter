import { FormEvent, useEffect, useState } from 'react'
import { Modal } from './Modal'
import { Meter } from './Meter'
import { StatusPill } from './StatusPill'
import { EmptyState } from './EmptyState'
import { buttonClassName } from './Button'
import { formatDuration } from '@renderer/lib/format'
import { contentItemTone } from '@renderer/lib/statusTones'
import type { ContentItem, Goal, MetricSnapshot, StreamSession } from '@shared/schemas'
import styles from './PostStreamBriefing.module.css'

interface PostStreamBriefingProps {
  session: StreamSession
  onClose: () => void
}

export function PostStreamBriefing({ session, onClose }: PostStreamBriefingProps): JSX.Element {
  const [goals, setGoals] = useState<Goal[]>([])
  const [pendingContent, setPendingContent] = useState<ContentItem[]>([])
  const [metrics, setMetrics] = useState<MetricSnapshot[]>([])
  const [loading, setLoading] = useState(true)

  const [metricName, setMetricName] = useState('')
  const [metricValue, setMetricValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([
      window.commandCenter.db.listGoals(),
      window.commandCenter.db.listContentItems(),
      window.commandCenter.db.listMetricSnapshotsForSession(session.id)
    ]).then(([goalsResult, contentResult, metricsResult]) => {
      setGoals(goalsResult)
      setPendingContent(contentResult.filter((item) => item.status === 'ready-for-review'))
      setMetrics(metricsResult)
      setLoading(false)
    })
  }, [session.id])

  async function handleAddMetric(event: FormEvent): Promise<void> {
    event.preventDefault()
    const value = Number(metricValue)
    if (!metricName.trim() || !Number.isFinite(value)) {
      setError('Give the metric a name and a numeric value.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const snapshot = await window.commandCenter.db.createMetricSnapshot({
        sessionId: session.id,
        platform: session.platform,
        metricName: metricName.trim(),
        value
      })
      setMetrics((prev) => [snapshot, ...prev])
      setMetricName('')
      setMetricValue('')
    } catch {
      setError("Couldn't save that metric — try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Post-stream briefing" onClose={onClose}>
      <div className={styles.section}>
        <span className={styles.sectionTitle}>{session.title}</span>
        <div className={styles.summaryRow}>
          <span>
            Platform <span className={styles.summaryValue}>{session.platform}</span>
          </span>
          <span>
            Duration <span className={styles.summaryValue}>{formatDuration(session.durationSeconds)}</span>
          </span>
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.sectionTitle}>Metrics for this session</span>
        <form className={styles.metricRow} onSubmit={handleAddMetric}>
          <input
            className={[styles.metricInput, styles.metricName].join(' ')}
            list="metric-name-suggestions"
            placeholder="Followers gained"
            value={metricName}
            onChange={(e) => setMetricName(e.target.value)}
            aria-label="Metric name"
          />
          <datalist id="metric-name-suggestions">
            <option value="Followers gained" />
            <option value="Subscribers gained" />
            <option value="Peak viewers" />
            <option value="Average viewers" />
          </datalist>
          <input
            type="number"
            step="any"
            className={[styles.metricInput, styles.metricValue].join(' ')}
            placeholder="Value"
            value={metricValue}
            onChange={(e) => setMetricValue(e.target.value)}
            aria-label="Metric value"
          />
          <button type="submit" className={buttonClassName('secondary')} disabled={submitting}>
            Add
          </button>
        </form>
        {error && <span className={styles.error}>{error}</span>}

        {metrics.length > 0 && (
          <div className={styles.metricList}>
            {metrics.map((metric) => (
              <div className={styles.metricListItem} key={metric.id}>
                <span>{metric.metricName}</span>
                <span>{metric.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && (
        <>
          <div className={styles.section}>
            <span className={styles.sectionTitle}>Goal progress</span>
            {goals.length === 0 ? (
              <EmptyState icon="◎" title="No goals set" description="Add goals from Mission Control to track progress here." />
            ) : (
              <div className={styles.goalsList}>
                {goals.map((goal) => (
                  <Meter key={goal.id} label={goal.label} current={goal.currentValue} target={goal.target} unit={goal.unit} />
                ))}
              </div>
            )}
          </div>

          <div className={styles.section}>
            <span className={styles.sectionTitle}>Content pending review</span>
            {pendingContent.length === 0 ? (
              <EmptyState icon="▤" title="Nothing pending" description="No content items are waiting for review right now." />
            ) : (
              <div className={styles.contentList}>
                {pendingContent.map((item) => (
                  <div className={styles.contentRow} key={item.id}>
                    <span>{item.title}</span>
                    <StatusPill tone={contentItemTone(item.status)} label="Needs review" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className={styles.doneRow}>
        <button type="button" className={buttonClassName('primary')} onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  )
}
