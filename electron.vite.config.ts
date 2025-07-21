import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Configuración para el proceso principal
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@main': resolve('src/main')
      }
    },
    build: {
      outDir: 'out/main',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts')
        },
        output: {
          format: 'cjs'
        }
      },
      // Optimizaciones para el proceso principal
      minify: 'esbuild',
      sourcemap: false, // Desactivar sourcemaps en producción
      target: 'node18'
    }
  },

  // Configuración para los scripts de preload
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@preload': resolve('src/preload')
      }
    },
    build: {
      outDir: 'out/preload',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.ts')
        },
        output: {
          format: 'cjs'
        }
      },
      // Optimizaciones para preload
      minify: 'esbuild',
      sourcemap: false,
      target: 'node18'
    }
  },

  // Configuración para el proceso renderer (React)
  renderer: {
    root: 'src/renderer',
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer'),
        '@components': resolve('src/renderer/components'),
        '@hooks': resolve('src/renderer/hooks'),
        '@assets': resolve('src/renderer/assets'),
        '@': resolve('src/renderer')
      }
    },
    plugins: [
      react({
        // Optimizaciones de React
        babel: {
          plugins: [
            // Eliminación de propTypes en producción
            ['babel-plugin-transform-remove-console', { exclude: ['error', 'warn'] }]
          ]
        }
      })
    ],
    build: {
      outDir: 'out/renderer',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/index.html')
        },
        output: {
          // Code splitting agresivo para carga más rápida
          manualChunks: {
            vendor: ['react', 'react-dom'],
            icons: ['lucide-react']
          }
        }
      },
      // Optimizaciones máximas para renderer
      target: 'chrome120', // Electron usa Chromium moderno
      minify: 'esbuild', // esbuild es el más rápido
      sourcemap: false, // Sin sourcemaps en producción
      reportCompressedSize: false, // Ahorrar tiempo de build
      
      // Configuración avanzada de chunks
      chunkSizeWarningLimit: 1000,
      
      // Optimizar imágenes y assets
      assetsInlineLimit: 4096
    },
    
    // Configuración del servidor de desarrollo SÚPER rápido
    server: {
      host: '127.0.0.1',
      port: 7777,
      strictPort: true,
      hmr: {
        port: 7778
      },
      // Configuración para desarrollo ultra rápido
      watch: {
        usePolling: false,
        useFsEvents: true
      }
    },
    
    // Variables de entorno optimizadas
    define: {
      __ELECTRON__: true,
      __DEV__: process.env.NODE_ENV === 'development',
      // Eliminar código de desarrollo en producción
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
    },
    
    // Optimización agresiva de dependencias
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'lucide-react'
      ],
      exclude: [
        'electron'
      ],
      // Configuración para dependencias más rápidas
      force: true,
      esbuildOptions: {
        target: 'chrome120'
      }
    },
    
    // Configuración CSS optimizada
    css: {
      postcss: './postcss.config.js',
      devSourcemap: false, // Más rápido en desarrollo
      modules: {
        localsConvention: 'camelCase'
      }
    },

    // Configuración de ESBuild para máximo rendimiento
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
      legalComments: 'none',
      treeShaking: true
    }
  }
}) 
