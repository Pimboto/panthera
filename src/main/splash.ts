import { BrowserWindow } from "electron"
import { join } from "path"
import { is } from "@electron-toolkit/utils"

let splashWindow: BrowserWindow | null = null

export function createSplashWindow(): BrowserWindow {
  // Crear ventana de splash
  splashWindow = new BrowserWindow({
    width: 500,
    height: 400,
    frame: false, // Sin bordes para look moderno
    alwaysOnTop: true, // Siempre visible
    transparent: true, // Fondo transparente
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  })

  // Cargar contenido del splash
  if (is.dev) {
    // En desarrollo, crear HTML inline con splash simple de llama
    splashWindow.loadURL(
      "data:text/html;charset=utf-8," +
        encodeURIComponent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>iOS Automation - Loading</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: radial-gradient(ellipse at center, rgba(20, 20, 30, 0.95) 0%, rgba(10, 10, 20, 0.98) 100%);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              color: white;
              overflow: hidden;
              position: relative;
            }

            /* Fire Particles alrededor de la llama */
            .fire-particles-container {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 150px;
              height: 150px;
              z-index: 5;
            }

            .fire-particle {
              position: absolute;
              border-radius: 50%;
              pointer-events: none;
              animation: fireParticleFloat 2.5s ease-out infinite;
            }

            @keyframes fireParticleFloat {
              0% {
                transform: translate(-50%, -50%) translateY(10px) scale(0);
                opacity: 0;
              }
              20% {
                opacity: 1;
                transform: translate(-50%, -50%) translateY(0px) scale(1);
              }
              80% {
                opacity: 0.7;
                transform: translate(-50%, -50%) translateY(-60px) scale(0.3);
              }
              100% {
                transform: translate(-50%, -50%) translateY(-80px) scale(0);
                opacity: 0;
              }
            }

            /* Flame Container */
            .flame-container {
              position: relative;
              margin-bottom: 30px;
              z-index: 10;
              animation: flameFloat 3s ease-in-out infinite;
            }

            @keyframes flameFloat {
              0%, 100% { transform: scale(1) rotate(0deg); }
              50% { transform: scale(1.05) rotate(1deg); }
            }

            /* Simple Flame Glow */
            .flame-glow {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 100px;
              height: 100px;
              border-radius: 50%;
              background: radial-gradient(circle, rgba(255, 165, 0, 0.3) 0%, rgba(255, 69, 0, 0.15) 50%, transparent 70%);
              animation: flameGlow 2s ease-in-out infinite;
              z-index: 1;
            }

            @keyframes flameGlow {
              0%, 100% { 
                transform: translate(-50%, -50%) scale(1);
                opacity: 0.7;
              }
              50% { 
                transform: translate(-50%, -50%) scale(1.2);
                opacity: 1;
              }
            }

            /* Main Flame Icon */
            .flame-icon {
              position: relative;
              z-index: 15;
              width: 80px;
              height: 80px;
              filter: drop-shadow(0 0 15px rgba(255, 165, 0, 0.6));
            }

            /* Text */
            .title {
              font-size: 32px;
              font-weight: 700;
              margin-bottom: 10px;
              background: linear-gradient(45deg, #ff6b35, #f7931e);
              background-size: 200% 200%;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              animation: gradientShift 3s ease-in-out infinite;
              z-index: 25;
              position: relative;
            }

            @keyframes gradientShift {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }

            .subtitle {
              font-size: 18px;
              margin-bottom: 35px;
              color: rgba(255, 200, 150, 0.9);
              z-index: 25;
              position: relative;
            }


          </style>
        </head>
        <body>
          <!-- Fire Particles Container -->
          <div class="fire-particles-container" id="fireParticlesContainer"></div>

          <!-- Main Content -->
          <div class="flame-container">
            <!-- Flame Glow -->
            <div class="flame-glow"></div>
            
            <!-- Main Flame -->
            <svg class="flame-icon" viewBox="0 0 24 24" fill="none" stroke="#ff6b35" stroke-width="2">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
            </svg>
          </div>

          <!-- Text Content -->
          <h1 class="title">iOS Automation</h1>
          <p class="subtitle">Control Center</p>

          <script>
            // Crear fire particles simples
            function createFireParticles() {
              const container = document.getElementById('fireParticlesContainer');
              for (let i = 0; i < 8; i++) {
                const particle = document.createElement('div');
                particle.className = 'fire-particle';
                
                const size = Math.random() * 6 + 3;
                const colors = ['rgba(255, 165, 0, 0.8)', 'rgba(255, 69, 0, 0.7)', 'rgba(255, 215, 0, 0.6)'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                particle.style.width = size + 'px';
                particle.style.height = size + 'px';
                particle.style.background = \`radial-gradient(circle, \${color}, transparent)\`;
                
                // Posicionar alrededor del fuego
                const angle = (i / 8) * 2 * Math.PI + Math.random() * 0.3;
                const distance = Math.random() * 40 + 25;
                const x = Math.cos(angle) * distance + 75;
                const y = Math.sin(angle) * distance + 75;
                
                particle.style.left = x + 'px';
                particle.style.top = y + 'px';
                particle.style.animationDelay = Math.random() * 2 + 's';
                particle.style.animationDuration = (Math.random() * 1 + 2) + 's';
                
                container.appendChild(particle);
              }
            }

            // Recrear partículas cada 5 segundos
            function refreshParticles() {
              document.getElementById('fireParticlesContainer').innerHTML = '';
              createFireParticles();
              setTimeout(refreshParticles, 5000);
            }

            // Initialize
            createFireParticles();
            setTimeout(refreshParticles, 5000);
          </script>
        </body>
      </html>
    `),
    )
  } else {
    // En producción, puedes usar un archivo HTML estático
    splashWindow.loadFile(join(__dirname, "../renderer/splash.html"))
  }

  // Mostrar splash cuando esté listo
  splashWindow.once("ready-to-show", () => {
    splashWindow?.show()
  })

  // Auto-cerrar después de un tiempo máximo (safety net)
  setTimeout(() => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      closeSplashWindow()
    }
  }, 5000)

  return splashWindow
}

export function closeSplashWindow(): void {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close()
    splashWindow = null
  }
}

export function getSplashWindow(): BrowserWindow | null {
  return splashWindow
}

