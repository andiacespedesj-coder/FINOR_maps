import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

const androidBuild = readFileSync(new URL('./android/app/build.gradle', import.meta.url), 'utf8')
const androidVersion = androidBuild.match(/\bversionName\s+["']([^"']+)["']/)?.[1]
if (!androidVersion) throw new Error('No se encontró versionName en android/app/build.gradle')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: { __ANDROID_VERSION__: JSON.stringify(androidVersion) },
  optimizeDeps: {
    entries: ['index.html'],
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        // En el navegador de desarrollo consultamos la API del VPS.
        target: 'https://162.35.162.131',
        changeOrigin: true,
      },
    },
    watch: {
      ignored: ['**/android/**']
    }
  }
})
