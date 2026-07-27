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
  createdAt: string
  updatedAt: string
}

export interface CreateClipCandidateInput {
  vodId: string
  startSeconds: number
  endSeconds: number
  title: string
  reason?: string
}

interface ClipCandidateRow {
  id: string
  vod_id: string
  start_seconds: number
  end_seconds: number
  title: string
  reason: string | null
  status: string
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
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function getClipCandidateRow(handle: DbHandle, id: string): ClipCandidateRow | undefined {
  const rows = query<ClipCandidateRow>(handle.db, 'SELECT * FROM clip_candidates WHERE id = ?', [id])
  return rows[0]
}

export function listClipCandidatesForVod(handle: DbHandle, vodId: string): ClipCandidate[] {
  const rows = query<ClipCandidateRow>(
    handle.db,
    'SELECT * FROM clip_candidates WHERE vod_id = ? ORDER BY start_seconds ASC',
    [vodId]
  )
  return rows.map(toClipCandidate)
}

export function createClipCandidate(handle: DbHandle, input: CreateClipCandidateInput): ClipCandidate {
  const id = randomUUID()
  const now = new Date().toISOString()

  mutate(
    handle.db,
    `INSERT INTO clip_candidates (id, vod_id, start_seconds, end_seconds, title, reason, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, input.vodId, input.startSeconds, input.endSeconds, input.title, input.reason ?? null, 'recommended', now, now]
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
    createdAt: now,
    updatedAt: now
  }
}

export function updateClipCandidateStatus(
  handle: DbHandle,
  id: string,
  status: ClipCandidateStatus
): ClipCandidate | undefined {
  const existing = getClipCandidateRow(handle, id)
  if (!existing) return undefined

  const updatedAt = new Date().toISOString()
  mutate(handle.db, 'UPDATE clip_candidates SET status = ?, updated_at = ? WHERE id = ?', [status, updatedAt, id])
  saveDatabase(handle)

  return toClipCandidate({ ...existing, status, updated_at: updatedAt })
}
