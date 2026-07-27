import type { AutomationRun, ContentItem, StreamSession, Vod } from '@shared/schemas'
import type { StatusTone } from '@renderer/components/StatusPill'

export function contentItemTone(status: ContentItem['status']): StatusTone {
  switch (status) {
    case 'published':
    case 'approved':
      return 'success'
    case 'ready-for-review':
      return 'warning'
    case 'drafting':
    case 'captured':
      return 'neutral'
    case 'idea':
    default:
      return 'neutral'
  }
}

export function sessionTone(status: StreamSession['status']): StatusTone {
  switch (status) {
    case 'live':
      return 'live'
    case 'completed':
      return 'success'
    case 'cancelled':
    default:
      return 'neutral'
  }
}

export function automationRunTone(status: AutomationRun['status']): StatusTone {
  switch (status) {
    case 'completed':
      return 'success'
    case 'failed':
      return 'danger'
    case 'running':
    default:
      return 'neutral'
  }
}

export function vodTone(status: Vod['status']): StatusTone {
  switch (status) {
    case 'analyzed':
      return 'success'
    case 'failed':
      return 'danger'
    case 'processing':
      return 'warning'
    case 'pending':
    default:
      return 'neutral'
  }
}
