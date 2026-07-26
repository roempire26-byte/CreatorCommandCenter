import { createServer } from 'http'
import { randomBytes } from 'crypto'

export const TWITCH_REDIRECT_PORT = 17945
export const TWITCH_REDIRECT_URI = `http://localhost:${TWITCH_REDIRECT_PORT}/callback`

const AUTHORIZE_URL = 'https://id.twitch.tv/oauth2/authorize'
const TOKEN_URL = 'https://id.twitch.tv/oauth2/token'
const VALIDATE_URL = 'https://id.twitch.tv/oauth2/validate'
const CONNECT_TIMEOUT_MS = 5 * 60 * 1000

export interface TwitchConnection {
  accessToken: string
  refreshToken: string
  expiresAt: string
  login: string
  userId: string
}

export interface ConnectTwitchOptions {
  clientId: string
  openUrl: (url: string) => void
}

// Twitch rejected the refresh token itself (revoked/expired) — distinct from a
// transient network failure, so callers know to prompt reconnect rather than retry.
export class TwitchReauthRequiredError extends Error {
  constructor(message = 'Twitch connection needs to be reconnected.') {
    super(message)
    this.name = 'TwitchReauthRequiredError'
  }
}

export function generateState(): string {
  return randomBytes(16).toString('hex')
}

export function buildAuthorizeUrl(clientId: string, state: string): string {
  const url = new URL(AUTHORIZE_URL)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', TWITCH_REDIRECT_URI)
  url.searchParams.set('scope', '')
  url.searchParams.set('state', state)
  return url.toString()
}

export type CallbackResult = { code: string } | { error: string }

export function parseCallbackParams(query: URLSearchParams, expectedState: string): CallbackResult {
  const state = query.get('state')
  if (state !== expectedState) {
    return { error: 'State did not match — connection rejected for safety. Please try again.' }
  }
  const error = query.get('error')
  if (error) {
    return { error: query.get('error_description') ?? error }
  }
  const code = query.get('code')
  if (!code) {
    return { error: 'No authorization code was received from Twitch.' }
  }
  return { code }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function callbackPage(result: CallbackResult): string {
  if ('error' in result) {
    return `<html><body style="font-family:sans-serif"><h2>Connection failed</h2><p>${escapeHtml(result.error)}</p><p>You can close this tab and return to Creator Command Center.</p></body></html>`
  }
  return `<html><body style="font-family:sans-serif"><h2>Connected</h2><p>You can close this tab and return to Creator Command Center.</p></body></html>`
}

async function waitForAuthorizationCode(clientId: string, openUrl: (url: string) => void): Promise<string> {
  const state = generateState()

  return new Promise<string>((resolve, reject) => {
    const server = createServer((req, res) => {
      if (!req.url) return
      const url = new URL(req.url, `http://localhost:${TWITCH_REDIRECT_PORT}`)
      if (url.pathname !== '/callback') {
        res.writeHead(404)
        res.end()
        return
      }

      const result = parseCallbackParams(url.searchParams, state)
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(callbackPage(result))

      clearTimeout(timeout)
      server.close()
      if ('error' in result) reject(new Error(result.error))
      else resolve(result.code)
    })

    const timeout = setTimeout(() => {
      server.close()
      reject(new Error('Timed out waiting for Twitch authorization — please try connecting again.'))
    }, CONNECT_TIMEOUT_MS)

    server.on('error', (err: NodeJS.ErrnoException) => {
      clearTimeout(timeout)
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`Port ${TWITCH_REDIRECT_PORT} is already in use on this machine — close whatever's using it and try again.`))
      } else {
        reject(err)
      }
    })

    server.listen(TWITCH_REDIRECT_PORT, '127.0.0.1', () => {
      openUrl(buildAuthorizeUrl(clientId, state))
    })
  })
}

async function finalizeConnection(accessToken: string, refreshToken: string, expiresIn: number): Promise<TwitchConnection> {
  const response = await fetch(VALIDATE_URL, { headers: { Authorization: `OAuth ${accessToken}` } })
  if (!response.ok) {
    throw new Error('Twitch accepted the token but the follow-up identity check failed.')
  }
  const data = (await response.json()) as { login: string; user_id: string; expires_in?: number }
  const expiresAt = new Date(Date.now() + (data.expires_in ?? expiresIn) * 1000).toISOString()
  return { accessToken, refreshToken, expiresAt, login: data.login, userId: data.user_id }
}

async function exchangeCodeForTokens(clientId: string, code: string): Promise<TwitchConnection> {
  const body = new URLSearchParams({
    client_id: clientId,
    code,
    grant_type: 'authorization_code',
    redirect_uri: TWITCH_REDIRECT_URI
  })
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
  if (!response.ok) {
    throw new Error('Twitch rejected the connection request. Double check the Client ID and redirect URL.')
  }
  const data = (await response.json()) as { access_token: string; refresh_token: string; expires_in: number }
  return finalizeConnection(data.access_token, data.refresh_token, data.expires_in)
}

export async function connectTwitch(options: ConnectTwitchOptions): Promise<TwitchConnection> {
  const code = await waitForAuthorizationCode(options.clientId, options.openUrl)
  return exchangeCodeForTokens(options.clientId, code)
}

export async function refreshTwitchToken(clientId: string, refreshToken: string): Promise<TwitchConnection> {
  const body = new URLSearchParams({
    client_id: clientId,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  })
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
  if (!response.ok) {
    throw new TwitchReauthRequiredError()
  }
  const data = (await response.json()) as { access_token: string; refresh_token: string; expires_in: number }
  return finalizeConnection(data.access_token, data.refresh_token, data.expires_in)
}
