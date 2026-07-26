import { useEffect, useState } from 'react'
import type { ObsStatus } from '@shared/schemas'

const IDLE_STATUS: ObsStatus = {
  status: 'offline',
  sceneName: null,
  streaming: false,
  recording: false,
  streamStartedAt: null,
  message: null
}

export function useObsStatus(): ObsStatus {
  const [status, setStatus] = useState<ObsStatus>(IDLE_STATUS)

  useEffect(() => {
    let cancelled = false
    window.commandCenter.obs.getStatus().then((initial) => {
      if (!cancelled) setStatus(initial)
    })
    const unsubscribe = window.commandCenter.obs.onStatusChange((next) => setStatus(next))
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return status
}
