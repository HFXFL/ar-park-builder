import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'three', '@react-three/fiber'],
  },
  server: {
    host: true,
    https: false,
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
})
