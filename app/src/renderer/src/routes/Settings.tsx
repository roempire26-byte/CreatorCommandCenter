import { FormEvent, useEffect, useState } from 'react'
import { Card } from '@renderer/components/Card'
import { buttonClassName } from '@renderer/components/Button'
import { StatusPill } from '@renderer/components/StatusPill'
import { useObsStatus } from '@renderer/lib/useObsStatus'
import { obsStatusDisplay } from '@renderer/lib/obsStatusDisplay'
import type { ObsSettings, TwitchSettings } from '@shared/schemas'
import formStyles from '@renderer/components/forms/Form.module.css'
import styles from './Settings.module.css'

export function Settings(): JSX.Element {
  const obsStatus = useObsStatus()
  const display = obsStatusDisplay(obsStatus)

  const [settings, setSettings] = useState<ObsSettings | null>(null)
  const [host, setHost] = useState('')
  const [port, setPort] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [twitchSettings, setTwitchSettings] = useState<TwitchSettings | null>(null)
  const [clientId, setClientId] = useState('')
  const [twitchError, setTwitchError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    window.commandCenter.obs.getSettings().then((current) => {
      setSettings(current)
      setHost(current.host)
      setPort(String(current.port))
    })
    window.commandCenter.twitch.getSettings().then((current) => {
      setTwitchSettings(current)
      setClientId(current.clientId ?? '')
    })
  }, [])

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    const portNumber = Number(port)
    if (!host.trim() || !Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) {
      setError('Enter a valid host and a port between 1 and 65535.')
      return
    }

    setSubmitting(true)
    setError(null)
    setSaved(false)
    try {
      const updated = await window.commandCenter.obs.saveSettings({
        host: host.trim(),
        port: portNumber,
        password: password || undefined
      })
      setSettings(updated)
      setPassword('')
      setSaved(true)
    } catch {
      setError("Couldn't save these settings — check the fields and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleTwitchConnect(event: FormEvent): Promise<void> {
    event.preventDefault()
    if (!clientId.trim()) {
      setTwitchError("Enter your Twitch app's Client ID.")
      return
    }

    setConnecting(true)
    setTwitchError(null)
    try {
      const updated = await window.commandCenter.twitch.connect({ clientId: clientId.trim() })
      setTwitchSettings(updated)
    } catch (err) {
      setTwitchError(err instanceof Error ? err.message : "Couldn't connect to Twitch — try again.")
    } finally {
      setConnecting(false)
    }
  }

  async function handleTwitchDisconnect(): Promise<void> {
    const updated = await window.commandCenter.twitch.disconnect()
    setTwitchSettings(updated)
  }

  return (
    <div className={styles.wrap}>
      <Card title="OBS connection" subtitle="Local WebSocket connection — never leaves this machine">
        <div className={styles.statusRow}>
          <StatusPill tone={display.tone} label={display.label} pulse={display.pulse} />
        </div>
        {obsStatus.status === 'auth-required' && (
          <p className={styles.hint}>OBS found this connection but rejected it — enter the WebSocket password below.</p>
        )}

        {settings && (
          <form className={formStyles.form} onSubmit={handleSubmit}>
            <div className={formStyles.row}>
              <div className={formStyles.field}>
                <label className={formStyles.label} htmlFor="obs-host">
                  Host
                </label>
                <input id="obs-host" className={formStyles.input} value={host} onChange={(e) => setHost(e.target.value)} required />
              </div>
              <div className={formStyles.field}>
                <label className={formStyles.label} htmlFor="obs-port">
                  Port
                </label>
                <input
                  id="obs-port"
                  type="number"
                  min="1"
                  max="65535"
                  className={formStyles.input}
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="obs-password">
                Password
              </label>
              <input
                id="obs-password"
                type="password"
                className={formStyles.input}
                placeholder={settings.hasPassword ? 'Leave blank to keep the current password' : 'No password set'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <span className={styles.hint}>
                Stored encrypted on this machine only (Windows credential encryption) — never written to the database or
                logged.
              </span>
            </div>

            {error && <span className={formStyles.error}>{error}</span>}
            {saved && !error && <span className={styles.saved}>Saved.</span>}

            <div className={formStyles.actions}>
              <button type="submit" className={buttonClassName('primary')} disabled={submitting}>
                {submitting ? 'Saving…' : 'Save connection'}
              </button>
            </div>
          </form>
        )}
      </Card>

      <Card title="Twitch connection" subtitle="Reads your follower count only — never posts, never touches chat">
        <div className={styles.statusRow}>
          <StatusPill
            tone={twitchSettings?.connected ? 'success' : 'neutral'}
            label={twitchSettings?.connected ? `Connected as ${twitchSettings.login}` : 'Not connected'}
          />
        </div>

        {twitchSettings?.connected ? (
          <button type="button" className={buttonClassName('secondary')} onClick={handleTwitchDisconnect}>
            Disconnect
          </button>
        ) : (
          twitchSettings && (
            <form className={formStyles.form} onSubmit={handleTwitchConnect}>
              <p className={styles.hint}>
                Register a free app at <strong>dev.twitch.tv/console/apps</strong> (any name/category). Set its OAuth
                Redirect URL to exactly <code>{twitchSettings.redirectUri}</code>, then paste the Client ID it gives you
                below. No client secret is ever needed — only the Client ID.
              </p>
              <div className={formStyles.field}>
                <label className={formStyles.label} htmlFor="twitch-client-id">
                  Client ID
                </label>
                <input
                  id="twitch-client-id"
                  className={formStyles.input}
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                />
              </div>

              {twitchError && <span className={formStyles.error}>{twitchError}</span>}

              <div className={formStyles.actions}>
                <button type="submit" className={buttonClassName('primary')} disabled={connecting}>
                  {connecting ? 'Waiting for you in your browser…' : 'Connect Twitch'}
                </button>
              </div>
            </form>
          )
        )}
      </Card>

      <Card title="What's coming" subtitle="Planned in later sprints">
        <div className={styles.upcoming}>
          <div className={styles.upcomingItem}>
            <span className={styles.upcomingSprint}>Sprint 6</span>
            <span>Automatic "followers gained" per session, using the Twitch connection above</span>
          </div>
          <div className={styles.upcomingItem}>
            <span className={styles.upcomingSprint}>Sprint 6</span>
            <span>TikTok connection — waiting on TikTok's own app-review approval, outside this project's control</span>
          </div>
          <div className={styles.upcomingItem}>
            <span className={styles.upcomingSprint}>Sprint 7</span>
            <span>AI provider settings, budget visibility, and privacy controls</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
