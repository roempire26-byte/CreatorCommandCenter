import { randomUUID } from 'crypto'
import type { DbHandle } from '../db'
import { mutate, query, saveDatabase } from '../db'
import type { CreateGoalInput, Goal } from '@shared/schemas'

interface GoalRow {
  id: string
  metric: string
  label: string
  target: number
  unit: string
  period: string
  current_value: number
}

function toGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    metric: row.metric,
    label: row.label,
    target: row.target,
    unit: row.unit,
    period: row.period,
    currentValue: row.current_value
  }
}

export function listGoals(handle: DbHandle): Goal[] {
  const rows = query<GoalRow>(handle.db, 'SELECT * FROM goals ORDER BY rowid ASC')
  return rows.map(toGoal)
}

export function createGoal(handle: DbHandle, input: CreateGoalInput): Goal {
  const id = randomUUID()
  mutate(
    handle.db,
    `INSERT INTO goals (id, metric, label, target, unit, period, current_value)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, input.metric, input.label, input.target, input.unit, input.period, input.currentValue]
  )
  saveDatabase(handle)

  return { id, ...input }
}
