import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@renderer/components/Card'
import { buttonClassName } from '@renderer/components/Button'
import { StatusPill } from '@renderer/components/StatusPill'
import { Meter } from '@renderer/components/Meter'
import { EmptyState } from '@renderer/components/EmptyState'
import { Modal } from '@renderer/components/Modal'
import { AddSessionForm } from '@renderer/components/forms/AddSessionForm'
import { AddGoalForm } from '@renderer/components/forms/AddGoalForm'
import { AddContentItemForm } from '@renderer/components/forms/AddContentItemForm'
import { useObsStatus } from '@renderer/lib/useObsStatus'
import { obsStatusDisplay } from '@renderer/lib/obsStatusDisplay'
import { formatDateTime, formatDuration } from '@renderer/lib/format'
import { contentItemTone } from '@renderer/lib/statusTones'
import type { ActivityLogEntry, ContentItem, Goal, StreamSession } from '@shared/schemas'
import styles from './MissionControl.module.css'

const TONE_COLOR: Record<string, string> = {
  success: 'var(--status-success)',
  warning: 'var(--status-warning)',
  danger: 'var(--status-danger)',
  live: 'var(--accent-cyan)',
  neutral: 'var(--text-muted)'
}

type ActiveModal = 'session' | 'goal' | 'content' | null

export function MissionControl(): JSX.Element {
  const [sessions, setSessions] = useState<StreamSession[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [activity, setActivity] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)
  const obsStatus = useObsStatus()
  const display = obsStatusDisplay(obsStatus)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      window.commandCenter.db.listSessions(),
      window.commandCenter.db.listGoals(),
      window.commandCenter.db.listContentItems(),
      window.commandCenter.db.listActivity(20)
    ]).then(([sessionsResult, goalsResult, contentResult, activityResult]) => {
      if (cancelled) return
      setSessions(sessionsResult)
      setGoals(goalsResult)
      setContentItems(contentResult)
      setActivity(activityResult)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <p className={styles.notes}>Loading Mission Control…</p>

  const recentSession = sessions[0]
  const needsReview = contentItems.filter((item) => item.status === 'ready-for-review')

  return (
    <div className={styles.grid}>
      {needsReview.length > 0 && (
        <div className={styles.banner}>
          <div>
            <div className={styles.bannerLabel}>Suggested next action</div>
            <div className={styles.bannerText}>
              {needsReview.length} content item{needsReview.length === 1 ? '' : 's'} ready for review.
            </div>
          </div>
          <Link to="/content" className={buttonClassName('primary')}>
            Open Content
          </Link>
        </div>
      )}

      <div className={styles.span4}>
        <Card title="Stream status" subtitle="Local OBS connection">
          <div className={styles.statusBody}>
            <StatusPill tone={display.tone} label={display.label} pulse={display.pulse} />
            {obsStatus.message && obsStatus.status !== 'connected' && <p className={styles.statusHint}>{obsStatus.message}</p>}
            {obsStatus.status === 'offline' && (
              <p className={styles.statusHint}>
                OBS isn&apos;t reachable. Enable its WebSocket server and set the connection details in Settings.
              </p>
            )}
            <Link to="/settings" className={buttonClassName('secondary')}>
              Go to Settings
            </Link>
          </div>
        </Card>
      </div>

      <div className={styles.span8}>
        <Card
          title="Goals"
          subtitle="Tracking toward your targets"
          action={
            <button type="button" className={buttonClassName('quiet')} onClick={() => setActiveModal('goal')}>
              Add goal
            </button>
          }
        >
          {goals.length === 0 ? (
            <EmptyState icon="◎" title="No goals yet" description="Add a goal to start tracking progress toward it." />
          ) : (
            <div className={styles.goalsList}>
              {goals.map((goal) => (
                <Meter key={goal.id} label={goal.label} current={goal.currentValue} target={goal.target} unit={goal.unit} />
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className={styles.span5}>
        <Card
          title="Recent session"
          subtitle={recentSession?.platform}
          action={
            recentSession ? (
              <StatusPill tone={recentSession.status === 'live' ? 'live' : 'success'} label={recentSession.status} />
            ) : (
              <button type="button" className={buttonClassName('quiet')} onClick={() => setActiveModal('session')}>
                Add session
              </button>
            )
          }
        >
          {recentSession ? (
            <>
              <p className={styles.notes}>{recentSession.title}</p>
              <div className={styles.sessionMeta}>
                <span>
                  Started <span className={styles.sessionMetaValue}>{formatDateTime(recentSession.startedAt)}</span>
                </span>
                <span>
                  Duration <span className={styles.sessionMetaValue}>{formatDuration(recentSession.durationSeconds)}</span>
                </span>
              </div>
              {recentSession.notes && <p className={styles.notes}>{recentSession.notes}</p>}
            </>
          ) : (
            <EmptyState icon="◍" title="No sessions yet" description="Record your first stream session to see it here." />
          )}
        </Card>
      </div>

      <div className={styles.span7}>
        <Card
          title="Content items"
          subtitle="What needs your attention"
          action={
            <button type="button" className={buttonClassName('quiet')} onClick={() => setActiveModal('content')}>
              Add item
            </button>
          }
        >
          {contentItems.length === 0 ? (
            <EmptyState icon="▤" title="No content items yet" description="Add a clip, title, or post to start tracking it." />
          ) : (
            <div className={styles.taskList}>
              {contentItems.slice(0, 6).map((item) => (
                <div className={styles.taskRow} key={item.id}>
                  <div className={styles.taskLabelGroup}>
                    <span className={styles.taskLabel}>{item.title}</span>
                    <span className={styles.taskDue}>{item.type}</span>
                  </div>
                  <StatusPill tone={contentItemTone(item.status)} label={item.status.replace(/-/g, ' ')} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className={styles.span12}>
        <Card title="Activity feed" subtitle="Recent system and integration events">
          {activity.length === 0 ? (
            <EmptyState icon="◇" title="No activity yet" description="Actions you take and integration events will show up here." />
          ) : (
            <div className={styles.activityList}>
              {activity.map((entry) => (
                <div className={styles.activityRow} key={entry.id}>
                  <span className={styles.activityTime}>{formatDateTime(entry.timestamp)}</span>
                  <span
                    aria-hidden="true"
                    className={entry.status === 'live' ? 'pulse-live' : undefined}
                    style={{ color: TONE_COLOR[entry.status], lineHeight: '20px' }}
                  >
                    ●
                  </span>
                  <span className={styles.activityMessage}>
                    {entry.action}
                    {entry.detail ? ` — ${entry.detail}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {activeModal === 'session' && (
        <Modal title="Add session" onClose={() => setActiveModal(null)}>
          <AddSessionForm
            onCreated={(session) => {
              setSessions((prev) => [session, ...prev])
              setActiveModal(null)
            }}
            onCancel={() => setActiveModal(null)}
          />
        </Modal>
      )}

      {activeModal === 'goal' && (
        <Modal title="Add goal" onClose={() => setActiveModal(null)}>
          <AddGoalForm
            onCreated={(goal) => {
              setGoals((prev) => [...prev, goal])
              setActiveModal(null)
            }}
            onCancel={() => setActiveModal(null)}
          />
        </Modal>
      )}

      {activeModal === 'content' && (
        <Modal title="Add content item" onClose={() => setActiveModal(null)}>
          <AddContentItemForm
            onCreated={(item) => {
              setContentItems((prev) => [item, ...prev])
              setActiveModal(null)
            }}
            onCancel={() => setActiveModal(null)}
          />
        </Modal>
      )}
    </div>
  )
}
