import { randomUUID } from 'crypto'
import type { DbHandle } from '../db'
import { mutate, query, saveDatabase } from '../db'
import type { AutomationRun, AutomationRunStatus } from '@shared/schemas'

interface AutomationRunRow {
  id: string
  workflow: string
  status: string
  initiated_by: string
  started_at: string
  completed_at: string | null
  result: string | null
}

function toAutomationRun(row: AutomationRunRow): AutomationRun {
  return {
    id: row.id,
    workflow: row.workflow,
    status: row.status as AutomationRunStatus,
    initiatedBy: row.initiated_by,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    result: row.result
  }
}

export function listAutomationRuns(handle: DbHandle, limit = 50): AutomationRun[] {
  const rows = query<AutomationRunRow>(handle.db, 'SELECT * FROM automation_runs ORDER BY started_at DESC LIMIT ?', [limit])
  return rows.map(toAutomationRun)
}

export function getAutomationRun(handle: DbHandle, id: string): AutomationRun | undefined {
  const rows = query<AutomationRunRow>(handle.db, 'SELECT * FROM automation_runs WHERE id = ?', [id])
  return rows[0] ? toAutomationRun(rows[0]) : undefined
}

export function startAutomationRun(handle: DbHandle, workflow: string, initiatedBy: string): AutomationRun {
  const id = randomUUID()
  const startedAt = new Date().toISOString()

  mutate(
    handle.db,
    `INSERT INTO automation_runs (id, workflow, status, initiated_by, started_at, completed_at, result)
     VALUES (?, ?, 'running', ?, ?, NULL, NULL)`,
    [id, workflow, initiatedBy, startedAt]
  )
  saveDatabase(handle)

  return { id, workflow, status: 'running', initiatedBy, startedAt, completedAt: null, result: null }
}

export function completeAutomationRun(
  handle: DbHandle,
  id: string,
  status: Exclude<AutomationRunStatus, 'running'>,
  result: string
): AutomationRun | undefined {
  const existing = getAutomationRun(handle, id)
  if (!existing) return undefined

  const completedAt = new Date().toISOString()
  mutate(handle.db, 'UPDATE automation_runs SET status = ?, completed_at = ?, result = ? WHERE id = ?', [
    status,
    completedAt,
    result,
    id
  ])
  saveDatabase(handle)

  return { ...existing, status, completedAt, result }
}
