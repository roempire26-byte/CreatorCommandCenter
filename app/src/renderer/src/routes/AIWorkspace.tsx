import { RoutePlaceholder } from '@renderer/components/RoutePlaceholder'

export function AIWorkspace(): JSX.Element {
  return (
    <RoutePlaceholder
      statusLabel="No AI provider connected"
      statusTone="neutral"
      emptyIcon="✦"
      emptyTitle="AI assistance is optional and off by default"
      emptyDescription="When enabled, this workspace will offer provider-neutral drafting and insight requests with transparent costs and approval boundaries. The core app will never require an AI provider to function."
      upcoming={[
        { sprint: 'Sprint 6', label: 'Provider-neutral AI adapter (OpenAI, Anthropic, Gemini, or local)' },
        { sprint: 'Sprint 6', label: 'Draft ideas, titles, descriptions, and post-stream summaries' }
      ]}
    />
  )
}
