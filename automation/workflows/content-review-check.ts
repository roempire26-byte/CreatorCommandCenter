export interface ContentReviewCheckItem {
  id: string
  title: string
  status: string
  statusChangedAt: string | null
}

export interface ContentReviewCheckResult {
  flaggedCount: number
  flaggedTitles: string[]
  summary: string
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

// Pure — no DB, no IPC, no side effects. Given the same items/threshold/now it
// always returns the same result, so it's testable without a database or Electron.
export function runContentReviewCheck(
  items: ContentReviewCheckItem[],
  thresholdDays: number,
  now: Date
): ContentReviewCheckResult {
  const thresholdMs = thresholdDays * MS_PER_DAY

  const flagged = items.filter((item) => {
    if (item.status !== 'ready-for-review') return false
    if (!item.statusChangedAt) return false
    const changedAt = Date.parse(item.statusChangedAt)
    if (Number.isNaN(changedAt)) return false
    return now.getTime() - changedAt >= thresholdMs
  })

  const flaggedTitles = flagged.map((item) => item.title)
  const summary =
    flagged.length === 0
      ? `Nothing to flag — no content items have been in review for ${thresholdDays}+ days.`
      : `${flagged.length} item${flagged.length === 1 ? '' : 's'} flagged for stale review: ${flaggedTitles.join(', ')}.`

  return { flaggedCount: flagged.length, flaggedTitles, summary }
}
