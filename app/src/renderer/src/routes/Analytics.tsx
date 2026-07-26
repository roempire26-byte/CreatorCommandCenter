import { useEffect, useMemo, useState } from 'react'
import { Card } from '@renderer/components/Card'
import { StatusPill } from '@renderer/components/StatusPill'
import { EmptyState } from '@renderer/components/EmptyState'
import { DATE_RANGE_PRESETS, getDateRangeBounds, isWithinRange, type DateRangePreset } from '@renderer/lib/dateRange'
import { formatDateTime, formatDuration } from '@renderer/lib/format'
import { sessionTone } from '@renderer/lib/statusTones'
import type { StreamSession } from '@shared/schemas'
import styles from './Analytics.module.css'

export function Analytics(): JSX.Element {
  const [sessions, setSessions] = useState<StreamSession[]>([])
  const [loading, setLoading] = useState(true)
  const [preset, setPreset] = useState<DateRangePreset>('30d')

  useEffect(() => {
    window.commandCenter.db.listSessions().then((result) => {
      setSessions(result)
      setLoading(false)
    })
  }, [])

  const bounds = useMemo(() => getDateRangeBounds(preset), [preset])
  const filtered = useMemo(() => sessions.filter((session) => isWithinRange(session.startedAt, bounds)), [sessions, bounds])

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
