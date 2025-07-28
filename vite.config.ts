import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5268', // Change to your backend's URL/port if different
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
