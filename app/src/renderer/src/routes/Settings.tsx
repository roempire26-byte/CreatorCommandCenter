import { RoutePlaceholder } from '@renderer/components/RoutePlaceholder'

export function Settings(): JSX.Element {
  return (
    <RoutePlaceholder
      statusLabel="Nothing connected"
      statusTone="neutral"
      emptyIcon="⚙"
      emptyTitle="No integrations or preferences configured"
      emptyDescription="Connection settings, AI provider choices, and data/privacy controls will live here. No credentials or tokens are stored or requested in Sprint 1."
      upcoming={[
        { sprint: 'Sprint 2', label: 'Local integration settings for OBS' },
        { sprint: 'Sprint 6', label: 'AI provider settings, budget visibility, and privacy controls' }
      ]}
    />
  )
}
