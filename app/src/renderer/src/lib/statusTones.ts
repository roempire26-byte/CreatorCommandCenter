import type { AutomationRun, ClipCandidate, ContentItem, StreamSession, Vod } from '@shared/schemas'
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

// Display-only clarification of the stored status: 'processing' covers both "audio
// extraction is actively running" and "extraction finished, idle until the user clicks
// Transcribe/Analyze" — those read very differently to a user even though the DB value is
// identical. No schema change; this only relabels what's already there.
export function vodStatusLabel(vod: Vod): string {
  if (vod.status === 'processing' && vod.transcript == null) return 'ready to transcribe'
  if (vod.status === 'processing' && vod.transcript != null) return 'ready to analyze'
  return vod.status
}

export function clipCandidateTone(status: ClipCandidate['status']): StatusTone {
  switch (status) {
    case 'approved':
    case 'exported':
      return 'success'
    case 'rejected':
    case 'failed':
      return 'danger'
    case 'recommended':
    default:
      return 'neutral'
  }
}
