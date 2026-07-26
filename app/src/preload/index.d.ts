export interface CommandCenterApi {
  appVersion: string
}

declare global {
  interface Window {
    commandCenter: CommandCenterApi
  }
}
