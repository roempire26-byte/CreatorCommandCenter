export interface RouteDef {
  id: string
  label: string
  path: string
  description: string
  icon: 'grid' | 'broadcast' | 'chart' | 'stack' | 'flow' | 'spark' | 'gear' | 'clip'
}

export const ROUTES: RouteDef[] = [
  {
    id: 'mission-control',
    label: 'Mission Control',
    path: '/',
    description: 'Daily overview, goals, and next actions',
    icon: 'grid'
  },
  {
    id: 'streaming',
    label: 'Streaming',
    path: '/streaming',
    description: 'OBS status, checklist, session controls',
    icon: 'broadcast'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    path: '/analytics',
    description: 'Cross-platform growth and session history',
    icon: 'chart'
  },
  {
    id: 'content',
    label: 'Content',
    path: '/content',
    description: 'Manual idea queue and drafts',
    icon: 'stack'
  },
  {
    id: 'clips',
    label: 'Clips',
    path: '/clips',
    description: 'AI clip suggestions from your VODs',
    icon: 'clip'
  },
  {
    id: 'automations',
    label: 'Automations',
    path: '/automations',
    description: 'Safe, logged, repeatable workflows',
    icon: 'flow'
  },
  {
    id: 'ai-workspace',
    label: 'AI Workspace',
    path: '/ai-workspace',
    description: 'Provider-neutral drafting and insights',
    icon: 'spark'
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    description: 'Connections, preferences, and privacy',
    icon: 'gear'
  }
]
