import { Card } from './Card'
import { EmptyState } from './EmptyState'
import { StatusPill, StatusTone } from './StatusPill'
import styles from './RoutePlaceholder.module.css'

interface UpcomingItem {
  sprint: string
  label: string
}

interface RoutePlaceholderProps {
  statusLabel: string
  statusTone: StatusTone
  emptyIcon: string
  emptyTitle: string
  emptyDescription: string
  upcoming: UpcomingItem[]
}

export function RoutePlaceholder({
  statusLabel,
  statusTone,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  upcoming
}: RoutePlaceholderProps): JSX.Element {
  return (
    <div className={styles.wrap}>
      <Card title="Integration status">
        <div className={styles.statusRow}>
          <StatusPill tone={statusTone} label={statusLabel} />
        </div>
      </Card>

      <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />

      <Card title="What's coming" subtitle="Planned in later sprints">
        <div className={styles.upcoming}>
          {upcoming.map((item) => (
            <div className={styles.upcomingItem} key={item.label}>
              <span className={styles.upcomingSprint}>{item.sprint}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
