import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { createSplashWindow, closeSplashWindow } from './splash'

// Optimizaciones de startup
if (process.platform === 'linux' && !process.env.CI) {
  app.disableHardwareAcceleration()
}

// Configurar flags de Chromium para mejor rendimiento
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder')
app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor')
app.commandLine.appendSwitch('enable-accelerated-2d-canvas')
app.commandLine.appendSwitch('enable-gpu-rasterization')
app.commandLine.appendSwitch('enable-zero-copy')

// Usar el icono apropiado para cada plataforma
const getAppIcon = () => {
  // En desarrollo, las rutas son diferentes
  const isDev = is.dev
  const basePath = isDev ? process.cwd() : join(__dirname, '../..')
  
  if (process.platform === 'darwin') {
    return join(basePath, 'build/icon.icns')
  } else if (process.platform === 'win32') {
    return join(basePath, 'build/icon.ico')
  } else {
    return join(basePath, 'build/icon.png')
  }
}

// Configuración de seguridad CSP para producción
const CSP_POLICY = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"

function createWindow(): void {
  // Crear splash screen primero para perceived performance
  const splash = createSplashWindow()
  
  // Crear la ventana principal del navegador con configuración optimizada
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false, // No mostrar hasta estar listo
    autoHideMenuBar: true,
    titleBarStyle: 'hidden', // Para un look más nativo en macOS
    trafficLightPosition: { x: 20, y: 20 }, // Posición de los botones de control en macOS
    icon: getAppIcon(),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false, // Necesario para @electron-toolkit/preload
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      // Optimizaciones de rendimiento
      backgroundThrottling: false,
      offscreen: false,
      spellcheck: false // Desactivar spellcheck para mejor rendimiento
    }
  })

  // Configuración de CSP para producción
  if (!is.dev) {
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [CSP_POLICY]
        }
      })
    })
  }

  // Optimizaciones de renderizado
  mainWindow.webContents.on('did-finish-load', () => {
    // Habilitar optimizaciones de CSS y renderizado
    mainWindow.webContents.insertCSS(`
      * {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      body {
        font-display: swap;
      }
    `)
  })

  // Mostrar ventana cuando esté lista para prevenir flash visual
  mainWindow.on('ready-to-show', () => {
    // Mantener splash visible por un momento para que se vea
    setTimeout(() => {
      // Cerrar splash screen
      closeSplashWindow()
      
      // Mostrar ventana principal
      mainWindow.show()
      
      // Abrir DevTools solo en desarrollo
      if (is.dev) {
        mainWindow.webContents.openDevTools()
      }
    }, 800) // 800ms para que el splash sea visible
  })

  // Manejar aperturas de ventana - solo permitir dominios seguros
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Cargar la aplicación
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Configurar eventos de ventana para mejor UX
  mainWindow.on('closed', () => {
    // Dereference the window object
  })
}

