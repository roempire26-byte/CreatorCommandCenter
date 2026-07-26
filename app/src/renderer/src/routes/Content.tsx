import { useEffect, useMemo, useState } from 'react'
import { Card } from '@renderer/components/Card'
import { EmptyState } from '@renderer/components/EmptyState'
import { Modal } from '@renderer/components/Modal'
import { buttonClassName } from '@renderer/components/Button'
import { AddContentItemForm } from '@renderer/components/forms/AddContentItemForm'
import type { ContentItem } from '@shared/schemas'
import styles from './Content.module.css'

const STATUS_OPTIONS: ContentItem['status'][] = ['idea', 'captured', 'drafting', 'ready-for-review', 'approved', 'published']
const STATUS_FILTERS: (ContentItem['status'] | 'all')[] = ['all', ...STATUS_OPTIONS]

export function Content(): JSX.Element {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<ContentItem['status'] | 'all'>('all')
  const [showAddForm, setShowAddForm] = useState(false)

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

  async function handleStatusChange(item: ContentItem, status: ContentItem['status']): Promise<void> {
    const previous = items
    setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, status } : entry)))
    try {
      await window.commandCenter.db.updateContentItemStatus(item.id, status)
    } catch {
      setItems(previous)
    }
  }

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
        <button type="button" className={buttonClassName('secondary')} onClick={() => setShowAddForm(true)}>
          Add item
        </button>
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
                <select
                  className={styles.statusSelect}
                  value={item.status}
                  onChange={(e) => handleStatusChange(item, e.target.value as ContentItem['status'])}
                  aria-label={`Status for ${item.title}`}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option.replace(/-/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showAddForm && (
        <Modal title="Add content item" onClose={() => setShowAddForm(false)}>
          <AddContentItemForm
            onCreated={(item) => {
              setItems((prev) => [item, ...prev])
              setShowAddForm(false)
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </Modal>
      )}
    </div>
  )
}
