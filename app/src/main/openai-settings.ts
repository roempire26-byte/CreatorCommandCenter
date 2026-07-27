import { safeStorage } from 'electron'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { OpenAiSettings } from '@shared/schemas'

interface StoredOpenAiSettings {
  encryptedApiKey: string | null
}

const DEFAULTS: StoredOpenAiSettings = { encryptedApiKey: null }

function getSettingsPath(userDataDir: string): string {
  return join(userDataDir, 'openai-settings.json')
}

function readStored(userDataDir: string): StoredOpenAiSettings {
  const path = getSettingsPath(userDataDir)
  if (!existsSync(path)) return DEFAULTS
  try {
    return { ...DEFAULTS, ...JSON.parse(readFileSync(path, 'utf8')) }
  } catch {
    return DEFAULTS
  }
}

function writeStored(userDataDir: string, settings: StoredOpenAiSettings): void {
  writeFileSync(getSettingsPath(userDataDir), JSON.stringify(settings, null, 2), 'utf8')
}

export function loadOpenAiSettings(userDataDir: string): OpenAiSettings {
  const stored = readStored(userDataDir)
  return { configured: stored.encryptedApiKey != null }
}

// Same rationale as claude-settings.ts's saveClaudeApiKey: saving IS the whole action here, so a
// silent no-op on unavailable encryption would leave the user thinking it worked. Throw instead.
export function saveOpenAiApiKey(userDataDir: string, apiKey: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Secure storage isn't available on this machine — the API key can't be saved safely.")
  }
  writeStored(userDataDir, { encryptedApiKey: safeStorage.encryptString(apiKey).toString('base64') })
}

export function clearOpenAiApiKey(userDataDir: string): void {
  writeStored(userDataDir, { encryptedApiKey: null })
}

// Internal, main-process-only accessor — never wired to IPC or exposed to the renderer. Unlike
// claude-settings.ts's getClaudeApiKey (built ahead of need), this one is actually called, by
// the vod:transcribe IPC handler, to pass the real key into the transcription orchestration
// function as a plain parameter.
export function getOpenAiApiKey(userDataDir: string): string | null {
  const stored = readStored(userDataDir)
  if (!stored.encryptedApiKey) return null
  try {
    return safeStorage.decryptString(Buffer.from(stored.encryptedApiKey, 'base64'))
  } catch {
    return null
  }
}
