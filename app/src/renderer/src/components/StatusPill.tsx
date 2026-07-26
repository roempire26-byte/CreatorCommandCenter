import styles from './StatusPill.module.css'

export type StatusTone = 'success' | 'warning' | 'danger' | 'live' | 'neutral'

const GLYPH: Record<StatusTone, string> = {
  success: '●',
  warning: '!',
  danger: '×',
  live: '●',
  neutral: '○'
}

interface StatusPillProps {
  tone: StatusTone
  label: string
  pulse?: boolean
}

export function StatusPill({ tone, label, pulse }: StatusPillProps): JSX.Element {
  return (
    <span className={[styles.pill, styles[tone]].join(' ')}>
      <span className={[styles.glyph, pulse ? 'pulse-live' : ''].filter(Boolean).join(' ')} aria-hidden="true">
        {GLYPH[tone]}
      </span>
      {label}
    </span>
  )
}
