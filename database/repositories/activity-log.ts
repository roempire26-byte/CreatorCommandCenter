import type { DbHandle } from '../db'
import { mutate, query, saveDatabase } from '../db'
import type { ActivityLogEntry } from '@shared/schemas'

interface ActivityLogRow {
  id: string
  timestamp: string
  category: string
  action: string
  status: string
  detail: string | null
  correlation_id: string | null
}

function toEntry(row: ActivityLogRow): ActivityLogEntry {
  return {
    id: row.id,
    timestamp: row.timestamp,
    category: row.category,
    action: row.action,
    status: row.status as ActivityLogEntry['status'],
    detail: row.detail,
    correlationId: row.correlation_id
  }
}

export function listActivityLog(handle: DbHandle, limit = 50): ActivityLogEntry[] {
  const rows = query<ActivityLogRow>(handle.db, 'SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT ?', [limit])
  return rows.map(toEntry)
}

export function insertActivityLog(handle: DbHandle, entry: ActivityLogEntry, persist = true): void {
  mutate(
    handle.db,
    `INSERT INTO activity_log (id, timestamp, category, action, status, detail, correlation_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [entry.id, entry.timestamp, entry.category, entry.action, entry.status, entry.detail, entry.correlationId]
  )
  if (persist) saveDatabase(handle)
}
