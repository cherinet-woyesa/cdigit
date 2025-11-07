import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@components/dashboard': resolve(__dirname, 'src/components/dashboard'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@services': resolve(__dirname, 'src/services'),
      '@context': resolve(__dirname, 'src/context'),
      '@features': resolve(__dirname, 'src/features'),
      '@features/maker/pages': resolve(__dirname, 'src/features/maker/pages'),
      '@features/maker/components': resolve(__dirname, 'src/features/maker/components'),
      '@features/maker/types': resolve(__dirname, 'src/features/maker/types'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@types': resolve(__dirname, 'src/types'),
      '@config': resolve(__dirname, 'src/config'),
      '@constants': resolve(__dirname, 'src/constants'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@lib': resolve(__dirname, 'src/lib'),
      '@assets': resolve(__dirname, 'src/assets'),
    },
  },
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