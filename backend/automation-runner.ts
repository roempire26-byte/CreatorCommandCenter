import type { DbHandle } from '@database/db'
import { completeAutomationRun, startAutomationRun } from '@database/repositories/automation-runs'
import { listContentItems } from '@database/repositories/content-items'
import { runContentReviewCheck } from '@automation/workflows/content-review-check'
import type { AutomationRun } from '@shared/schemas'
import { logActivity } from './activity-log'

const CONTENT_REVIEW_THRESHOLD_DAYS = 3

export function runContentReviewCheckWorkflow(handle: DbHandle): AutomationRun {
  const run = startAutomationRun(handle, 'content-review-check', 'user')

  try {
    const items = listContentItems(handle)
    const result = runContentReviewCheck(items, CONTENT_REVIEW_THRESHOLD_DAYS, new Date())
    const completed = completeAutomationRun(handle, run.id, 'completed', result.summary)
    logActivity(handle, {
      category: 'automation',
      action: 'content-review-check',
      status: result.flaggedCount > 0 ? 'warning' : 'success',
      detail: result.summary
    })
    return completed ?? run
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const failed = completeAutomationRun(handle, run.id, 'failed', message)
    logActivity(handle, { category: 'automation', action: 'content-review-check', status: 'danger', detail: message })
    return failed ?? run
  }
}
