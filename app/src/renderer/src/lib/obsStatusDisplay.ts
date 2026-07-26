import type { ObsStatus } from '@shared/schemas'
import type { StatusTone } from '@renderer/components/StatusPill'

export function obsStatusDisplay(status: ObsStatus): { tone: StatusTone; label: string; pulse?: boolean } {
  switch (status.status) {
    case 'connected':
      return status.streaming
        ? { tone: 'live', label: 'OBS live', pulse: true }
        : { tone: 'success', label: 'OBS connected' }
    case 'connecting':
      return { tone: 'neutral', label: 'OBS connecting…' }
    case 'auth-required':
      return { tone: 'warning', label: 'OBS needs a password' }
    case 'errored':
      return { tone: 'danger', label: 'OBS connection error' }
    case 'offline':
    default:
      return { tone: 'neutral', label: 'OBS offline' }
  }
}
