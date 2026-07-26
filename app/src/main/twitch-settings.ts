import { safeStorage } from 'electron'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { TwitchSettings } from '@shared/schemas'
import { refreshTwitchToken, TWITCH_REDIRECT_URI, TwitchReauthRequiredError, type TwitchConnection } from '@backend/twitch/oauth'

interface StoredTwitchSettings {
  clientId: string | null
  login: string | null
  userId: string | null
  encryptedAccessToken: string | null
  encryptedRefreshToken: string | null
  expiresAt: string | null
}

const DEFAULTS: StoredTwitchSettings = {
  clientId: null,
  login: null,
  userId: null,
  encryptedAccessToken: null,
  encryptedRefreshToken: null,
  expiresAt: null
}

const REFRESH_BUFFER_MS = 60_000

function getSettingsPath(userDataDir: string): string {
  return join(userDataDir, 'twitch-settings.json')
}

function readStored(userDataDir: string): StoredTwitchSettings {
  const path = getSettingsPath(userDataDir)
  if (!existsSync(path)) return DEFAULTS
  try {
    return { ...DEFAULTS, ...JSON.parse(readFileSync(path, 'utf8')) }
  } catch {
    return DEFAULTS
  }
}

function writeStored(userDataDir: string, settings: StoredTwitchSettings): void {
  writeFileSync(getSettingsPath(userDataDir), JSON.stringify(settings, null, 2), 'utf8')
}

function encrypt(value: string): string | null {
  if (!safeStorage.isEncryptionAvailable()) return null
  return safeStorage.encryptString(value).toString('base64')
}

function decrypt(value: string): string | null {
  try {
    return safeStorage.decryptString(Buffer.from(value, 'base64'))
  } catch {
    return null
  }
}

export function loadTwitchSettings(userDataDir: string): TwitchSettings {
  const stored = readStored(userDataDir)
  return {
    clientId: stored.clientId,
    login: stored.login,
    connected: stored.encryptedAccessToken != null && stored.encryptedRefreshToken != null,
    redirectUri: TWITCH_REDIRECT_URI
  }
}

export function saveTwitchConnection(userDataDir: string, clientId: string, connection: TwitchConnection): void {
  writeStored(userDataDir, {
    clientId,
    login: connection.login,
    userId: connection.userId,
    encryptedAccessToken: encrypt(connection.accessToken),
    encryptedRefreshToken: encrypt(connection.refreshToken),
    expiresAt: connection.expiresAt
  })
}

// Keeps the Client ID around on disconnect so the user doesn't have to retype it to reconnect.
export function clearTwitchConnection(userDataDir: string): void {
  const existing = readStored(userDataDir)
  writeStored(userDataDir, { ...DEFAULTS, clientId: existing.clientId })
}

export async function getValidTwitchAccessToken(userDataDir: string): Promise<string> {
  const stored = readStored(userDataDir)
  if (!stored.clientId || !stored.encryptedAccessToken || !stored.encryptedRefreshToken || !stored.expiresAt) {
    throw new TwitchReauthRequiredError('Twitch is not connected.')
  }

  const expiresAt = Date.parse(stored.expiresAt)
  const stillValid = Number.isFinite(expiresAt) && expiresAt - Date.now() > REFRESH_BUFFER_MS
  if (stillValid) {
    const accessToken = decrypt(stored.encryptedAccessToken)
    if (accessToken) return accessToken
  }

  const refreshToken = decrypt(stored.encryptedRefreshToken)
  if (!refreshToken) throw new TwitchReauthRequiredError()

  const refreshed = await refreshTwitchToken(stored.clientId, refreshToken)
  saveTwitchConnection(userDataDir, stored.clientId, refreshed)
  return refreshed.accessToken
}
