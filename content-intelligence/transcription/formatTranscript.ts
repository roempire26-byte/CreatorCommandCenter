export interface TranscriptSegment {
  start: number
  end: number
  text: string
}

function formatTimestamp(seconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${minutes}:${String(secs).padStart(2, '0')}`
}

// Pure: turns a transcription provider's raw segment list into the single string this app
// stores on Vod.transcript — human-readable, and with per-segment timestamp anchors a later
// analysis step (Claude, a future slice) can reference. No network or DB access; testable with
// plain input/output.
export function formatTranscript(segments: TranscriptSegment[]): string {
  return segments
    .map((segment) => `[${formatTimestamp(segment.start)}–${formatTimestamp(segment.end)}] ${segment.text.trim()}`)
    .join('\n')
}
