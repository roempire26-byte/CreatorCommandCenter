import { readFile, stat } from 'fs/promises'
import type { DbHandle } from '@database/db'
import { getVod, updateVodStatus, updateVodTranscript } from '@database/repositories/vods'
import type { Vod } from '@shared/schemas'
import { formatTranscript, type TranscriptSegment } from '@content-intelligence/transcription/formatTranscript'
import { getVodAudioPath } from './audio-extraction'
import { logActivity } from '../activity-log'

const WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions'
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024

interface WhisperVerboseJsonResponse {
  segments: { start: number; end: number; text: string }[]
}

async function callWhisper(audioPath: string, apiKey: string): Promise<TranscriptSegment[]> {
  const audioSize = (await stat(audioPath)).size
  if (audioSize > MAX_UPLOAD_BYTES) {
    throw new Error(
      "This VOD's audio is too long to transcribe in one request (over OpenAI's 25MB limit). Splitting long recordings into chunks isn't supported yet."
    )
  }

  const audioBuffer = await readFile(audioPath)
  const form = new FormData()
  form.append('file', new Blob([audioBuffer], { type: 'audio/mpeg' }), 'audio.mp3')
  form.append('model', 'whisper-1')
  form.append('response_format', 'verbose_json')
  form.append('timestamp_granularities[]', 'segment')

  const response = await fetch(WHISPER_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`OpenAI rejected the transcription request (${response.status}): ${detail.slice(0, 300)}`)
  }

  const data = (await response.json()) as WhisperVerboseJsonResponse
  return data.segments.map((segment) => ({ start: segment.start, end: segment.end, text: segment.text }))
}

// Mirrors audio-extraction.ts's runAudioExtraction shape exactly: catches its own failures,
// persists them onto the entity's status plus the activity log, always returns the entity rather
// than throwing (except "VOD not found"). Status stays 'processing' on success — 'analyzed' is
// reserved for once ClipCandidate rows exist (a later slice), which hasn't happened yet. On
// failure, status moves to 'failed' the same as an extraction failure would, so retrying always
// means re-running extraction from scratch (free, local) rather than risking an ambiguous retry
// that could silently re-trigger this paid call.
export async function runTranscription(handle: DbHandle, vodId: string, audioDir: string, apiKey: string): Promise<Vod> {
  const vod = getVod(handle, vodId)
  if (!vod) throw new Error('VOD not found')

  const audioPath = getVodAudioPath(audioDir, vodId)

  try {
    const segments = await callWhisper(audioPath, apiKey)
    const transcript = formatTranscript(segments)
    updateVodTranscript(handle, vodId, transcript)
    logActivity(handle, { category: 'vod', action: 'transcribed', status: 'success', detail: vod.filename })
    return getVod(handle, vodId) ?? vod
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    const failed = updateVodStatus(handle, vodId, 'failed')
    logActivity(handle, { category: 'vod', action: 'transcription-failed', status: 'danger', detail })
    return failed ?? vod
  }
}
