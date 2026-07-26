export interface ActionDef {
  id: string
  label: string
  description: string
  targetPath: string
}

export const PLACEHOLDER_ACTIONS: ActionDef[] = [
  {
    id: 'start-stream',
    label: 'Start stream',
    description: 'Placeholder — opens Streaming once OBS is connected',
    targetPath: '/streaming'
  },
  {
    id: 'end-stream',
    label: 'End stream',
    description: 'Placeholder — opens the post-stream review flow',
    targetPath: '/streaming'
  },
  {
    id: 'create-draft',
    label: 'Create content draft',
    description: 'Placeholder — opens the Content queue',
    targetPath: '/content'
  },
  {
    id: 'run-automation-preview',
    label: 'Run automation preview',
    description: 'Placeholder — opens Automations in dry-run view',
    targetPath: '/automations'
  },
  {
    id: 'review-session',
    label: 'Review latest session',
    description: 'Placeholder — opens the Analytics session timeline',
    targetPath: '/analytics'
  }
]