// Este método será llamado cuando Electron haya terminado la inicialización
// y esté listo para crear ventanas del navegador.
// Algunas APIs pueden usarse solo después de que este evento ocurra.
app.whenReady().then(() => {
  // Configuración por defecto para todos los procesos de Electron
  electronApp.setAppUserModelId('com.tinder.ios-automation')

  // Configuración de seguridad para desarrollo
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC Handlers optimizados con async/await
  ipcMain.handle('ping', async () => 'pong')
  
  ipcMain.handle('system:info', async () => {
    const os = require('os')
    return {
      platform: process.platform,
      arch: process.arch,
      version: process.version,
      memory: Math.round(os.totalmem() / 1024 / 1024 / 1024), // GB
      cpus: os.cpus().length
    }
  })

  // IPC Handlers - Dispositivos (mockups para ahora)
  ipcMain.handle('devices:list', async () => {
    // Mock data - reemplazar con lógica real
    return [
      {
        id: 'iphone-12-pro',
        name: 'iPhone 12 Pro',
        model: 'A2341',
        ios: '17.2.1',
        battery: 89,
        status: 'connected',
        lastSeen: new Date()
      }
    ]
  })

  ipcMain.handle('devices:connect', async (_, deviceId: string) => {
    console.log('Connecting to device:', deviceId)
    return true
  })

  ipcMain.handle('devices:disconnect', async (_, deviceId: string) => {
    console.log('Disconnecting from device:', deviceId)
    return true
  })

  ipcMain.handle('devices:info', async (_, deviceId: string) => {
    console.log('Getting device info:', deviceId)
    return {
      id: deviceId,
      name: 'iPhone Device',
      model: 'A2341',
      ios: '17.2.1',
      battery: 85,
      status: 'connected',
      lastSeen: new Date()
    }
  })

  // IPC Handlers - Automatización (mockups)
  ipcMain.handle('automation:start', async (_, deviceId: string, script: string) => {
    console.log('Starting automation on device:', deviceId, 'with script:', script)
    return 'automation-' + Date.now()
  })

  ipcMain.handle('automation:stop', async (_, automationId: string) => {
    console.log('Stopping automation:', automationId)
    return true
  })

  ipcMain.handle('automation:status', async (_, automationId: string) => {
    console.log('Getting automation status:', automationId)
    return {
      id: automationId,
      deviceId: 'device-1',
      status: 'running',
      progress: 50,
      startTime: new Date(),
      endTime: null,
      error: null
    }
  })

  ipcMain.handle('automation:logs', async (_, automationId: string) => {
    console.log('Getting automation logs:', automationId)
    return ['Log entry 1', 'Log entry 2', 'Log entry 3']
  })

  // IPC Handlers - Configuración (mockups)
  ipcMain.handle('config:get', async () => {
    return {
      theme: 'light',
      autoConnect: true,
      notifications: true,
      logLevel: 'info',
      maxLogEntries: 1000,
      deviceTimeout: 30,
      automationConcurrency: 3
    }
  })

  ipcMain.handle('config:update', async (_, settings: any) => {
    console.log('Updating settings:', settings)
    return true
  })

  ipcMain.handle('config:reset', async () => {
    console.log('Resetting settings to defaults')
    return true
  })

  // IPC Handlers - Logs (mockups)
  ipcMain.handle('logs:get', async (_, level?: string, limit?: number) => {
    console.log('Getting logs with level:', level, 'limit:', limit)
    return [
      {
        timestamp: new Date(),
        level: 'info',
        message: 'Application started',
        component: 'main'
      },
      {
        timestamp: new Date(),
        level: 'debug',
        message: 'Device connected',
        component: 'device-manager'
      }
    ]
  })

  ipcMain.handle('logs:clear', async () => {
    console.log('Clearing logs')
    return true
  })

  ipcMain.handle('logs:export', async (_, format: 'txt' | 'json') => {
    console.log('Exporting logs in format:', format)
    return 'logs-export-' + Date.now() + '.' + format
  })

  // IPC Handlers - Notificaciones
  ipcMain.on('notifications:show', (_, notification) => {
    console.log('Showing notification:', notification)
    // Aquí puedes usar Electron's Notification API si lo deseas
  })

  createWindow()

  app.on('activate', function () {
    // En macOS es común recrear una ventana en la app cuando el
    // icono del dock es clickeado y no hay otras ventanas abiertas.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Salir cuando todas las ventanas están cerradas, excepto en macOS. 
// En macOS es común que las aplicaciones y su barra de menú 
// permanezcan activas hasta que el usuario salga explícitamente con Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Prevenir la navegación a URLs externas por seguridad
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (navigationEvent, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)

    // Permitir solo navegación local en desarrollo
    if (is.dev && parsedUrl.origin === process.env['ELECTRON_RENDERER_URL']) {
      return
    }

    // Bloquear navegación externa
    navigationEvent.preventDefault()
  })
})

// Configuración para auto-updater (preparación futura)
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('electron-fiddle', process.execPath, [
      join(__dirname, '..')
    ])
  }
} else {
  app.setAsDefaultProtocolClient('electron-fiddle')
}

// En este archivo puedes incluir el resto del código específico del proceso principal de tu aplicación. 
// También puedes ponerlos en archivos separados y requerirlos aquí. 
