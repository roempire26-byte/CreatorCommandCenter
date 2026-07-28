import { randomUUID } from 'crypto'
import type { DbHandle } from '../db'
import { mutate, query, saveDatabase } from '../db'

export type ClipCandidateStatus = 'recommended' | 'approved' | 'rejected' | 'exported' | 'failed'

export interface ClipCandidate {
  id: string
  vodId: string
  startSeconds: number
  endSeconds: number
  title: string
  reason: string | undefined
  status: ClipCandidateStatus
  hookStrength: number | null
  emotionalIntensity: number | null
  contextCompleteness: number | null
  replayValue: number | null
  overallScore: number | null
  feedbackNote: string | null
  exportPath: string | null
  exportFilename: string | null
  exportedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateClipCandidateInput {
  vodId: string
  startSeconds: number
  endSeconds: number
  title: string
  reason?: string
  hookStrength?: number
  emotionalIntensity?: number
  contextCompleteness?: number
  replayValue?: number
  overallScore?: number
}

interface ClipCandidateRow {
  id: string
  vod_id: string
  start_seconds: number
  end_seconds: number
  title: string
  reason: string | null
  status: string
  hook_strength: number | null
  emotional_intensity: number | null
  context_completeness: number | null
  replay_value: number | null
  overall_score: number | null
  feedback_note: string | null
  export_path: string | null
  export_filename: string | null
  exported_at: string | null
  created_at: string
  updated_at: string
}

function toClipCandidate(row: ClipCandidateRow): ClipCandidate {
  return {
    id: row.id,
    vodId: row.vod_id,
    startSeconds: row.start_seconds,
    endSeconds: row.end_seconds,
    title: row.title,
    reason: row.reason ?? undefined,
    status: row.status as ClipCandidateStatus,
    hookStrength: row.hook_strength,
    emotionalIntensity: row.emotional_intensity,
    contextCompleteness: row.context_completeness,
    replayValue: row.replay_value,
    overallScore: row.overall_score,
    feedbackNote: row.feedback_note,
    exportPath: row.export_path,
    exportFilename: row.export_filename,
    exportedAt: row.exported_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function getClipCandidateRow(handle: DbHandle, id: string): ClipCandidateRow | undefined {
  const rows = query<ClipCandidateRow>(handle.db, 'SELECT * FROM clip_candidates WHERE id = ?', [id])
  return rows[0]
}

export function getClipCandidate(handle: DbHandle, id: string): ClipCandidate | undefined {
  const row = getClipCandidateRow(handle, id)
  return row ? toClipCandidate(row) : undefined
}

export function listClipCandidatesForVod(handle: DbHandle, vodId: string): ClipCandidate[] {
  const rows = query<ClipCandidateRow>(
    handle.db,
    'SELECT * FROM clip_candidates WHERE vod_id = ? ORDER BY start_seconds ASC',
    [vodId]
  )
  return rows.map(toClipCandidate)
}

// Most recent decided candidates (approved or rejected), for the preference digest fed back
// into future Claude analysis calls. Mirrors listActivityLog's recency-capped shape.
export function listFeedbackHistory(handle: DbHandle, limit = 20): ClipCandidate[] {
  const rows = query<ClipCandidateRow>(
    handle.db,
    `SELECT * FROM clip_candidates WHERE status IN ('approved', 'rejected') ORDER BY updated_at DESC LIMIT ?`,
    [limit]
  )
  return rows.map(toClipCandidate)
}

export function createClipCandidate(handle: DbHandle, input: CreateClipCandidateInput): ClipCandidate {
  const id = randomUUID()
  const now = new Date().toISOString()

  mutate(
    handle.db,
    `INSERT INTO clip_candidates
       (id, vod_id, start_seconds, end_seconds, title, reason, status,
        hook_strength, emotional_intensity, context_completeness, replay_value, overall_score,
        created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.vodId,
      input.startSeconds,
      input.endSeconds,
      input.title,
      input.reason ?? null,
      'recommended',
      input.hookStrength ?? null,
      input.emotionalIntensity ?? null,
      input.contextCompleteness ?? null,
      input.replayValue ?? null,
      input.overallScore ?? null,
      now,
      now
    ]
  )
  saveDatabase(handle)

  return {
    id,
    vodId: input.vodId,
    startSeconds: input.startSeconds,
    endSeconds: input.endSeconds,
    title: input.title,
    reason: input.reason,
    status: 'recommended',
    hookStrength: input.hookStrength ?? null,
    emotionalIntensity: input.emotionalIntensity ?? null,
    contextCompleteness: input.contextCompleteness ?? null,
    replayValue: input.replayValue ?? null,
    overallScore: input.overallScore ?? null,
    feedbackNote: null,
    exportPath: null,
    exportFilename: null,
    exportedAt: null,
    createdAt: now,
    updatedAt: now
  }
}

export function updateClipCandidateStatus(
  handle: DbHandle,
  id: string,
  status: ClipCandidateStatus,
  note?: string
): ClipCandidate | undefined {
  const existing = getClipCandidateRow(handle, id)
  if (!existing) return undefined

  const updatedAt = new Date().toISOString()
  mutate(
    handle.db,
    'UPDATE clip_candidates SET status = ?, feedback_note = COALESCE(?, feedback_note), updated_at = ? WHERE id = ?',
    [status, note ?? null, updatedAt, id]
  )
  saveDatabase(handle)

  return toClipCandidate({
    ...existing,
    status,
    feedback_note: note ?? existing.feedback_note,
    updated_at: updatedAt
  })
}

export interface MarkClipCandidateExportedInput {
  exportPath: string
  exportFilename: string
  exportedAt: string
}

// The only path that sets status 'exported' — always paired with the export metadata, so a row
// can never end up 'exported' without a real file path attached.
export function markClipCandidateExported(
  handle: DbHandle,
  id: string,
  input: MarkClipCandidateExportedInput
): ClipCandidate | undefined {
  const existing = getClipCandidateRow(handle, id)
  if (!existing) return undefined

  mutate(
    handle.db,
    `UPDATE clip_candidates
     SET status = 'exported', export_path = ?, export_filename = ?, exported_at = ?, updated_at = ?
     WHERE id = ?`,
    [input.exportPath, input.exportFilename, input.exportedAt, input.exportedAt, id]
  )
  saveDatabase(handle)

  return toClipCandidate({
    ...existing,
    status: 'exported',
    export_path: input.exportPath,
    export_filename: input.exportFilename,
    exported_at: input.exportedAt,
    updated_at: input.exportedAt
  })
}
