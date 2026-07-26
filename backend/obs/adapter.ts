import { OBSWebSocket, OBSWebSocketError } from 'obs-websocket-js'
import type { ObsStatus, ObsStatusValue } from '@shared/schemas'

export interface ObsAdapterSettings {
  host: string
  port: number
  password?: string
}

export interface ObsAdapterOptions {
  getSettings: () => ObsAdapterSettings
  onStatusChange: (status: ObsStatus) => void
  logTransition: (from: ObsStatusValue, to: ObsStatusValue, detail?: string) => void
}

const RECONNECT_MIN_MS = 2000
const RECONNECT_MAX_MS = 30000

function idleStatus(): ObsStatus {
  return { status: 'offline', sceneName: null, streaming: false, recording: false, streamStartedAt: null, message: null }
}

// obs-websocket-js only forwards whatever code/message the server sends, so auth
// failures are detected by message text (stable across server versions) rather
// than a specific numeric close code.
function classifyObsError(error: unknown): { status: ObsStatusValue; message: string } {
  if (error instanceof OBSWebSocketError) {
    const message = error.message
    if (/auth/i.test(message)) return { status: 'auth-required', message }
    return { status: 'errored', message }
  }
  const message = error instanceof Error ? error.message : String(error)
  if (/ECONNREFUSED|ENOTFOUND|ETIMEDOUT|EHOSTUNREACH/i.test(message)) {
    return { status: 'offline', message }
  }
  return { status: 'errored', message }
}

export class ObsAdapter {
  private readonly obs = new OBSWebSocket()
  private readonly options: ObsAdapterOptions
  private status: ObsStatus = idleStatus()
  private lastLoggedStatus: ObsStatusValue = 'offline'
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectDelay = RECONNECT_MIN_MS
  private stopped = true

  constructor(options: ObsAdapterOptions) {
    this.options = options
    this.obs.on('ConnectionClosed', () => this.handleDisconnect())
    this.obs.on('CurrentProgramSceneChanged', (event) => this.applyStatus({ sceneName: event.sceneName }))
    this.obs.on('StreamStateChanged', (event) =>
      this.applyStatus({
        streaming: event.outputActive,
        streamStartedAt: event.outputActive ? new Date().toISOString() : null
      })
    )
    this.obs.on('RecordStateChanged', (event) => this.applyStatus({ recording: event.outputActive }))
  }

  start(): void {
    this.stopped = false
    void this.attemptConnect()
  }

  stop(): void {
    this.stopped = true
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    void this.obs.disconnect().catch(() => {})
  }

  getStatus(): ObsStatus {
    return this.status
  }

  // Real control actions — only permitted while genuinely connected, never
  // attempted opportunistically. StreamStateChanged (subscribed above) is the
  // source of truth for `streaming`, not an optimistic update here.
  async startStream(): Promise<void> {
    if (this.status.status !== 'connected') throw new Error('OBS is not connected')
    await this.obs.call('StartStream')
  }

  async stopStream(): Promise<void> {
    if (this.status.status !== 'connected') throw new Error('OBS is not connected')
    await this.obs.call('StopStream')
  }

  // Called after Settings saves new host/port/password — skip the backoff wait.
  reconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.reconnectDelay = RECONNECT_MIN_MS
    this.stopped = false
    void this.obs.disconnect().catch(() => {})
    void this.attemptConnect()
  }

  private async attemptConnect(): Promise<void> {
    if (this.stopped) return
    const settings = this.options.getSettings()
    this.applyStatus({ status: 'connecting', message: null })

    try {
      await this.obs.connect(`ws://${settings.host}:${settings.port}`, settings.password)
      const [streamStatus, recordStatus, sceneInfo] = await Promise.all([
        this.obs.call('GetStreamStatus'),
        this.obs.call('GetRecordStatus'),
        this.obs.call('GetCurrentProgramScene')
      ])

      this.reconnectDelay = RECONNECT_MIN_MS
      this.applyStatus({
        status: 'connected',
        sceneName: sceneInfo.sceneName,
        streaming: streamStatus.outputActive,
        recording: recordStatus.outputActive,
        streamStartedAt: streamStatus.outputActive ? new Date(Date.now() - streamStatus.outputDuration).toISOString() : null,
        message: null
      })
    } catch (error) {
      const classified = classifyObsError(error)
      this.applyStatus({
        status: classified.status,
        message: classified.message,
        sceneName: null,
        streaming: false,
        recording: false,
        streamStartedAt: null
      })
      this.scheduleReconnect()
    }
  }

  private handleDisconnect(): void {
    if (this.stopped) return
    if (this.status.status === 'connected') {
      this.applyStatus({ status: 'offline', sceneName: null, streaming: false, recording: false, streamStartedAt: null })
    }
    this.scheduleReconnect()
  }

  private scheduleReconnect(): void {
    if (this.stopped) return
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    const jitter = Math.random() * 500
    this.reconnectTimer = setTimeout(() => void this.attemptConnect(), this.reconnectDelay + jitter)
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, RECONNECT_MAX_MS)
  }

  private applyStatus(partial: Partial<ObsStatus>): void {
    this.status = { ...this.status, ...partial }
    this.options.onStatusChange(this.status)

    // Skip 'connecting' and no-op retries (offline -> connecting -> offline) so a closed OBS doesn't spam the log.
    const settled = partial.status
    if (settled && settled !== 'connecting' && settled !== this.lastLoggedStatus) {
      this.options.logTransition(this.lastLoggedStatus, settled, this.status.message ?? undefined)
      this.lastLoggedStatus = settled
    }
  }
}
