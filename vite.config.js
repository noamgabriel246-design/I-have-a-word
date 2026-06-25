import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// תצורת Vite — כלי הבנייה והפיתוח של הפרויקט.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
})
