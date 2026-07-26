import type { MetricSnapshot, StreamSession } from '@shared/schemas'

export interface PlatformMetricTotal {
  metricName: string
  total: number
}

export interface PlatformSummary {
  platform: string
  sessionCount: number
  totalHours: number
  metricTotals: PlatformMetricTotal[]
}

// `sessions` and `metrics` should already be filtered to whatever range/scope the
// caller wants summarized — this function only aggregates, it doesn't filter.
export function computePlatformSummaries(sessions: StreamSession[], metrics: MetricSnapshot[]): PlatformSummary[] {
  const sessionIdsInScope = new Set(sessions.map((session) => session.id))

  const byPlatform = new Map<string, { sessionCount: number; totalSeconds: number; metricTotals: Map<string, number> }>()

  function bucketFor(platform: string): { sessionCount: number; totalSeconds: number; metricTotals: Map<string, number> } {
    let bucket = byPlatform.get(platform)
    if (!bucket) {
      bucket = { sessionCount: 0, totalSeconds: 0, metricTotals: new Map() }
      byPlatform.set(platform, bucket)
    }
    return bucket
  }

  for (const session of sessions) {
    const bucket = bucketFor(session.platform)
    bucket.sessionCount += 1
    bucket.totalSeconds += session.durationSeconds ?? 0
  }

  for (const metric of metrics) {
    if (!sessionIdsInScope.has(metric.sessionId)) continue
    const bucket = bucketFor(metric.platform)
    bucket.metricTotals.set(metric.metricName, (bucket.metricTotals.get(metric.metricName) ?? 0) + metric.value)
  }

  return [...byPlatform.entries()]
    .map(([platform, bucket]) => ({
      platform,
      sessionCount: bucket.sessionCount,
      totalHours: Math.round((bucket.totalSeconds / 3600) * 10) / 10,
      metricTotals: [...bucket.metricTotals.entries()]
        .map(([metricName, total]) => ({ metricName, total }))
        .sort((a, b) => a.metricName.localeCompare(b.metricName))
    }))
    .sort((a, b) => b.sessionCount - a.sessionCount)
}
