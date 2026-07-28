import { spawn } from 'child_process'
import { mkdir } from 'fs/promises'
import { dirname, join } from 'path'
import ffmpegPath from 'ffmpeg-static'
import type { DbHandle } from '@database/db'
import { getVod } from '@database/repositories/vods'
import { getClipCandidate, markClipCandidateExported, type ClipCandidate } from '@database/repositories/clip-candidates'
import { buildExportFilename } from '@content-intelligence/export/buildExportFilename'
import { logActivity } from '../activity-log'

async function runFfmpegCut(inputPath: string, startSeconds: number, endSeconds: number, outputPath: string): Promise<void> {
  if (!ffmpegPath) {
    throw new Error('ffmpeg binary not found for this platform — try reinstalling dependencies.')
  }
  await mkdir(dirname(outputPath), { recursive: true })
  const duration = Math.max(0, endSeconds - startSeconds)

  await new Promise<void>((resolve, reject) => {
    // Fast seek (-ss before -i) plus re-encode (not -c copy) — guarantees a valid, immediately
    // playable .mp4 regardless of where the cut points fall relative to source keyframes.
    // +faststart moves the moov atom to the front so the file plays without a full download/seek.
    const args = [
      '-y',
      '-ss', String(startSeconds),
      '-i', inputPath,
      '-t', String(duration),
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-c:a', 'aac',
      '-movflags', '+faststart',
      outputPath
    ]
    const proc = spawn(ffmpegPath as string, args)

    let stderr = ''
    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-500).trim()}`))
    })
  })
}

// Unlike audio-extraction.ts/analysis.ts, this does NOT swallow its own failure into a returned
// 'failed' entity — export is gated behind the renderer's ConfirmDialog, which only surfaces an
// error if the underlying call throws (same shape as ipc.ts's obsStartStream/obsStopStream
// handlers). Status is deliberately left at 'approved' on failure rather than moved to 'failed':
// the export guard below requires 'approved', so leaving it unchanged is what lets the user just
// click Export again in the same dialog instead of needing a separate retry affordance.
export async function runClipExport(handle: DbHandle, candidateId: string, exportsDir: string): Promise<ClipCandidate> {
  const candidate = getClipCandidate(handle, candidateId)
  if (!candidate) throw new Error('Clip candidate not found')
  if (candidate.status !== 'approved') throw new Error('Only approved candidates can be exported.')

  const vod = getVod(handle, candidate.vodId)
  if (!vod) throw new Error('Source VOD not found')

  const filename = buildExportFilename(candidate.title, candidate.id)
  const outputPath = join(exportsDir, filename)

  // Logged before the (slow, crash-able) ffmpeg call, not just on success/failure after it — if
  // the app dies mid-cut, this is the one durable record that an export was even attempted for
  // this candidate, and which file path it was headed for.
  logActivity(handle, { category: 'clip', action: 'export-started', status: 'neutral', detail: `${filename} (target: ${outputPath})` })

  try {
    await runFfmpegCut(vod.filePath, candidate.startSeconds, candidate.endSeconds, outputPath)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    logActivity(handle, { category: 'clip', action: 'export-failed', status: 'danger', detail })
    throw error instanceof Error ? error : new Error(detail)
  }

  const exportedAt = new Date().toISOString()
  const updated = markClipCandidateExported(handle, candidateId, { exportPath: outputPath, exportFilename: filename, exportedAt })
  logActivity(handle, { category: 'clip', action: 'exported', status: 'success', detail: filename })
  return updated ?? candidate
}
