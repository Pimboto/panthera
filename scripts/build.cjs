#!/usr/bin/env node

const { spawn, exec } = require('child_process')
const chalk = require('chalk')
const fs = require('fs')
const path = require('path')

console.log(chalk.blue.bold('🏗️  iOS Automation Control Center - Build Production'))
console.log(chalk.gray('Construyendo aplicación optimizada...\n'))

// Limpiar terminal
console.clear()

// Banner
console.log(chalk.cyan(`
  ██████╗ ██╗   ██╗██╗██╗     ██████╗ 
  ██╔══██╗██║   ██║██║██║     ██╔══██╗
  ██████╔╝██║   ██║██║██║     ██║  ██║
  ██╔══██╗██║   ██║██║██║     ██║  ██║
  ██████╔╝╚██████╔╝██║███████╗██████╔╝
  ╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═════╝ 
`))

console.log(chalk.yellow('⚡ Modo build optimizado activado'))
console.log(chalk.gray('Building for production...\n'))

// Configurar variables de entorno
process.env.NODE_ENV = 'production'

// Función para ejecutar comandos
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(chalk.blue(`Ejecutando: ${command} ${args.join(' ')}`))
    
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

// Función para obtener información del sistema
function getSystemInfo() {
  const os = require('os')
  return {
    platform: process.platform,
    arch: process.arch,
    memory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB',
    cpus: os.cpus().length
  }
}

// Función para mostrar el tamaño de archivos
function getDirectorySize(dirPath) {
  if (!fs.existsSync(dirPath)) return '0 MB'
  
  let totalSize = 0
  const files = fs.readdirSync(dirPath, { recursive: true })
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file)
    try {
      const stats = fs.statSync(filePath)
      if (stats.isFile()) {
        totalSize += stats.size
      }
    } catch (e) {
      // Ignorar errores
    }
  })
  
  return (totalSize / (1024 * 1024)).toFixed(2) + ' MB'
}

// Función principal
async function buildProduction() {
  const startTime = Date.now()
  
  try {
    const sysInfo = getSystemInfo()
    console.log(chalk.green('🖥️  Información del sistema:'))
    console.log(chalk.gray(`   Platform: ${sysInfo.platform}`))
    console.log(chalk.gray(`   Architecture: ${sysInfo.arch}`))
    console.log(chalk.gray(`   Memory: ${sysInfo.memory}`))
    console.log(chalk.gray(`   CPUs: ${sysInfo.cpus}\n`))

    console.log(chalk.green('🧹 Limpiando builds anteriores...'))
    await runCommand('npm', ['run', 'clean'])

    console.log(chalk.green('📦 Verificando dependencias...'))
    if (!fs.existsSync('node_modules')) {
      console.log(chalk.yellow('📥 Instalando dependencias...'))
      await runCommand('npm', ['ci', '--silent'])
    }

    console.log(chalk.green('🔍 Verificando tipos TypeScript...'))
    await runCommand('npm', ['run', 'type-check'])

    console.log(chalk.green('✨ Ejecutando linter...'))
    await runCommand('npm', ['run', 'lint:check'])

    console.log(chalk.green('⚡ Construyendo aplicación...'))
    await runCommand('npm', ['run', 'build:fast'])

    // Mostrar información del build
    console.log(chalk.green('\n📊 Estadísticas del build:'))
    if (fs.existsSync('out')) {
      console.log(chalk.gray(`   Output size: ${getDirectorySize('out')}`))
    }

    const buildTime = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(chalk.gray(`   Build time: ${buildTime}s\n`))

    // Preguntar si quiere empaquetar
    if (process.argv.includes('--package')) {
      console.log(chalk.green('📦 Empaquetando aplicación...'))
      
      const platform = process.argv.find(arg => ['--win', '--mac', '--linux', '--all'].includes(arg))
      
      switch (platform) {
        case '--win':
          await runCommand('npm', ['run', 'build:win'])
          break
        case '--mac':
          await runCommand('npm', ['run', 'build:mac'])
          break
        case '--linux':
          await runCommand('npm', ['run', 'build:linux'])
          break
        case '--all':
          await runCommand('npm', ['run', 'dist:all'])
          break
        default:
          await runCommand('npm', ['run', 'dist'])
      }

      if (fs.existsSync('dist')) {
        console.log(chalk.gray(`   Package size: ${getDirectorySize('dist')}`))
      }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(chalk.green.bold(`\n✅ Build completado exitosamente en ${totalTime}s!`))
    
    if (!process.argv.includes('--package')) {
      console.log(chalk.yellow('\n💡 Para empaquetar, ejecuta:'))
      console.log(chalk.gray('   npm run build -- --package [--win|--mac|--linux|--all]'))
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Error durante el build:'), error.message)
    process.exit(1)
  }
}

// Manejar señales de salida
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n👋 Build cancelado...'))
  process.exit(0)
})

// Ejecutar
buildProduction() 
