import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc-channels'
import { createContentItemSchema, createGoalSchema, createSessionSchema, saveObsSettingsSchema } from '@shared/schemas'
import type { DbHandle } from '@database/db'
import { createSession, listSessions } from '@database/repositories/sessions'
import { createGoal, listGoals } from '@database/repositories/goals'
import { createContentItem, listContentItems } from '@database/repositories/content-items'
import { listActivityLog } from '@database/repositories/activity-log'
import { logActivity } from '@backend/activity-log'
import type { ObsAdapter } from '@backend/obs/adapter'
import { loadObsSettings, saveObsSettings } from './obs-settings'

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
}
