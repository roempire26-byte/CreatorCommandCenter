import type { StreamSession } from '@shared/schemas'
import type { DateRangeBounds } from './dateRange'

export type TrendCallout =
  | { kind: 'insufficient-history' }
  | { kind: 'comparison'; currentSessions: number; priorSessions: number; currentHours: number; priorHours: number }

function sumHours(sessions: StreamSession[]): number {
  const totalSeconds = sessions.reduce((sum, session) => sum + (session.durationSeconds ?? 0), 0)
  return Math.round((totalSeconds / 3600) * 10) / 10
}

function inRange(session: StreamSession, bounds: DateRangeBounds): boolean {
  const time = Date.parse(session.startedAt)
  if (Number.isNaN(time)) return false
  if (bounds.start && time < bounds.start.getTime()) return false
  return time <= bounds.end.getTime()
}

// `allSessions` must be the full unfiltered set — used to check whether recorded
// history actually reaches back far enough to make "vs. the prior period" honest,
// as opposed to a misleadingly-inflated comparison against a period before the app
// (or this dataset) had any data at all.
export function computeTrendCallout(
  allSessions: StreamSession[],
  currentBounds: DateRangeBounds,
  priorBounds: DateRangeBounds
): TrendCallout {
  if (allSessions.length === 0 || !priorBounds.start) return { kind: 'insufficient-history' }

  const earliestStartedAt = Math.min(...allSessions.map((session) => Date.parse(session.startedAt)))
  if (Number.isNaN(earliestStartedAt) || earliestStartedAt > priorBounds.start.getTime()) {
    return { kind: 'insufficient-history' }
  }

  const currentSessions = allSessions.filter((session) => inRange(session, currentBounds))
  const priorSessions = allSessions.filter((session) => inRange(session, priorBounds))

  return {
    kind: 'comparison',
    currentSessions: currentSessions.length,
    priorSessions: priorSessions.length,
    currentHours: sumHours(currentSessions),
    priorHours: sumHours(priorSessions)
  }
}
