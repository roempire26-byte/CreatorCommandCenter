import { useEffect, useMemo, useState } from 'react'
import { Card } from '@renderer/components/Card'
import { StatusPill } from '@renderer/components/StatusPill'
import { EmptyState } from '@renderer/components/EmptyState'
import { contentItemTone } from '@renderer/lib/statusTones'
import type { ContentItem } from '@shared/schemas'
import styles from './Content.module.css'

const STATUS_FILTERS: (ContentItem['status'] | 'all')[] = [
  'all',
  'idea',
  'captured',
  'drafting',
  'ready-for-review',
  'approved',
  'published'
]

export function Content(): JSX.Element {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<ContentItem['status'] | 'all'>('all')

  useEffect(() => {
    window.commandCenter.db.listContentItems().then((result) => {
      setItems(result)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(
    () => (statusFilter === 'all' ? items : items.filter((item) => item.status === statusFilter)),
    [items, statusFilter]
  )

  return (
    <div className={styles.wrap}>
      <div className={styles.filterRow}>
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            className={[styles.filterButton, statusFilter === status ? styles.filterButtonActive : ''].join(' ')}
            onClick={() => setStatusFilter(status)}
          >
            {status.replace(/-/g, ' ')}
          </button>
        ))}
      </div>

      <Card
        title="Content queue"
        subtitle={loading ? undefined : `${filtered.length} item${filtered.length === 1 ? '' : 's'}${statusFilter === 'all' ? '' : ` · ${statusFilter.replace(/-/g, ' ')}`}`}
      >
        {loading ? (
          <p className={styles.itemMeta}>Loading…</p>
        ) : items.length === 0 ? (
          <EmptyState
            icon="▤"
            title="No content items yet"
            description="After a stream, add clips and drafts here for review before anything is approved or published."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="▤"
            title={`Nothing ${statusFilter.replace(/-/g, ' ')} right now`}
            description="Try a different status filter to see other items."
          />
        ) : (
          <div className={styles.itemList}>
            {filtered.map((item) => (
              <div className={styles.itemRow} key={item.id}>
                <div className={styles.itemLeft}>
                  <span className={styles.itemTitle}>{item.title}</span>
                  <span className={styles.itemMeta}>{item.type}</span>
                  {item.draft && <span className={styles.itemDraft}>{item.draft}</span>}
                </div>
                <StatusPill tone={contentItemTone(item.status)} label={item.status.replace(/-/g, ' ')} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
