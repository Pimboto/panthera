#!/usr/bin/env node

const { spawn } = require('child_process')
const chalk = require('chalk')
const path = require('path')

console.log(chalk.blue.bold('🚀 iOS Automation Control Center - Development Mode'))
console.log(chalk.gray('Iniciando modo desarrollo optimizado...\n'))

// Limpiar terminal
console.clear()

// Banner
console.log(chalk.cyan(`
  ██╗ ██████╗ ███████╗     █████╗ ██╗   ██╗████████╗ ██████╗ 
  ██║██╔═══██╗██╔════╝    ██╔══██╗██║   ██║╚══██╔══╝██╔═══██╗
  ██║██║   ██║███████╗    ███████║██║   ██║   ██║   ██║   ██║
  ██║██║   ██║╚════██║    ██╔══██║██║   ██║   ██║   ██║   ██║
  ██║╚██████╔╝███████║    ██║  ██║╚██████╔╝   ██║   ╚██████╔╝
  ╚═╝ ╚═════╝ ╚══════╝    ╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝ 
`))

console.log(chalk.yellow('⚡ Modo desarrollo ultra-rápido activado'))
console.log(chalk.gray('Press Ctrl+C to stop\n'))

// Configurar variables de entorno
process.env.NODE_ENV = 'development'
process.env.ELECTRON_ENABLE_LOGGING = '1'

// Función para ejecutar comandos
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd(),
      ...options
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command failed with code ${code}`))
      }
    })

    child.on('error', reject)
  })
}

// Función principal
async function startDevelopment() {
  try {
    console.log(chalk.green('📦 Verificando dependencias...'))
    
    // Verificar si node_modules existe
    const fs = require('fs')
    if (!fs.existsSync('node_modules')) {
      console.log(chalk.yellow('Installing dependencies...'))
      await runCommand('npm', ['install'])
    }

    console.log(chalk.green('🔧 Limpiando builds anteriores...'))
    await runCommand('npm', ['run', 'clean'])

    console.log(chalk.green('🚀 Iniciando Electron en modo desarrollo...'))
    await runCommand('npm', ['run', 'dev:fast'])

  } catch (error) {
    console.error(chalk.red('❌ Error durante el desarrollo:'), error.message)
    process.exit(1)
  }
}

// Manejar señales de salida
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n👋 Cerrando modo desarrollo...'))
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log(chalk.yellow('\n👋 Cerrando modo desarrollo...'))
  process.exit(0)
})

// Ejecutar
startDevelopment() 
