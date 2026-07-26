import { StatusPill } from './StatusPill'
import styles from './TopContextBar.module.css'

const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac')

interface TopContextBarProps {
  title: string
  subtitle: string
  onOpenPalette: () => void
}

export function TopContextBar({ title, subtitle, onOpenPalette }: TopContextBarProps): JSX.Element {
  return (
    <header className={styles.bar}>
      <div className={styles.titleGroup}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>

      <div className={styles.actions}>
        <StatusPill tone="neutral" label="OBS offline" />
        <button type="button" className={styles.paletteButton} onClick={onOpenPalette}>
          Search or jump to…
          <span className={styles.kbd}>{isMac ? '⌘' : 'Ctrl'} K</span>
        </button>
      </div>
    </header>
  )
}
