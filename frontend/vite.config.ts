import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In development, requests to /api go to the Spring Boot backend on port 8080.
    // The browser only ever talks to localhost:5173, so no CORS setup is needed while developing.
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})