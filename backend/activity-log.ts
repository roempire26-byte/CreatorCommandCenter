import { randomUUID } from 'crypto'
import type { DbHandle } from '../database/db'
import { insertActivityLog } from '../database/repositories/activity-log'
import type { ActivityLogEntry } from '@shared/schemas'

export interface LogActivityInput {
  category: string
  action: string
  status: ActivityLogEntry['status']
  detail?: string
  correlationId?: string
}

// Only entry point for ActivityLog writes — never pass secrets in `detail`.
export function logActivity(handle: DbHandle, input: LogActivityInput): ActivityLogEntry {
  const entry: ActivityLogEntry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    category: input.category,
    action: input.action,
    status: input.status,
    detail: input.detail ?? null,
    correlationId: input.correlationId ?? null
  }
  insertActivityLog(handle, entry)
  return entry
}
