import { useEffect, useState } from 'react'
import { Card } from '@renderer/components/Card'
import { StatusPill } from '@renderer/components/StatusPill'
import { EmptyState } from '@renderer/components/EmptyState'
import { buttonClassName } from '@renderer/components/Button'
import { vodTone } from '@renderer/lib/statusTones'
import { formatDateTime } from '@renderer/lib/format'
import type { Vod } from '@shared/schemas'
import styles from './Clips.module.css'

export function Clips(): JSX.Element {
  const [vods, setVods] = useState<Vod[]>([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState(false)

  useEffect(() => {
    window.commandCenter.vod.list().then((result) => {
      setVods(result)
      setLoading(false)
    })
  }, [])

  async function handleSelect(): Promise<void> {
    setSelecting(true)
    try {
      const vod = await window.commandCenter.vod.selectFile()
      if (vod) setVods((prev) => [vod, ...prev])
    } finally {
      setSelecting(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <Card title="Select a recording" subtitle="Pick a local video file to add it to your VOD library">
        <p className={styles.hint}>
          Nothing is copied or uploaded — the app only remembers where the file already is on this machine.
        </p>
        <button type="button" className={buttonClassName('primary')} onClick={handleSelect} disabled={selecting}>
          {selecting ? 'Waiting for file…' : 'Select a VOD'}
        </button>
      </Card>

      <Card title="VOD library" subtitle="Every recording you've added">
        {loading ? (
          <p className={styles.hint}>Loading…</p>
        ) : vods.length === 0 ? (
          <EmptyState icon="▶" title="No VODs yet" description="Select a local recording above to add it here." />
        ) : (
          <div className={styles.vodList}>
            {vods.map((vod) => (
              <div className={styles.vodRow} key={vod.id}>
                <div className={styles.vodLeft}>
                  <span className={styles.vodFilename}>{vod.filename}</span>
                  <span className={styles.vodMeta}>Added {formatDateTime(vod.createdAt)}</span>
                </div>
                <StatusPill tone={vodTone(vod.status)} label={vod.status} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
