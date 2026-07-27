import { RoutePlaceholder } from '@renderer/components/RoutePlaceholder'

export function AIWorkspace(): JSX.Element {
  return (
    <RoutePlaceholder
      statusLabel="No AI provider connected"
      statusTone="neutral"
      emptyIcon="✦"
      emptyTitle="This general drafting workspace is optional and off by default"
      emptyDescription="When enabled, this workspace will offer provider-neutral drafting and insight requests with transparent costs and approval boundaries. Looking for AI clip suggestions from a VOD? That's already live — add your Claude key in Settings, then use the Clips screen."
      upcoming={[
        { sprint: 'Sprint 6', label: 'Provider-neutral AI adapter (OpenAI, Anthropic, Gemini, or local)' },
        { sprint: 'Sprint 6', label: 'Draft ideas, titles, descriptions, and post-stream summaries' }
      ]}
    />
  )
}
