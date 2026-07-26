import { randomUUID } from 'crypto'
import type { DbHandle } from '../db'
import { mutate, query, saveDatabase } from '../db'
import type { ContentItem, CreateContentItemInput } from '@shared/schemas'

interface ContentItemRow {
  id: string
  source_session_id: string | null
  type: string
  status: string
  title: string
  draft: string | null
  due_at: string | null
}

function toContentItem(row: ContentItemRow): ContentItem {
  return {
    id: row.id,
    sourceSessionId: row.source_session_id ?? undefined,
    type: row.type,
    status: row.status as ContentItem['status'],
    title: row.title,
    draft: row.draft ?? undefined,
    dueAt: row.due_at ?? undefined
  }
}

export function listContentItems(handle: DbHandle): ContentItem[] {
  const rows = query<ContentItemRow>(handle.db, 'SELECT * FROM content_items ORDER BY rowid DESC')
  return rows.map(toContentItem)
}

export function createContentItem(handle: DbHandle, input: CreateContentItemInput): ContentItem {
  const id = randomUUID()
  mutate(
    handle.db,
    `INSERT INTO content_items (id, source_session_id, type, status, title, draft, due_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, input.sourceSessionId ?? null, input.type, input.status, input.title, input.draft ?? null, input.dueAt ?? null]
  )
  saveDatabase(handle)

  return { id, ...input }
}
