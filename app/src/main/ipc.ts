import { ipcMain, shell } from 'electron'
import { IPC } from '@shared/ipc-channels'
import {
  connectTwitchSchema,
  createChecklistItemSchema,
  createContentItemSchema,
  createGoalSchema,
  createMetricSnapshotSchema,
  createSessionSchema,
  deleteChecklistItemSchema,
  endSessionSchema,
  listMetricSnapshotsSchema,
  saveObsSettingsSchema,
  startSessionSchema,
  updateContentItemStatusSchema
} from '@shared/schemas'
import type { DbHandle } from '@database/db'
import { createSession, endSession, listSessions } from '@database/repositories/sessions'
import { createGoal, listGoals } from '@database/repositories/goals'
import { createContentItem, listContentItems, updateContentItemStatus } from '@database/repositories/content-items'
import { createChecklistItem, deleteChecklistItem, listChecklistItems } from '@database/repositories/checklist-items'
import { createMetricSnapshot, listMetricSnapshots, listMetricSnapshotsForSession } from '@database/repositories/metric-snapshots'
import { listAutomationRuns } from '@database/repositories/automation-runs'
import { listActivityLog } from '@database/repositories/activity-log'
import { logActivity } from '@backend/activity-log'
import { runContentReviewCheckWorkflow } from '@backend/automation-runner'
import { connectTwitch } from '@backend/twitch/oauth'
import type { ObsAdapter } from '@backend/obs/adapter'
import { loadObsSettings, saveObsSettings } from './obs-settings'
import { clearTwitchConnection, loadTwitchSettings, saveTwitchConnection } from './twitch-settings'

interface RegisterIpcOptions {
  dbHandle: DbHandle
  obsAdapter: ObsAdapter
  userDataDir: string
}

