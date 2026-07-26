import { randomUUID } from 'crypto'
import type { DbHandle } from '../db'
import { mutate, query, saveDatabase } from '../db'
import type { CreateMetricSnapshotInput, MetricSnapshot } from '@shared/schemas'

interface MetricSnapshotRow {
  id: string
  platform: string
  captured_at: string
  metric_name: string
  value: number
  session_id: string | null
}

function toMetricSnapshot(row: MetricSnapshotRow): MetricSnapshot {
  return {
    id: row.id,
    sessionId: row.session_id ?? '',
    platform: row.platform,
    metricName: row.metric_name,
    value: row.value,
    capturedAt: row.captured_at
  }
}

export function listMetricSnapshotsForSession(handle: DbHandle, sessionId: string): MetricSnapshot[] {
  const rows = query<MetricSnapshotRow>(
    handle.db,
    'SELECT * FROM metric_snapshots WHERE session_id = ? ORDER BY captured_at DESC',
    [sessionId]
  )
  return rows.map(toMetricSnapshot)
}

export function listMetricSnapshots(handle: DbHandle): MetricSnapshot[] {
  const rows = query<MetricSnapshotRow>(handle.db, 'SELECT * FROM metric_snapshots ORDER BY captured_at DESC')
  return rows.map(toMetricSnapshot)
}

export function createMetricSnapshot(handle: DbHandle, input: CreateMetricSnapshotInput): MetricSnapshot {
  const id = randomUUID()
  const capturedAt = new Date().toISOString()

  mutate(
    handle.db,
    `INSERT INTO metric_snapshots (id, platform, captured_at, metric_name, value, session_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.platform, capturedAt, input.metricName, input.value, input.sessionId]
  )
  saveDatabase(handle)

  return { id, capturedAt, platform: input.platform, metricName: input.metricName, value: input.value, sessionId: input.sessionId }
}
