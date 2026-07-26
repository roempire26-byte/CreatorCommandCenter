import { contextBridge } from 'electron'

const api = {
  appVersion: process.env.npm_package_version ?? '0.1.0'
}

contextBridge.exposeInMainWorld('commandCenter', api)
