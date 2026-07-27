import { safeStorage } from 'electron'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { ClaudeSettings } from '@shared/schemas'

interface StoredClaudeSettings {
  encryptedApiKey: string | null
}

const DEFAULTS: StoredClaudeSettings = { encryptedApiKey: null }

function getSettingsPath(userDataDir: string): string {
  return join(userDataDir, 'claude-settings.json')
}

function readStored(userDataDir: string): StoredClaudeSettings {
  const path = getSettingsPath(userDataDir)
  if (!existsSync(path)) return DEFAULTS
  try {
    return { ...DEFAULTS, ...JSON.parse(readFileSync(path, 'utf8')) }
  } catch {
    return DEFAULTS
  }
}

function writeStored(userDataDir: string, settings: StoredClaudeSettings): void {
  writeFileSync(getSettingsPath(userDataDir), JSON.stringify(settings, null, 2), 'utf8')
}

export function loadClaudeSettings(userDataDir: string): ClaudeSettings {
  const stored = readStored(userDataDir)
  return { configured: stored.encryptedApiKey != null }
}

// Unlike obs-settings.ts's save (which silently keeps the previous encrypted value when
// safeStorage is unavailable, since host/port still save independently of the password),
// saving the Claude key IS the entire action here -- silently no-op-ing would leave the user
// thinking it worked. Throwing surfaces a real, visible error instead, matching this project's
// existing "never fail silently" rule (OBS auth-required states, Twitch reconnect prompts).
export function saveClaudeApiKey(userDataDir: string, apiKey: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Secure storage isn't available on this machine — the API key can't be saved safely.")
  }
  writeStored(userDataDir, { encryptedApiKey: safeStorage.encryptString(apiKey).toString('base64') })
}

export function clearClaudeApiKey(userDataDir: string): void {
  writeStored(userDataDir, { encryptedApiKey: null })
}

// Internal, main-process-only accessor for the real key -- never wired to IPC or exposed to the
// renderer. Exists now so the future Claude-calling task doesn't need to touch this storage
// module at all, the same way Sprint 6's getValidTwitchAccessToken was built in the OAuth
// connect slice ahead of the slices that actually call it.
export function getClaudeApiKey(userDataDir: string): string | null {
  const stored = readStored(userDataDir)
  if (!stored.encryptedApiKey) return null
  try {
    return safeStorage.decryptString(Buffer.from(stored.encryptedApiKey, 'base64'))
  } catch {
    return null
  }
}
