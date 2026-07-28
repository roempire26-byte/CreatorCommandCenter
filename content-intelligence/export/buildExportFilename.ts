// Pure: turns a clip candidate's title into a filesystem-safe .mp4 filename. The short id suffix
// guarantees uniqueness even if two candidates share (or both lack) a usable title — no DB or
// filesystem access, testable with plain input/output.
export function buildExportFilename(title: string, candidateId: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

  const base = slug.length > 0 ? slug : 'clip'
  return `${base}-${candidateId.slice(0, 8)}.mp4`
}
