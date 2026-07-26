import { useEffect, useState } from 'react'

function formatElapsed(startedAt: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(startedAt)) / 1000))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  const pad = (n: number): string => String(n).padStart(2, '0')
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`
}

export function useElapsedTime(startedAt: string | null): string {
  const [elapsed, setElapsed] = useState(() => (startedAt ? formatElapsed(startedAt) : '0:00'))

  useEffect(() => {
    if (!startedAt) return
    setElapsed(formatElapsed(startedAt))
    const interval = setInterval(() => setElapsed(formatElapsed(startedAt)), 1000)
    return () => clearInterval(interval)
  }, [startedAt])

  return elapsed
}
