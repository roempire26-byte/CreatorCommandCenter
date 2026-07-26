import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type {
  ActivityLogEntry,
  ChecklistItem,
  ContentItem,
  CreateChecklistItemInput,
  CreateContentItemInput,
  CreateGoalInput,
  CreateMetricSnapshotInput,
  CreateSessionInput,
  Goal,
  MetricSnapshot,
  ObsSettings,
  ObsStatus,
  SaveObsSettingsInput,
  StartSessionInput,
  StreamSession
} from '@shared/schemas'

const db = {
  listSessions: (): Promise<StreamSession[]> => ipcRenderer.invoke(IPC.dbListSessions),
  createSession: (input: CreateSessionInput): Promise<StreamSession> => ipcRenderer.invoke(IPC.dbCreateSession, input),
  startSession: (input: StartSessionInput): Promise<StreamSession> => ipcRenderer.invoke(IPC.dbStartSession, input),
  endSession: (id: string): Promise<StreamSession> => ipcRenderer.invoke(IPC.dbEndSession, { id }),
  listGoals: (): Promise<Goal[]> => ipcRenderer.invoke(IPC.dbListGoals),
  createGoal: (input: CreateGoalInput): Promise<Goal> => ipcRenderer.invoke(IPC.dbCreateGoal, input),
  listContentItems: (): Promise<ContentItem[]> => ipcRenderer.invoke(IPC.dbListContentItems),
  createContentItem: (input: CreateContentItemInput): Promise<ContentItem> => ipcRenderer.invoke(IPC.dbCreateContentItem, input),
  updateContentItemStatus: (id: string, status: ContentItem['status']): Promise<ContentItem> =>
    ipcRenderer.invoke(IPC.dbUpdateContentItemStatus, { id, status }),
  listChecklistItems: (): Promise<ChecklistItem[]> => ipcRenderer.invoke(IPC.dbListChecklistItems),
  createChecklistItem: (input: CreateChecklistItemInput): Promise<ChecklistItem> =>
    ipcRenderer.invoke(IPC.dbCreateChecklistItem, input),
  deleteChecklistItem: (id: string): Promise<void> => ipcRenderer.invoke(IPC.dbDeleteChecklistItem, { id }),
  createMetricSnapshot: (input: CreateMetricSnapshotInput): Promise<MetricSnapshot> =>
    ipcRenderer.invoke(IPC.dbCreateMetricSnapshot, input),
  listMetricSnapshotsForSession: (sessionId: string): Promise<MetricSnapshot[]> =>
    ipcRenderer.invoke(IPC.dbListMetricSnapshotsForSession, { sessionId }),
  listMetricSnapshots: (): Promise<MetricSnapshot[]> => ipcRenderer.invoke(IPC.dbListMetricSnapshots),
  listActivity: (limit?: number): Promise<ActivityLogEntry[]> => ipcRenderer.invoke(IPC.dbListActivity, limit)
}

const obs = {
  getStatus: (): Promise<ObsStatus> => ipcRenderer.invoke(IPC.obsGetStatus),
  getSettings: (): Promise<ObsSettings> => ipcRenderer.invoke(IPC.obsGetSettings),
  saveSettings: (input: SaveObsSettingsInput): Promise<ObsSettings> => ipcRenderer.invoke(IPC.obsSaveSettings, input),
  startStream: (): Promise<void> => ipcRenderer.invoke(IPC.obsStartStream),
  stopStream: (): Promise<void> => ipcRenderer.invoke(IPC.obsStopStream),
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
