import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type {
  ActivityLogEntry,
  ChecklistItem,
  ContentItem,
  CreateChecklistItemInput,
  CreateContentItemInput,
  CreateGoalInput,
  CreateSessionInput,
  Goal,
  ObsSettings,
  ObsStatus,
  SaveObsSettingsInput,
  StreamSession
} from '@shared/schemas'

const db = {
  listSessions: (): Promise<StreamSession[]> => ipcRenderer.invoke(IPC.dbListSessions),
  createSession: (input: CreateSessionInput): Promise<StreamSession> => ipcRenderer.invoke(IPC.dbCreateSession, input),
  listGoals: (): Promise<Goal[]> => ipcRenderer.invoke(IPC.dbListGoals),
  createGoal: (input: CreateGoalInput): Promise<Goal> => ipcRenderer.invoke(IPC.dbCreateGoal, input),
  listContentItems: (): Promise<ContentItem[]> => ipcRenderer.invoke(IPC.dbListContentItems),
  createContentItem: (input: CreateContentItemInput): Promise<ContentItem> => ipcRenderer.invoke(IPC.dbCreateContentItem, input),
  listChecklistItems: (): Promise<ChecklistItem[]> => ipcRenderer.invoke(IPC.dbListChecklistItems),
  createChecklistItem: (input: CreateChecklistItemInput): Promise<ChecklistItem> =>
    ipcRenderer.invoke(IPC.dbCreateChecklistItem, input),
  deleteChecklistItem: (id: string): Promise<void> => ipcRenderer.invoke(IPC.dbDeleteChecklistItem, { id }),
  listActivity: (limit?: number): Promise<ActivityLogEntry[]> => ipcRenderer.invoke(IPC.dbListActivity, limit)
}

const obs = {
  getStatus: (): Promise<ObsStatus> => ipcRenderer.invoke(IPC.obsGetStatus),
  getSettings: (): Promise<ObsSettings> => ipcRenderer.invoke(IPC.obsGetSettings),
  saveSettings: (input: SaveObsSettingsInput): Promise<ObsSettings> => ipcRenderer.invoke(IPC.obsSaveSettings, input),
  onStatusChange: (callback: (status: ObsStatus) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, status: ObsStatus): void => callback(status)
    ipcRenderer.on(IPC.obsStatusChanged, listener)
    return () => ipcRenderer.removeListener(IPC.obsStatusChanged, listener)
  }
}

const api = {
  appVersion: process.env.npm_package_version ?? '0.1.0',
  db,
  obs
}

contextBridge.exposeInMainWorld('commandCenter', api)

export type CommandCenterApi = typeof api
