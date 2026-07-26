import m0001 from './0001_init.sql?raw'
import m0002 from './0002_checklist_items.sql?raw'

export interface Migration {
  id: string
  sql: string
}

export const MIGRATIONS: Migration[] = [
  { id: '0001_init.sql', sql: m0001 },
  { id: '0002_checklist_items.sql', sql: m0002 }
]
