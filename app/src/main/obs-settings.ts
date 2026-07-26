import { safeStorage } from 'electron'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { ObsSettings, SaveObsSettingsInput } from '@shared/schemas'
import type { ObsAdapterSettings } from '@backend/obs/adapter'

interface StoredObsSettings {
  host: string
  port: number
  encryptedPassword: string | null
}

const DEFAULTS: StoredObsSettings = { host: '127.0.0.1', port: 4455, encryptedPassword: null }

function getSettingsPath(userDataDir: string): string {
  return join(userDataDir, 'obs-settings.json')
}

function readStored(userDataDir: string): StoredObsSettings {
  const path = getSettingsPath(userDataDir)
  if (!existsSync(path)) return DEFAULTS
  try {
    return { ...DEFAULTS, ...JSON.parse(readFileSync(path, 'utf8')) }
  } catch {
    return DEFAULTS
  }
}

function writeStored(userDataDir: string, settings: StoredObsSettings): void {
  writeFileSync(getSettingsPath(userDataDir), JSON.stringify(settings, null, 2), 'utf8')
}

export function loadObsSettings(userDataDir: string): ObsSettings {
  const stored = readStored(userDataDir)
  return { host: stored.host, port: stored.port, hasPassword: stored.encryptedPassword != null }
}

export function saveObsSettings(userDataDir: string, input: SaveObsSettingsInput): void {
  const existing = readStored(userDataDir)
  const encryptedPassword =
    input.password != null && input.password.length > 0
      ? safeStorage.isEncryptionAvailable()
        ? safeStorage.encryptString(input.password).toString('base64')
        : existing.encryptedPassword
      : existing.encryptedPassword

  writeStored(userDataDir, { host: input.host, port: input.port, encryptedPassword })
}

export function getObsConnectionSettings(userDataDir: string): ObsAdapterSettings {
  const stored = readStored(userDataDir)
  if (!stored.encryptedPassword) {
    return { host: stored.host, port: stored.port }
  }

  try {
    const password = safeStorage.decryptString(Buffer.from(stored.encryptedPassword, 'base64'))
    return { host: stored.host, port: stored.port, password }
  } catch {
    return { host: stored.host, port: stored.port }
  }
}
