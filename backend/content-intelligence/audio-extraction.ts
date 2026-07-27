import { spawn } from 'child_process'
import { mkdir } from 'fs/promises'
import { dirname, join } from 'path'
import ffmpegPath from 'ffmpeg-static'
import type { DbHandle } from '@database/db'
import { getVod, updateVodStatus } from '@database/repositories/vods'
import type { Vod } from '@shared/schemas'
import { logActivity } from '../activity-log'

// The extracted audio file lives at <userData>/vod-audio/<vodId>.wav — deterministic from the
// VOD's id, so nothing about its location needs to be persisted in the database. Re-running
// extraction on the same VOD overwrites the file in place (`-y`); nothing currently deletes it
// once a VOD is done with it, since the transcription step (a later slice) still needs to read it.
export function getVodAudioPath(audioDir: string, vodId: string): string {
  return join(audioDir, `${vodId}.wav`)
}

async function runFfmpegExtractAudio(inputPath: string, outputPath: string): Promise<void> {
  if (!ffmpegPath) {
    throw new Error('ffmpeg binary not found for this platform — try reinstalling dependencies.')
  }
  await mkdir(dirname(outputPath), { recursive: true })

  await new Promise<void>((resolve, reject) => {
    // Mono, 16kHz, 16-bit PCM WAV — a plain, provider-agnostic format any speech-to-text
    // service or library can consume, independent of which one gets chosen later.
    const args = ['-y', '-i', inputPath, '-vn', '-ac', '1', '-ar', '16000', '-acodec', 'pcm_s16le', outputPath]
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

// Mirrors backend/automation-runner.ts's shape: catches its own failures, persists them onto the
// entity's status plus the activity log, and always returns the entity rather than throwing --
// an extraction failure is an expected, retryable outcome, not an exceptional one. "VOD not
// found" is the one case that still throws, matching how getSession/getContentItem-style
// not-found checks behave elsewhere in this codebase.
export async function runAudioExtraction(handle: DbHandle, vodId: string, audioDir: string): Promise<Vod> {
  const vod = getVod(handle, vodId)
  if (!vod) throw new Error('VOD not found')

  updateVodStatus(handle, vodId, 'processing')
  const audioPath = getVodAudioPath(audioDir, vodId)

  try {
    await runFfmpegExtractAudio(vod.filePath, audioPath)
    logActivity(handle, { category: 'vod', action: 'audio-extracted', status: 'success', detail: vod.filename })
    return getVod(handle, vodId) ?? vod
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    const failed = updateVodStatus(handle, vodId, 'failed')
    logActivity(handle, { category: 'vod', action: 'audio-extraction-failed', status: 'danger', detail })
    return failed ?? vod
  }
}
