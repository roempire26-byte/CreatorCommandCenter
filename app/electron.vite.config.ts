import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

const sharedAliases = {
  '@shared': resolve('src/shared'),
  '@database': resolve('../database'),
  '@backend': resolve('../backend'),
  '@automation': resolve('../automation')
}

export default defineConfig({
  main: {
    resolve: {
      alias: sharedAliases
    },
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    resolve: {
      alias: {
        '@shared': sharedAliases['@shared']
      }
    },
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': sharedAliases['@shared']
      }
    },
    plugins: [react()]
  }
})
