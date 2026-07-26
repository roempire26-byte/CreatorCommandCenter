import initSqlJs, { type Database, type SqlJsStatic, type SqlValue } from 'sql.js'
import { existsSync, readFileSync, renameSync, writeFileSync } from 'fs'
import { join } from 'path'
import { MIGRATIONS } from './migrations/index'

let sqlJs: SqlJsStatic | null = null

export interface DbHandle {
  db: Database
  path: string
}

export function getDbPath(userDataDir: string): string {
  return join(userDataDir, 'creator-command-center.sqlite3')
}

export async function openDatabase(userDataDir: string): Promise<DbHandle> {
  if (!sqlJs) {
    sqlJs = await initSqlJs()
  }
  const path = getDbPath(userDataDir)
  const db = existsSync(path) ? new sqlJs.Database(readFileSync(path)) : new sqlJs.Database()
  runMigrations(db)
  saveDatabase({ db, path })
  return { db, path }
}

export function saveDatabase({ db, path }: DbHandle): void {
  const data = db.export()
  const tmpPath = `${path}.tmp`
  writeFileSync(tmpPath, Buffer.from(data))
  renameSync(tmpPath, path)
}

function runMigrations(db: Database): void {
  db.run('CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)')

  const appliedRows = db.exec('SELECT id FROM schema_migrations')
  const applied = new Set<string>((appliedRows[0]?.values ?? []).map((row) => String(row[0])))

  const pending = MIGRATIONS.filter((migration) => !applied.has(migration.id))
  if (pending.length === 0) return

  db.run('BEGIN TRANSACTION')
  try {
    for (const migration of pending) {
      db.run(migration.sql)
      mutate(db, 'INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)', [
        migration.id,
        new Date().toISOString()
      ])
    }
    db.run('COMMIT')
  } catch (error) {
    db.run('ROLLBACK')
    throw error
  }
}

export function query<T = Record<string, SqlValue>>(db: Database, sql: string, params: SqlValue[] = []): T[] {
  const stmt = db.prepare(sql)
  try {
    stmt.bind(params)
    const rows: T[] = []
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as T)
    }
    return rows
  } finally {
    stmt.free()
  }
}

export function mutate(db: Database, sql: string, params: SqlValue[] = []): void {
  const stmt = db.prepare(sql)
  try {
    stmt.bind(params)
    stmt.step()
  } finally {
    stmt.free()
  }
}
