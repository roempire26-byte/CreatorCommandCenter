import styles from './Meter.module.css'

interface MeterProps {
  label: string
  current: number
  target: number
  unit?: string
  tone?: 'cyan' | 'violet'
}

export function Meter({ label, current, target, unit = '', tone = 'cyan' }: MeterProps): JSX.Element {
  const percent = Math.min(100, Math.round((current / target) * 100))

  return (
    <div className={styles.wrap}>
      <div className={styles.labels}>
        <span>{label}</span>
        <span className={styles.value}>
          {current}
          {unit} / {target}
          {unit}
        </span>
      </div>
      <div className={styles.track} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className={[styles.fill, tone === 'violet' ? styles.fillViolet : ''].join(' ')} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
