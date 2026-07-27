import m0001 from './0001_init.sql?raw'
import m0002 from './0002_checklist_items.sql?raw'
import m0003 from './0003_content_item_status_changed_at.sql?raw'
import m0004 from './0004_content_intelligence.sql?raw'

export interface Migration {
  id: string
  sql: string
}

export const MIGRATIONS: Migration[] = [
  { id: '0001_init.sql', sql: m0001 },
  { id: '0002_checklist_items.sql', sql: m0002 },
  { id: '0003_content_item_status_changed_at.sql', sql: m0003 },
  { id: '0004_content_intelligence.sql', sql: m0004 }
]
