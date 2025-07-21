/// <reference types="vite/client" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Configuración Vite específica para desarrollo súper rápido
export default defineConfig({
  plugins: [
    react({
      // Configuración React optimizada
      fastRefresh: true,
      babel: {
        plugins: process.env.NODE_ENV === 'production' 
          ? [['babel-plugin-transform-remove-console', { exclude: ['error', 'warn'] }]]
          : []
      }
    })
  ],
  
  // Resolución de aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, './src/renderer'),
      '@components': resolve(__dirname, './src/renderer/components'),
      '@hooks': resolve(__dirname, './src/renderer/hooks'),
      '@assets': resolve(__dirname, './src/renderer/assets')
    }
  },
  
  // Configuración del servidor de desarrollo
  server: {
    port: 3000,
    host: true,
    hmr: {
      port: 3001
    },
    watch: {
      usePolling: false,
      useFsEvents: true
    }
  },
  
  // Build optimizado
  build: {
    target: 'chrome120',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          icons: ['lucide-react']
        }
      }
    }
  },
  
  // Optimización de dependencias
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
    esbuildOptions: {
      target: 'chrome120'
    }
  },
  
  // Variables de entorno
  define: {
    __DEV__: process.env.NODE_ENV === 'development'
  },
  
  // CSS
  css: {
    devSourcemap: false
  }
})
