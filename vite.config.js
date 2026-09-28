import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  base: '/NodeForge/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        app: resolve(import.meta.dirname, 'app.html')
      }
    }
  }
})
