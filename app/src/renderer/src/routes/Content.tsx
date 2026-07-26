import { RoutePlaceholder } from '@renderer/components/RoutePlaceholder'

export function Content(): JSX.Element {
  return (
    <RoutePlaceholder
      statusLabel="Queue empty"
      statusTone="neutral"
      emptyIcon="▤"
      emptyTitle="No clips or drafts waiting for review"
      emptyDescription="After a stream, clips and drafts for titles, descriptions, and social posts will appear here for review before anything is approved or published."
      upcoming={[
        { sprint: 'Sprint 5', label: 'Content queue, draft states, and review flow' },
        { sprint: 'Sprint 6', label: 'AI-assisted draft generation with explicit approval' }
      ]}
    />
  )
}
