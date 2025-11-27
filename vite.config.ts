import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const API_BASE_V2 = 'https://testnet.myweb3pass.xyz/api-v2/';
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001', changeOrigin: true, secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/api-v2': {
          target: API_BASE_V2, secure: true, changeOrigin: true,
          // target: 'http://127.0.0.1:3001/', secure: false, changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-v2/, ''),
      },
    },
  },
})
