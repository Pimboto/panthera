import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Tipos personalizados para el API expuesto
export interface ElectronAPI {
  ipcRenderer: {
    send: (channel: string, ...args: any[]) => void
    invoke: (channel: string, ...args: any[]) => Promise<any>
    on: (channel: string, callback: (...args: any[]) => void) => () => void
    once: (channel: string, callback: (...args: any[]) => void) => void
    removeAllListeners: (channel: string) => void
  }
  platform: NodeJS.Platform
  versions: NodeJS.ProcessVersions
}

// API personalizada para la aplicación iOS Automation
export interface AppAPI {
  // Sistema
  getSystemInfo: () => Promise<any>
  
  // Gestión de dispositivos iOS
  devices: {
    getConnectedDevices: () => Promise<any[]>
    connectDevice: (deviceId: string) => Promise<boolean>
    disconnectDevice: (deviceId: string) => Promise<boolean>
    getDeviceInfo: (deviceId: string) => Promise<any>
  }
  
  // Automatización
  automation: {
    startAutomation: (deviceId: string, script: string) => Promise<string>
    stopAutomation: (automationId: string) => Promise<boolean>
    getAutomationStatus: (automationId: string) => Promise<any>
    getAutomationLogs: (automationId: string) => Promise<string[]>
  }
  
  // Configuración
  config: {
    getSettings: () => Promise<any>
    updateSettings: (settings: any) => Promise<boolean>
    resetSettings: () => Promise<boolean>
  }
  
  // Logs del sistema
  logs: {
    getLogs: (level?: string, limit?: number) => Promise<string[]>
    clearLogs: () => Promise<boolean>
    exportLogs: (format: 'txt' | 'json') => Promise<string>
  }
  
  // Notificaciones
  notifications: {
    show: (title: string, body: string, type?: 'info' | 'success' | 'warning' | 'error') => void
  }
}

// Función helper para crear listeners seguros de IPC
function createSafeIpcRenderer() {
  return {
    send: (channel: string, ...args: any[]) => {
      // Lista blanca de canales permitidos para seguridad
      const allowedSendChannels = [
        'device:connect',
        'device:disconnect',
        'automation:start',
        'automation:stop',
        'config:update',
        'logs:export',
        'logs:clear'
      ]
      
      if (allowedSendChannels.includes(channel)) {
        ipcRenderer.send(channel, ...args)
      } else {
        console.warn(`Attempted to send message on unauthorized channel: ${channel}`)
      }
    },
    
    invoke: async (channel: string, ...args: any[]) => {
      // Lista blanca de canales permitidos para invoke
      const allowedInvokeChannels = [
        'ping',
        'system:info',
        'devices:list',
        'devices:info',
        'automation:status',
        'automation:logs',
        'config:get',
        'logs:get'
      ]
      
      if (allowedInvokeChannels.includes(channel)) {
        return await ipcRenderer.invoke(channel, ...args)
      } else {
        console.warn(`Attempted to invoke on unauthorized channel: ${channel}`)
        throw new Error(`Unauthorized channel: ${channel}`)
      }
    },
    
    on: (channel: string, callback: (...args: any[]) => void) => {
      // Lista blanca de canales para escuchar
      const allowedListenChannels = [
        'device:status-changed',
        'automation:progress',
        'automation:completed',
        'automation:error',
        'system:notification',
        'logs:new-entry'
      ]
      
      if (allowedListenChannels.includes(channel)) {
        const subscription = (_event: Electron.IpcRendererEvent, ...args: any[]) => {
          callback(...args)
        }
        ipcRenderer.on(channel, subscription)
        
        // Retornar función de cleanup
        return () => {
          ipcRenderer.removeListener(channel, subscription)
        }
      } else {
        console.warn(`Attempted to listen on unauthorized channel: ${channel}`)
        return () => {} // Función vacía como fallback
      }
    },
    
    once: (channel: string, callback: (...args: any[]) => void) => {
      const allowedListenChannels = [
        'device:status-changed',
        'automation:progress',
        'automation:completed',
        'automation:error',
        'system:notification',
        'logs:new-entry'
      ]
      
      if (allowedListenChannels.includes(channel)) {
        ipcRenderer.once(channel, (_event, ...args) => callback(...args))
      } else {
        console.warn(`Attempted to listen once on unauthorized channel: ${channel}`)
      }
    },
    
    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel)
    }
  }
}

