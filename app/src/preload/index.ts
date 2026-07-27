import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type {
  ActivityLogEntry,
  AutomationRun,
  ChecklistItem,
  ClaudeSettings,
  ClipCandidate,
  ConnectTwitchInput,
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
  OpenAiSettings,
  SaveObsSettingsInput,
  StartSessionInput,
  StreamSession,
  TwitchSettings,
  Vod
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
  listAutomationRuns: (): Promise<AutomationRun[]> => ipcRenderer.invoke(IPC.dbListAutomationRuns),
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

const automation = {
  runContentReviewCheck: (): Promise<AutomationRun> => ipcRenderer.invoke(IPC.automationRunContentReviewCheck)
}

const twitch = {
  getSettings: (): Promise<TwitchSettings> => ipcRenderer.invoke(IPC.twitchGetSettings),
  connect: (input: ConnectTwitchInput): Promise<TwitchSettings> => ipcRenderer.invoke(IPC.twitchConnect, input),
  disconnect: (): Promise<TwitchSettings> => ipcRenderer.invoke(IPC.twitchDisconnect)
}

const vod = {
  selectFile: (): Promise<Vod | null> => ipcRenderer.invoke(IPC.vodSelectFile),
  list: (): Promise<Vod[]> => ipcRenderer.invoke(IPC.vodList),
  extractAudio: (id: string): Promise<Vod> => ipcRenderer.invoke(IPC.vodExtractAudio, { id }),
  transcribe: (id: string): Promise<Vod> => ipcRenderer.invoke(IPC.vodTranscribe, { id }),
  analyze: (id: string): Promise<Vod> => ipcRenderer.invoke(IPC.vodAnalyze, { id })
}

const clip = {
  listForVod: (vodId: string): Promise<ClipCandidate[]> => ipcRenderer.invoke(IPC.clipListForVod, { vodId }),
  updateStatus: (id: string, status: 'approved' | 'rejected'): Promise<ClipCandidate> =>
    ipcRenderer.invoke(IPC.clipUpdateStatus, { id, status })
}

const claude = {
  getSettings: (): Promise<ClaudeSettings> => ipcRenderer.invoke(IPC.claudeGetSettings),
  saveKey: (apiKey: string): Promise<ClaudeSettings> => ipcRenderer.invoke(IPC.claudeSaveKey, { apiKey }),
  clearKey: (): Promise<ClaudeSettings> => ipcRenderer.invoke(IPC.claudeClearKey)
}

const openai = {
  getSettings: (): Promise<OpenAiSettings> => ipcRenderer.invoke(IPC.openaiGetSettings),
  saveKey: (apiKey: string): Promise<OpenAiSettings> => ipcRenderer.invoke(IPC.openaiSaveKey, { apiKey }),
  clearKey: (): Promise<OpenAiSettings> => ipcRenderer.invoke(IPC.openaiClearKey)
}

const api = {
  appVersion: process.env.npm_package_version ?? '0.1.0',
  db,
  obs,
  automation,
  twitch,
  vod,
  clip,
  claude,
  openai
}

contextBridge.exposeInMainWorld('commandCenter', api)

export type CommandCenterApi = typeof api
