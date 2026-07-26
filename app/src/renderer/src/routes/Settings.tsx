import { FormEvent, useEffect, useState } from 'react'
import { Card } from '@renderer/components/Card'
import { buttonClassName } from '@renderer/components/Button'
import { StatusPill } from '@renderer/components/StatusPill'
import { useObsStatus } from '@renderer/lib/useObsStatus'
import { obsStatusDisplay } from '@renderer/lib/obsStatusDisplay'
import type { ObsSettings } from '@shared/schemas'
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

  useEffect(() => {
    window.commandCenter.obs.getSettings().then((current) => {
      setSettings(current)
      setHost(current.host)
      setPort(String(current.port))
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

      <Card title="What's coming" subtitle="Planned in later sprints">
        <div className={styles.upcoming}>
          <div className={styles.upcomingItem}>
            <span className={styles.upcomingSprint}>Sprint 6</span>
            <span>AI provider settings, budget visibility, and privacy controls</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
