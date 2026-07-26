import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES, RouteDef } from '@renderer/lib/routes'
import { ActionDef, PLACEHOLDER_ACTIONS } from '@renderer/lib/actions'
import { Icon } from './Icon'
import styles from './CommandPalette.module.css'

type Entry =
  | { kind: 'page'; route: RouteDef }
  | { kind: 'action'; action: ActionDef }

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

function matches(query: string, label: string, description: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return label.toLowerCase().includes(q) || description.toLowerCase().includes(q)
}

export function CommandPalette({ open, onClose }: CommandPaletteProps): JSX.Element | null {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const entries = useMemo<Entry[]>(() => {
    const pages: Entry[] = ROUTES.filter((route) => matches(query, route.label, route.description)).map((route) => ({
      kind: 'page',
      route
    }))
    const actions: Entry[] = PLACEHOLDER_ACTIONS.filter((action) => matches(query, action.label, action.description)).map(
      (action) => ({ kind: 'action', action })
    )
    return [...pages, ...actions]
  }, [query])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  if (!open) return null

  function activate(entry: Entry | undefined): void {
    if (!entry) return
    const path = entry.kind === 'page' ? entry.route.path : entry.action.targetPath
    navigate(path)
    onClose()
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, entries.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      activate(entries[activeIndex])
    }
  }

  const pageEntries = entries.filter((entry): entry is Extract<Entry, { kind: 'page' }> => entry.kind === 'page')
  const actionEntries = entries.filter((entry): entry is Extract<Entry, { kind: 'action' }> => entry.kind === 'action')

  return (
    <div className={styles.overlay} onMouseDown={onClose} role="presentation">
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.inputRow}>
          <Icon name="grid" width={16} height={16} />
          <input
            ref={inputRef}
            className={styles.input}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages and actions…"
            aria-label="Search pages and actions"
          />
        </div>

        <div className={styles.results}>
          {entries.length === 0 && <div className={styles.empty}>No matches. Try a different search.</div>}

          {pageEntries.length > 0 && (
            <>
              <div className={styles.groupLabel}>Pages</div>
              {pageEntries.map((entry) => {
                const index = entries.indexOf(entry)
                return (
                  <div
                    key={entry.route.id}
                    className={[styles.item, index === activeIndex ? styles.itemActive : ''].join(' ')}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => activate(entry)}
                  >
                    <div className={styles.itemLeft}>
                      <Icon name={entry.route.icon} width={16} height={16} />
                      <div>
                        <div className={styles.itemLabel}>{entry.route.label}</div>
                        <div className={styles.itemDescription}>{entry.route.description}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {actionEntries.length > 0 && (
            <>
              <div className={styles.groupLabel}>Actions</div>
              {actionEntries.map((entry) => {
                const index = entries.indexOf(entry)
                return (
                  <div
                    key={entry.action.id}
                    className={[styles.item, index === activeIndex ? styles.itemActive : ''].join(' ')}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => activate(entry)}
                  >
                    <div className={styles.itemLeft}>
                      <div>
                        <div className={styles.itemLabel}>{entry.action.label}</div>
                        <div className={styles.itemDescription}>{entry.action.description}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
