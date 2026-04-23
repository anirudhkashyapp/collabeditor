import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; connect-src 'self' wss://collabeditor-production-e9f4.up.railway.app https://collabeditor-production-e9f4.up.railway.app https://api.groq.com; img-src 'self' data:; font-src 'self' data:"
    }
  }
})