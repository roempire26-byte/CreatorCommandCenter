import { NavLink } from 'react-router-dom'
import { ROUTES } from '@renderer/lib/routes'
import { Icon } from './Icon'
import styles from './NavRail.module.css'

export function NavRail(): JSX.Element {
  return (
    <nav className={styles.rail} aria-label="Primary">
      <div className={styles.brand}>
        <span className={styles.mark} aria-hidden="true" />
        <span className={styles.brandText}>
          <span className={styles.brandTitle}>Creator Command Center</span>
          <span className={styles.brandSubtitle}>Local workspace</span>
        </span>
      </div>

      <div className={styles.nav}>
        {ROUTES.map((route) => (
          <NavLink
            key={route.id}
            to={route.path}
            end={route.path === '/'}
            className={({ isActive }) => [styles.link, isActive ? styles.linkActive : ''].filter(Boolean).join(' ')}
          >
            <Icon name={route.icon} />
            {route.label}
          </NavLink>
        ))}
      </div>

      <div className={styles.footer}>v0.1.0 — Sprint 1</div>
    </nav>
  )
}
