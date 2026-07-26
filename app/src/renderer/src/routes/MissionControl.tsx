import { Link } from 'react-router-dom'
import { Card } from '@renderer/components/Card'
import { buttonClassName } from '@renderer/components/Button'
import { StatusPill } from '@renderer/components/StatusPill'
import { Meter } from '@renderer/components/Meter'
import { MOCK_ACTIVITY, MOCK_GOALS, MOCK_NEXT_ACTION, MOCK_RECENT_SESSION, MOCK_TASKS } from '@renderer/lib/mockData'
import styles from './MissionControl.module.css'

const TONE_COLOR: Record<string, string> = {
  success: 'var(--status-success)',
  warning: 'var(--status-warning)',
  danger: 'var(--status-danger)',
  live: 'var(--accent-cyan)',
  neutral: 'var(--text-muted)'
}

export function MissionControl(): JSX.Element {
  return (
    <div className={styles.grid}>
      <div className={styles.banner}>
        <div>
          <div className={styles.bannerLabel}>Suggested next action</div>
          <div className={styles.bannerText}>{MOCK_NEXT_ACTION}</div>
        </div>
        <Link to="/content" className={buttonClassName('primary')}>
          Open Content
        </Link>
      </div>

      <div className={styles.span4}>
        <Card title="Stream status" subtitle="Local OBS connection">
          <div className={styles.statusBody}>
            <StatusPill tone="neutral" label="OBS offline" />
            <p className={styles.statusHint}>
              OBS isn&apos;t connected yet. This is expected for Sprint 1 — connect it later from Settings to enable live
              status and session recording.
            </p>
            <Link to="/settings" className={buttonClassName('secondary')}>
              Go to Settings
            </Link>
          </div>
        </Card>
      </div>

      <div className={styles.span8}>
        <Card title="Goals this month" subtitle="Tracking toward your monthly targets">
          <div className={styles.goalsList}>
            {MOCK_GOALS.map((goal) => (
              <Meter key={goal.id} label={goal.label} current={goal.current} target={goal.target} unit={goal.unit} tone={goal.tone} />
            ))}
          </div>
        </Card>
      </div>

      <div className={styles.span5}>
        <Card
          title="Recent session"
          subtitle={MOCK_RECENT_SESSION.platform}
          action={<StatusPill tone="success" label="Completed" />}
        >
          <p className={styles.notes}>{MOCK_RECENT_SESSION.title}</p>
          <div className={styles.sessionMeta}>
            <span>
              Started <span className={styles.sessionMetaValue}>{MOCK_RECENT_SESSION.startedAt}</span>
            </span>
            <span>
              Duration <span className={styles.sessionMetaValue}>{MOCK_RECENT_SESSION.duration}</span>
            </span>
            <span>
              Followers gained <span className={styles.sessionMetaValue}>+{MOCK_RECENT_SESSION.followersGained}</span>
            </span>
          </div>
          <p className={styles.notes}>{MOCK_RECENT_SESSION.notes}</p>
        </Card>
      </div>

      <div className={styles.span7}>
        <Card title="Creator tasks" subtitle="What needs your attention">
          <div className={styles.taskList}>
            {MOCK_TASKS.map((task) => (
              <div className={styles.taskRow} key={task.id}>
                <div className={styles.taskLabelGroup}>
                  <span className={styles.taskLabel}>{task.label}</span>
                  <span className={styles.taskDue}>{task.due}</span>
                </div>
                <StatusPill tone={task.tone} label={task.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className={styles.span12}>
        <Card title="Activity feed" subtitle="Recent system and integration events">
          <div className={styles.activityList}>
            {MOCK_ACTIVITY.map((entry) => (
              <div className={styles.activityRow} key={entry.id}>
                <span className={styles.activityTime}>{entry.time}</span>
                <span
                  aria-hidden="true"
                  className={entry.tone === 'live' ? 'pulse-live' : undefined}
                  style={{ color: TONE_COLOR[entry.tone], lineHeight: '20px' }}
                >
                  ●
                </span>
                <span className={styles.activityMessage}>{entry.message}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
