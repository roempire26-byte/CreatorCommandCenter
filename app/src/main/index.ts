import { app, session, shell, BrowserWindow } from 'electron'
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

// sql.js loads the whole SQLite file into memory per process and saveDatabase() overwrites it
// wholesale on every write, with no locking or merge — two instances open at once will silently
// clobber each other's work (confirmed: a second instance's single unrelated save erased an
// entire prior session's VOD/clip rows, even though every step there saved progressively).
// requestSingleInstanceLock() is the standard Electron guard against that: a second launch
// attempt quits immediately instead of opening a second in-memory copy of the database.
const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(async () => {
    // Deny every permission request by default — the app requests none of these today
    // (no camera/mic/notifications/geolocation/etc.), so this only guards against an
    // unexpected future request (e.g. from an embedded AI provider SDK) silently falling
    // through to Electron's default behavior instead of being explicitly refused.
    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
      callback(false)
    })

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
}
