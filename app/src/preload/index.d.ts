import type { CommandCenterApi } from './index'

declare global {
  interface Window {
    commandCenter: CommandCenterApi
  }
}
