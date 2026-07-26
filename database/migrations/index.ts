import m0001 from './0001_init.sql?raw'

export interface Migration {
  id: string
  sql: string
}

export const MIGRATIONS: Migration[] = [{ id: '0001_init.sql', sql: m0001 }]
