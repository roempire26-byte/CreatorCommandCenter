import { RoutePlaceholder } from '@renderer/components/RoutePlaceholder'

export function Streaming(): JSX.Element {
  return (
    <RoutePlaceholder
      statusLabel="OBS offline"
      statusTone="neutral"
      emptyIcon="◎"
      emptyTitle="No active or recent stream session"
      emptyDescription="OBS isn't connected yet, so there's nothing to control or record. This screen will host your pre-stream checklist and start/end controls once OBS is wired up."
      upcoming={[
        { sprint: 'Sprint 2', label: 'Read-only OBS connection status and diagnostics' },
        { sprint: 'Sprint 3', label: 'Pre-stream checklist, start/end session, and post-stream briefing' }
      ]}
    />
  )
}
