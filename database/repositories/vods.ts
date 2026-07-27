import { randomUUID } from 'crypto'
import type { DbHandle } from '../db'
import { mutate, query, saveDatabase } from '../db'

export type VodStatus = 'pending' | 'processing' | 'analyzed' | 'failed'

export interface Vod {
  id: string
  filePath: string
  filename: string
  status: VodStatus
  transcript: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateVodInput {
  filePath: string
  filename: string
}

interface VodRow {
  id: string
  file_path: string
  filename: string
  status: string
  transcript: string | null
  created_at: string
  updated_at: string
}

function toVod(row: VodRow): Vod {
  return {
    id: row.id,
    filePath: row.file_path,
    filename: row.filename,
    status: row.status as VodStatus,
    transcript: row.transcript,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function listVods(handle: DbHandle): Vod[] {
  const rows = query<VodRow>(handle.db, 'SELECT * FROM vods ORDER BY created_at DESC')
  return rows.map(toVod)
}

export function getVod(handle: DbHandle, id: string): Vod | undefined {
  const rows = query<VodRow>(handle.db, 'SELECT * FROM vods WHERE id = ?', [id])
  return rows[0] ? toVod(rows[0]) : undefined
}

export function createVod(handle: DbHandle, input: CreateVodInput): Vod {
  const id = randomUUID()
  const now = new Date().toISOString()

  mutate(
    handle.db,
    `INSERT INTO vods (id, file_path, filename, status, transcript, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, input.filePath, input.filename, 'pending', null, now, now]
  )
  saveDatabase(handle)

  return { id, filePath: input.filePath, filename: input.filename, status: 'pending', transcript: null, createdAt: now, updatedAt: now }
}

export function updateVodStatus(handle: DbHandle, id: string, status: VodStatus): Vod | undefined {
  const existing = getVod(handle, id)
  if (!existing) return undefined

  const updatedAt = new Date().toISOString()
  mutate(handle.db, 'UPDATE vods SET status = ?, updated_at = ? WHERE id = ?', [status, updatedAt, id])
  saveDatabase(handle)

  return { ...existing, status, updatedAt }
}

export function updateVodTranscript(handle: DbHandle, id: string, transcript: string): Vod | undefined {
  const existing = getVod(handle, id)
  if (!existing) return undefined

  const updatedAt = new Date().toISOString()
  mutate(handle.db, 'UPDATE vods SET transcript = ?, updated_at = ? WHERE id = ?', [transcript, updatedAt, id])
  saveDatabase(handle)

  return { ...existing, transcript, updatedAt }
}
