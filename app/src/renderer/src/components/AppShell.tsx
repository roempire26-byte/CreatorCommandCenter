import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '@renderer/lib/routes'
import { NavRail } from './NavRail'
import { TopContextBar } from './TopContextBar'
import { CommandPalette } from './CommandPalette'
import styles from './AppShell.module.css'

export function AppShell(): JSX.Element {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const location = useLocation()
  const active = ROUTES.find((route) => route.path === location.pathname) ?? ROUTES[0]

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent): void {
      const isModifierK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
      if (isModifierK) {
        event.preventDefault()
        setPaletteOpen((open) => !open)
      }
      if (event.key === 'Escape') {
        setPaletteOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [])

  return (
    <div className={styles.shell}>
      <NavRail />
      <div className={styles.main}>
        <TopContextBar title={active.label} subtitle={active.description} onOpenPalette={() => setPaletteOpen(true)} />
        <div className={styles.content}>
          <div className={styles.contentInner}>
            <Outlet />
          </div>
        </div>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
