import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
