import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Development server configuration
  server: {
    port: 5173,
    host: true, // Needed for Docker/remote access
    open: true  // Auto-open browser
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: false,  // Disable source maps for production
    minify: 'terser',  // Better minification
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code for better caching
          'react-vendor': ['react', 'react-dom'],
          'charts': ['recharts'],
          'icons': ['lucide-react']
        }
      }
    }
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // Preview server (for testing build)
  preview: {
    port: 4173,
    host: true
  }
})