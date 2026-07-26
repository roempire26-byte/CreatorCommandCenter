export type DateRangePreset = '7d' | '30d' | 'all'

export const DATE_RANGE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' }
]

export interface DateRangeBounds {
  start: Date | null
  end: Date
}

const DAY_MS = 24 * 60 * 60 * 1000

export function getDateRangeBounds(preset: DateRangePreset, now = new Date()): DateRangeBounds {
  if (preset === 'all') return { start: null, end: now }
  const days = preset === '7d' ? 7 : 30
  return { start: new Date(now.getTime() - days * DAY_MS), end: now }
}

export function isWithinRange(iso: string, bounds: DateRangeBounds): boolean {
  const time = Date.parse(iso)
  if (Number.isNaN(time)) return false
  if (bounds.start && time < bounds.start.getTime()) return false
  return time <= bounds.end.getTime()
}

// The equivalent-length window immediately before `bounds`, for trend comparisons.
// Undefined for 'all time', which has no meaningful "prior" window.
export function getPriorRangeBounds(bounds: DateRangeBounds): DateRangeBounds | undefined {
  if (!bounds.start) return undefined
  const spanMs = bounds.end.getTime() - bounds.start.getTime()
  return { start: new Date(bounds.start.getTime() - spanMs), end: bounds.start }
}