// Crear API personalizada para la aplicación
const appAPI: AppAPI = {
  // Sistema
  getSystemInfo: () => ipcRenderer.invoke('system:info'),
  
  // Gestión de dispositivos iOS
  devices: {
    getConnectedDevices: () => ipcRenderer.invoke('devices:list'),
    connectDevice: (deviceId: string) => ipcRenderer.invoke('devices:connect', deviceId),
    disconnectDevice: (deviceId: string) => ipcRenderer.invoke('devices:disconnect', deviceId),
    getDeviceInfo: (deviceId: string) => ipcRenderer.invoke('devices:info', deviceId)
  },
  
  // Automatización
  automation: {
    startAutomation: (deviceId: string, script: string) => 
      ipcRenderer.invoke('automation:start', deviceId, script),
    stopAutomation: (automationId: string) => 
      ipcRenderer.invoke('automation:stop', automationId),
    getAutomationStatus: (automationId: string) => 
      ipcRenderer.invoke('automation:status', automationId),
    getAutomationLogs: (automationId: string) => 
      ipcRenderer.invoke('automation:logs', automationId)
  },
  
  // Configuración
  config: {
    getSettings: () => ipcRenderer.invoke('config:get'),
    updateSettings: (settings: any) => ipcRenderer.invoke('config:update', settings),
    resetSettings: () => ipcRenderer.invoke('config:reset')
  },
  
  // Logs del sistema
  logs: {
    getLogs: (level?: string, limit?: number) => 
      ipcRenderer.invoke('logs:get', level, limit),
    clearLogs: () => ipcRenderer.invoke('logs:clear'),
    exportLogs: (format: 'txt' | 'json') => 
      ipcRenderer.invoke('logs:export', format)
  },
  
  // Notificaciones
  notifications: {
    show: (title: string, body: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
      ipcRenderer.send('notifications:show', { title, body, type })
    }
  }
}

// Usar contextBridge para exponer APIs de forma segura
if (process.contextIsolated) {
  try {
    // Exponer la API estándar de Electron
    contextBridge.exposeInMainWorld('electron', {
      ...electronAPI,
      ipcRenderer: createSafeIpcRenderer(),
      platform: process.platform,
      versions: process.versions
    })
    
    // Exponer nuestra API personalizada
    contextBridge.exposeInMainWorld('appAPI', appAPI)
    
    console.log('✅ Preload script loaded successfully with context isolation')
  } catch (error) {
    console.error('❌ Failed to expose APIs through contextBridge:', error)
  }
} else {
  // Fallback si no hay aislamiento de contexto (no recomendado para producción)
  console.warn('⚠️ Context isolation is disabled - this is not recommended for security')
  ;(window as any).electron = {
    ...electronAPI,
    ipcRenderer: createSafeIpcRenderer(),
    platform: process.platform,
    versions: process.versions
  }
  ;(window as any).appAPI = appAPI
}

// Configuración de seguridad adicional
window.addEventListener('DOMContentLoaded', () => {
  // Deshabilitar drag and drop de archivos por seguridad
  document.addEventListener('dragover', (event) => {
    event.preventDefault()
    return false
  })
  
  document.addEventListener('drop', (event) => {
    event.preventDefault()
    return false
  })
  
  // Deshabilitar el menú contextual en producción
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
    document.addEventListener('contextmenu', (event) => {
      event.preventDefault()
      return false
    })
  }
  
  console.log('🛡️ Security measures applied to renderer process')
}) 