export function registerIpcHandlers({ dbHandle, obsAdapter, userDataDir }: RegisterIpcOptions): void {
  ipcMain.handle(IPC.dbListSessions, () => listSessions(dbHandle))
  ipcMain.handle(IPC.dbCreateSession, (_event, input: unknown) => {
    const parsed = createSessionSchema.parse(input)
    const session = createSession(dbHandle, parsed)
    logActivity(dbHandle, { category: 'session', action: 'session-created', status: 'success', detail: session.title })
    return session
  })

  ipcMain.handle(IPC.dbStartSession, (_event, input: unknown) => {
    const parsed = startSessionSchema.parse(input)
    const session = createSession(dbHandle, { ...parsed, status: 'live', startedAt: new Date().toISOString() })
    logActivity(dbHandle, { category: 'session', action: 'session-started', status: 'live', detail: session.title })
    return session
  })
  ipcMain.handle(IPC.dbEndSession, (_event, input: unknown) => {
    const parsed = endSessionSchema.parse(input)
    const session = endSession(dbHandle, parsed.id, new Date().toISOString())
    if (!session) throw new Error('Session not found')
    logActivity(dbHandle, {
      category: 'session',
      action: 'session-ended',
      status: 'success',
      detail: `${session.title} — ${session.durationSeconds ?? 0}s`
    })
    return session
  })

  ipcMain.handle(IPC.dbListGoals, () => listGoals(dbHandle))
  ipcMain.handle(IPC.dbCreateGoal, (_event, input: unknown) => {
    const parsed = createGoalSchema.parse(input)
    const goal = createGoal(dbHandle, parsed)
    logActivity(dbHandle, { category: 'goal', action: 'goal-created', status: 'success', detail: goal.label })
    return goal
  })

  ipcMain.handle(IPC.dbListContentItems, () => listContentItems(dbHandle))
  ipcMain.handle(IPC.dbCreateContentItem, (_event, input: unknown) => {
    const parsed = createContentItemSchema.parse(input)
    const item = createContentItem(dbHandle, parsed)
    logActivity(dbHandle, { category: 'content', action: 'content-item-created', status: 'success', detail: item.title })
    return item
  })

  ipcMain.handle(IPC.dbUpdateContentItemStatus, (_event, input: unknown) => {
    const parsed = updateContentItemStatusSchema.parse(input)
    const item = updateContentItemStatus(dbHandle, parsed.id, parsed.status)
    if (!item) throw new Error('Content item not found')
    logActivity(dbHandle, {
      category: 'content',
      action: 'content-item-status-changed',
      status: 'success',
      detail: `${item.title} -> ${parsed.status}`
    })
    return item
  })

  ipcMain.handle(IPC.dbListChecklistItems, () => listChecklistItems(dbHandle))
  ipcMain.handle(IPC.dbCreateChecklistItem, (_event, input: unknown) => {
    const parsed = createChecklistItemSchema.parse(input)
    return createChecklistItem(dbHandle, parsed)
  })
  ipcMain.handle(IPC.dbDeleteChecklistItem, (_event, input: unknown) => {
    const parsed = deleteChecklistItemSchema.parse(input)
    deleteChecklistItem(dbHandle, parsed.id)
  })

  ipcMain.handle(IPC.dbCreateMetricSnapshot, (_event, input: unknown) => {
    const parsed = createMetricSnapshotSchema.parse(input)
    const snapshot = createMetricSnapshot(dbHandle, parsed)
    logActivity(dbHandle, {
      category: 'metrics',
      action: 'metric-recorded',
      status: 'success',
      detail: `${parsed.metricName}: ${parsed.value} (${parsed.platform})`
    })
    return snapshot
  })
  ipcMain.handle(IPC.dbListMetricSnapshotsForSession, (_event, input: unknown) => {
    const parsed = listMetricSnapshotsSchema.parse(input)
    return listMetricSnapshotsForSession(dbHandle, parsed.sessionId)
  })
  ipcMain.handle(IPC.dbListMetricSnapshots, () => listMetricSnapshots(dbHandle))

  ipcMain.handle(IPC.dbListAutomationRuns, () => listAutomationRuns(dbHandle))

  ipcMain.handle(IPC.automationRunContentReviewCheck, () => runContentReviewCheckWorkflow(dbHandle))

  ipcMain.handle(IPC.dbListActivity, (_event, limit: unknown) => {
    const safeLimit = typeof limit === 'number' && Number.isFinite(limit) ? Math.min(Math.max(1, limit), 200) : undefined
    return listActivityLog(dbHandle, safeLimit)
  })

  ipcMain.handle(IPC.obsGetStatus, () => obsAdapter.getStatus())

  ipcMain.handle(IPC.obsGetSettings, () => loadObsSettings(userDataDir))
  ipcMain.handle(IPC.obsSaveSettings, (_event, input: unknown) => {
    const parsed = saveObsSettingsSchema.parse(input)
    saveObsSettings(userDataDir, parsed)
    logActivity(dbHandle, {
      category: 'obs',
      action: 'settings-updated',
      status: 'success',
      detail: `${parsed.host}:${parsed.port}`
    })
    obsAdapter.reconnect()
    return loadObsSettings(userDataDir)
  })

  ipcMain.handle(IPC.obsStartStream, async () => {
    try {
      await obsAdapter.startStream()
      logActivity(dbHandle, { category: 'obs', action: 'start-stream', status: 'success' })
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      logActivity(dbHandle, { category: 'obs', action: 'start-stream', status: 'danger', detail })
      throw error
    }
  })

  ipcMain.handle(IPC.obsStopStream, async () => {
    try {
      await obsAdapter.stopStream()
      logActivity(dbHandle, { category: 'obs', action: 'stop-stream', status: 'success' })
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      logActivity(dbHandle, { category: 'obs', action: 'stop-stream', status: 'danger', detail })
      throw error
    }
  })

  ipcMain.handle(IPC.twitchGetSettings, () => loadTwitchSettings(userDataDir))

  ipcMain.handle(IPC.twitchConnect, async (_event, input: unknown) => {
    const parsed = connectTwitchSchema.parse(input)
    try {
      const connection = await connectTwitch({
        clientId: parsed.clientId,
        openUrl: (url) => {
          void shell.openExternal(url)
        }
      })
      saveTwitchConnection(userDataDir, parsed.clientId, connection)
      logActivity(dbHandle, {
        category: 'twitch',
        action: 'connected',
        status: 'success',
        detail: `Connected as ${connection.login}`
      })
      return loadTwitchSettings(userDataDir)
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      logActivity(dbHandle, { category: 'twitch', action: 'connect-failed', status: 'danger', detail })
      throw error
    }
  })

  ipcMain.handle(IPC.twitchDisconnect, () => {
    clearTwitchConnection(userDataDir)
    logActivity(dbHandle, { category: 'twitch', action: 'disconnected', status: 'neutral' })
    return loadTwitchSettings(userDataDir)
  })
}
