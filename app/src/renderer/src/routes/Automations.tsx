import { RoutePlaceholder } from '@renderer/components/RoutePlaceholder'

export function Automations(): JSX.Element {
  return (
    <RoutePlaceholder
      statusLabel="No workflows configured"
      statusTone="neutral"
      emptyIcon="◈"
      emptyTitle="No automation runs yet"
      emptyDescription="Automations will run locally with dry-run previews and a detailed log. Public or irreversible actions will always require your explicit approval before they run."
      upcoming={[
        { sprint: 'Sprint 5', label: 'Dry-run automation runner and execution log' },
        { sprint: 'Sprint 5', label: 'Optional n8n-compatible workflow integration' }
      ]}
    />
  )
}
