import { defineConfig } from 'vite'

export default defineConfig({
  // Base URL for deployment
  base: process.env.VITE_BASE_PATH || "/Valentine_React",

  // Build options
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  },

  // Dev server options
  server: {
    port: 3000,
    open: true
  },

  // Preview server options
  preview: {
    port: 4173
  }
})
