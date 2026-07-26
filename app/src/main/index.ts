import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from './is'
import { openDatabase, type DbHandle } from '@database/db'
import { ObsAdapter } from '@backend/obs/adapter'
import { logActivity } from '@backend/activity-log'
import { getObsConnectionSettings } from './obs-settings'
import { registerIpcHandlers } from './ipc'
import { IPC } from '@shared/ipc-channels'

let mainWindow: BrowserWindow | null = null
let obsAdapter: ObsAdapter | null = null

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 800,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#080A0F',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  window.on('ready-to-show', () => {
    window.show()
  })

  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}

async function bootstrap(dbHandle: DbHandle): Promise<void> {
  const userDataDir = app.getPath('userData')

  obsAdapter = new ObsAdapter({
    getSettings: () => getObsConnectionSettings(userDataDir),
    onStatusChange: (status) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(IPC.obsStatusChanged, status)
      }
    },
    logTransition: (from, to, detail) => {
      const logStatus = to === 'connected' ? 'success' : to === 'auth-required' ? 'warning' : to === 'errored' ? 'danger' : 'neutral'
      logActivity(dbHandle, { category: 'obs', action: `status-changed:${from}->${to}`, status: logStatus, detail })
    }
  })
  obsAdapter.start()

  registerIpcHandlers({ dbHandle, obsAdapter, userDataDir })

  mainWindow = createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow()
  })
}

app.whenReady().then(async () => {
  const dbHandle = await openDatabase(app.getPath('userData'))
  await bootstrap(dbHandle)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  obsAdapter?.stop()
})
