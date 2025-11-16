import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/soccerstats/',
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: [
      '91bcf9912718.ngrok-free.app'
    ]
  }
})
