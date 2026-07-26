import { RoutePlaceholder } from '@renderer/components/RoutePlaceholder'
import { useObsStatus } from '@renderer/lib/useObsStatus'
import { obsStatusDisplay } from '@renderer/lib/obsStatusDisplay'

export function Streaming(): JSX.Element {
  const obsStatus = useObsStatus()
  const display = obsStatusDisplay(obsStatus)

  const emptyDescription =
    obsStatus.status === 'connected'
      ? `OBS is connected${obsStatus.sceneName ? ` — current scene: ${obsStatus.sceneName}` : ''}. Session start/end controls arrive in Sprint 3.`
      : obsStatus.status === 'auth-required'
        ? 'OBS was found but needs a password. Set the OBS WebSocket password in Settings to connect.'
        : "OBS isn't connected yet. This screen will host your pre-stream checklist and start/end controls once OBS is wired up."

  return (
    <RoutePlaceholder
      statusLabel={display.label}
      statusTone={display.tone}
      emptyIcon="◎"
      emptyTitle="No active or recent stream session"
      emptyDescription={emptyDescription}
      upcoming={[
        { sprint: 'Sprint 2', label: 'Read-only OBS connection status and diagnostics' },
        { sprint: 'Sprint 3', label: 'Pre-stream checklist, start/end session, and post-stream briefing' }
      ]}
    />
  )
}
