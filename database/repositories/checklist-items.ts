import { randomUUID } from 'crypto'
import type { DbHandle } from '../db'
import { mutate, query, saveDatabase } from '../db'
import type { ChecklistItem, CreateChecklistItemInput } from '@shared/schemas'

interface ChecklistItemRow {
  id: string
  label: string
  sort_order: number
}

function toChecklistItem(row: ChecklistItemRow): ChecklistItem {
  return { id: row.id, label: row.label, sortOrder: row.sort_order }
}

export function listChecklistItems(handle: DbHandle): ChecklistItem[] {
  const rows = query<ChecklistItemRow>(handle.db, 'SELECT * FROM checklist_items ORDER BY sort_order ASC')
  return rows.map(toChecklistItem)
}

export function createChecklistItem(handle: DbHandle, input: CreateChecklistItemInput): ChecklistItem {
  const id = randomUUID()
  const [{ nextOrder } = { nextOrder: 0 }] = query<{ nextOrder: number }>(
    handle.db,
    'SELECT COALESCE(MAX(sort_order), -1) + 1 AS nextOrder FROM checklist_items'
  )

  mutate(handle.db, 'INSERT INTO checklist_items (id, label, sort_order) VALUES (?, ?, ?)', [id, input.label, nextOrder])
  saveDatabase(handle)

  return { id, label: input.label, sortOrder: nextOrder }
}

export function deleteChecklistItem(handle: DbHandle, id: string): void {
  mutate(handle.db, 'DELETE FROM checklist_items WHERE id = ?', [id])
  saveDatabase(handle)
}
