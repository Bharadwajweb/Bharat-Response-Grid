import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
    // The hosted preview does not provide a Vite HMR WebSocket endpoint.
    // Disable HMR so Vite does not inject @vite/client or open a dead socket.
    hmr: false,
  },
})
