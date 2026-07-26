import { useEffect, useMemo, useState } from 'react'
import { Card } from '@renderer/components/Card'
import { StatusPill } from '@renderer/components/StatusPill'
import { EmptyState } from '@renderer/components/EmptyState'
import { Meter } from '@renderer/components/Meter'
import {
  DATE_RANGE_PRESETS,
  getDateRangeBounds,
  getPriorRangeBounds,
  isWithinRange,
  presetToGoalPeriod,
  type DateRangePreset
} from '@renderer/lib/dateRange'
import { formatDateTime, formatDuration } from '@renderer/lib/format'
import { sessionTone } from '@renderer/lib/statusTones'
import { computePlatformSummaries } from '@renderer/lib/platformSummary'
import { computeTrendCallout } from '@renderer/lib/trendCallout'
import type { Goal, MetricSnapshot, StreamSession } from '@shared/schemas'
import styles from './Analytics.module.css'

const PERIOD_LABEL: Record<string, string> = { weekly: 'Weekly goals', monthly: 'Monthly goals' }
const PRIOR_PERIOD_LABEL: Record<string, string> = { '7d': 'week', '30d': 'month' }

export function Analytics(): JSX.Element {
  const [sessions, setSessions] = useState<StreamSession[]>([])
  const [metrics, setMetrics] = useState<MetricSnapshot[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [preset, setPreset] = useState<DateRangePreset>('30d')

  useEffect(() => {
    Promise.all([
      window.commandCenter.db.listSessions(),
      window.commandCenter.db.listMetricSnapshots(),
      window.commandCenter.db.listGoals()
    ]).then(([sessionsResult, metricsResult, goalsResult]) => {
      setSessions(sessionsResult)
      setMetrics(metricsResult)
      setGoals(goalsResult)
      setLoading(false)
    })
  }, [])

  const bounds = useMemo(() => getDateRangeBounds(preset), [preset])
  const filtered = useMemo(() => sessions.filter((session) => isWithinRange(session.startedAt, bounds)), [sessions, bounds])
  const platformSummaries = useMemo(() => computePlatformSummaries(filtered, metrics), [filtered, metrics])

  const goalPeriod = presetToGoalPeriod(preset)
  const visibleGoals = goalPeriod ? goals.filter((goal) => goal.period.toLowerCase() === goalPeriod) : goals

  const priorBounds = useMemo(() => getPriorRangeBounds(bounds), [bounds])
  const trendCallout = useMemo(
    () => (priorBounds ? computeTrendCallout(sessions, bounds, priorBounds) : undefined),
    [sessions, bounds, priorBounds]
  )
  const periodLabel = PRIOR_PERIOD_LABEL[preset]

  return (
    <div className={styles.wrap}>
      <div className={styles.filterRow}>
        {DATE_RANGE_PRESETS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={[styles.filterButton, preset === option.value ? styles.filterButtonActive : ''].join(' ')}
            onClick={() => setPreset(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {!loading && (
        <Card
          title="Goals"
          subtitle={goalPeriod ? `${PERIOD_LABEL[goalPeriod]} — not scoped to the date range above` : 'All goals'}
        >
          {goals.length === 0 ? (
            <EmptyState icon="◎" title="No goals set" description="Add goals from Mission Control to track progress here." />
          ) : visibleGoals.length === 0 ? (
            <EmptyState
              icon="◎"
              title={`No ${goalPeriod} goals`}
              description="Switch to “All time” to see goals tracked on a different cadence."
            />
          ) : (
            <div className={styles.goalsList}>
              {visibleGoals.map((goal) => (
                <Meter key={goal.id} label={goal.label} current={goal.currentValue} target={goal.target} unit={goal.unit} />
              ))}
            </div>
          )}
        </Card>
      )}

      {!loading && filtered.length > 0 && (
        <Card title="Platform summary" subtitle="Sessions, hours, and recorded metrics in this range">
          <div className={styles.platformGrid}>
            {platformSummaries.map((summary) => (
              <div className={styles.platformCard} key={summary.platform}>
                <span className={styles.platformName}>{summary.platform}</span>
                <div className={styles.platformStats}>
                  <span>
                    <span className={styles.platformStatValue}>{summary.sessionCount}</span> session
                    {summary.sessionCount === 1 ? '' : 's'}
                  </span>
                  <span>
                    <span className={styles.platformStatValue}>{summary.totalHours}</span> h
                  </span>
                </div>
                {summary.metricTotals.length > 0 && (
                  <div className={styles.platformMetricList}>
                    {summary.metricTotals.map((metric) => (
                      <div className={styles.platformMetricRow} key={metric.metricName}>
                        <span>{metric.metricName}</span>
                        <span>{metric.total}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {!loading && trendCallout && (
        <Card title="Trends" subtitle={`Compared to the prior ${periodLabel}`}>
          {trendCallout.kind === 'insufficient-history' ? (
            <p className={styles.timelineMeta}>
              Not enough recorded history yet to compare to the prior {periodLabel} — check back once you have a full{' '}
              {periodLabel} on each side.
            </p>
          ) : (
            <div className={styles.trendList}>
              <div className={styles.trendRow}>
                <span className={styles.trendValue}>{trendCallout.currentSessions}</span>
                <span>
                  session{trendCallout.currentSessions === 1 ? '' : 's'} this {periodLabel} vs.{' '}
                  <span className={styles.trendValue}>{trendCallout.priorSessions}</span> last {periodLabel}
                </span>
              </div>
              <div className={styles.trendRow}>
                <span className={styles.trendValue}>{trendCallout.currentHours}h</span>
                <span>
                  this {periodLabel} vs. <span className={styles.trendValue}>{trendCallout.priorHours}h</span> last{' '}
                  {periodLabel}
                </span>
              </div>
            </div>
          )}
        </Card>
      )}

      <Card
        title="Session timeline"
        subtitle={loading ? undefined : `${filtered.length} session${filtered.length === 1 ? '' : 's'} in this range`}
      >
        {loading ? (
          <p className={styles.timelineMeta}>Loading…</p>
        ) : sessions.length === 0 ? (
          <EmptyState
            icon="◫"
            title="No sessions recorded yet"
            description="Start a stream from the Streaming screen or add one manually from Mission Control."
          />
        ) : filtered.length === 0 ? (
          <EmptyState icon="◫" title="No sessions in this range" description="Try a wider date range to see earlier sessions." />
        ) : (
          <div className={styles.timelineList}>
            {filtered.map((session) => (
              <div className={styles.timelineRow} key={session.id}>
                <div className={styles.timelineLeft}>
                  <span className={styles.timelineTitle}>{session.title}</span>
                  <span className={styles.timelineMeta}>
                    {session.platform} · {formatDateTime(session.startedAt)}
                  </span>
                </div>
                <div className={styles.timelineRight}>
                  <span className={styles.timelineDuration}>{formatDuration(session.durationSeconds)}</span>
                  <StatusPill tone={sessionTone(session.status)} label={session.status} pulse={session.status === 'live'} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
