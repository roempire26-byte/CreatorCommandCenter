import { randomUUID } from 'crypto'
import type { DbHandle } from '../db'
import { mutate, query, saveDatabase } from '../db'
import type { CreateSessionInput, StreamSession } from '@shared/schemas'

interface SessionRow {
  id: string
  title: string
  platform: string
  status: string
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  notes: string | null
}

function toStreamSession(row: SessionRow): StreamSession {
  return {
    id: row.id,
    title: row.title,
    platform: row.platform,
    status: row.status as StreamSession['status'],
    startedAt: row.started_at,
    endedAt: row.ended_at ?? undefined,
    durationSeconds: row.duration_seconds,
    notes: row.notes ?? undefined
  }
}

export function listSessions(handle: DbHandle): StreamSession[] {
  const rows = query<SessionRow>(handle.db, 'SELECT * FROM stream_sessions ORDER BY started_at DESC')
  return rows.map(toStreamSession)
}

export function getSession(handle: DbHandle, id: string): StreamSession | undefined {
  const rows = query<SessionRow>(handle.db, 'SELECT * FROM stream_sessions WHERE id = ?', [id])
  return rows[0] ? toStreamSession(rows[0]) : undefined
}

export function createSession(handle: DbHandle, input: CreateSessionInput): StreamSession {
  const id = randomUUID()
  const durationSeconds =
    input.endedAt != null ? Math.max(0, Math.round((Date.parse(input.endedAt) - Date.parse(input.startedAt)) / 1000)) : null

  mutate(
    handle.db,
    `INSERT INTO stream_sessions (id, title, platform, status, started_at, ended_at, duration_seconds, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, input.title, input.platform, input.status, input.startedAt, input.endedAt ?? null, durationSeconds, input.notes ?? null]
  )
  saveDatabase(handle)

  return {
    id,
    title: input.title,
    platform: input.platform,
    status: input.status,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    durationSeconds,
    notes: input.notes
  }
}

export function endSession(handle: DbHandle, id: string, endedAt: string): StreamSession | undefined {
  const existing = getSession(handle, id)
  if (!existing) return undefined

  const durationSeconds = Math.max(0, Math.round((Date.parse(endedAt) - Date.parse(existing.startedAt)) / 1000))
  mutate(handle.db, "UPDATE stream_sessions SET status = 'completed', ended_at = ?, duration_seconds = ? WHERE id = ?", [
    endedAt,
    durationSeconds,
    id
  ])
  saveDatabase(handle)

  return { ...existing, status: 'completed', endedAt, durationSeconds }
}
