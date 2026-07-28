export interface FeedbackHistoryEntry {
  status: 'approved' | 'rejected'
  overallScore: number | null
  feedbackNote: string | null
}

// Pure: summarizes past approve/reject decisions into a short nudge for the analysis prompt.
// Returns undefined when there's no real history yet, so callers never splice in a fabricated
// or empty signal -- only entries with status 'approved'/'rejected' should be passed in here
// (see listFeedbackHistory).
export function buildPreferenceDigest(history: FeedbackHistoryEntry[]): string | undefined {
  if (history.length === 0) return undefined

  const approved = history.filter((entry) => entry.status === 'approved')
  const rejected = history.filter((entry) => entry.status === 'rejected')

  const lines = [
    `This creator has approved ${approved.length} and rejected ${rejected.length} past clip suggestions.`
  ]

  const approvedNotes = approved.map((entry) => entry.feedbackNote).filter((note): note is string => !!note)
  const rejectedNotes = rejected.map((entry) => entry.feedbackNote).filter((note): note is string => !!note)

  if (approvedNotes.length > 0) {
    lines.push(`Reasons they've given for approving: ${approvedNotes.slice(0, 5).join('; ')}`)
  }
  if (rejectedNotes.length > 0) {
    lines.push(`Reasons they've given for rejecting: ${rejectedNotes.slice(0, 5).join('; ')}`)
  }

  return lines.join('\n')
}
