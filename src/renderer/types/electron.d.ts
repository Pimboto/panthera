// Tipos globales para la aplicación Electron
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

// API específica de la aplicación iOS Automation
export interface AppAPI {
  // Sistema
  getSystemInfo: () => Promise<{
    platform: string
    arch: string
    version: string
    memory: number
    cpus: number
  }>
  
  // Gestión de dispositivos iOS
  devices: {
    getConnectedDevices: () => Promise<Device[]>
    connectDevice: (deviceId: string) => Promise<boolean>
    disconnectDevice: (deviceId: string) => Promise<boolean>
    getDeviceInfo: (deviceId: string) => Promise<Device>
  }
  
  // Automatización
  automation: {
    startAutomation: (deviceId: string, script: string) => Promise<string>
    stopAutomation: (automationId: string) => Promise<boolean>
    getAutomationStatus: (automationId: string) => Promise<AutomationStatus>
    getAutomationLogs: (automationId: string) => Promise<string[]>
  }
  
  // Configuración
  config: {
    getSettings: () => Promise<AppSettings>
    updateSettings: (settings: Partial<AppSettings>) => Promise<boolean>
    resetSettings: () => Promise<boolean>
  }
  
  // Logs del sistema
  logs: {
    getLogs: (level?: LogLevel, limit?: number) => Promise<LogEntry[]>
    clearLogs: () => Promise<boolean>
    exportLogs: (format: 'txt' | 'json') => Promise<string>
  }
  
  // Notificaciones
  notifications: {
    show: (title: string, body: string, type?: NotificationType) => void
  }
}

// Tipos de datos específicos de la aplicación
export interface Device {
  id: string
  name: string
  model: string
  ios: string
  battery: number
  status: 'connected' | 'disconnected' | 'busy'
  lastSeen: Date
}

export interface AutomationStatus {
  id: string
  deviceId: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  startTime: Date
  endTime?: Date
  error?: string
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  autoConnect: boolean
  notifications: boolean
  logLevel: LogLevel
  maxLogEntries: number
  deviceTimeout: number
  automationConcurrency: number
}

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: string
  component: string
  deviceId?: string
  automationId?: string
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type NotificationType = 'info' | 'success' | 'warning' | 'error'

// Extender la interfaz global de Window
declare global {
  interface Window {
    electron: ElectronAPI
    appAPI: AppAPI
  }
} 
