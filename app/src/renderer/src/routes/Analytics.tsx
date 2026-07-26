import { RoutePlaceholder } from '@renderer/components/RoutePlaceholder'

export function Analytics(): JSX.Element {
  return (
    <RoutePlaceholder
      statusLabel="No data sources connected"
      statusTone="neutral"
      emptyIcon="◫"
      emptyTitle="No sessions or metrics recorded yet"
      emptyDescription="Once sessions are saved and platform data is imported, this screen will show a unified monthly view, a session timeline, and goal progress across platforms."
      upcoming={[
        { sprint: 'Sprint 3', label: 'Manual metrics entry after each session' },
        { sprint: 'Sprint 4', label: 'Session timeline, platform summaries, and trend callouts' }
      ]}
    />
  )
}
