# 📋 GUÍA COMPLETA PARA CREAR FLOWS DINÁMICOS

## 🎯 **Resumen Ejecutivo**

Los flows dinámicos permiten crear automatizaciones personalizadas usando JSON sin programar código. Esta guía explica **exactamente** cómo crear, estructurar y ejecutar flows dinámicos correctamente.

## 🔍 **Entendiendo la Arquitectura**

### **¿Cómo Funciona Internamente?**

1. **Envías un JSON** a la API con la definición del flow
2. **El sistema lo transforma** en dos partes:
   - **Checkpoints simplificados** para el sistema interno
   - **Definición original completa** guardada en `metadata.originalDefinition`
3. **Durante la ejecución**, el sistema usa la definición original para crear checkpoints dinámicos

### **Estructura de Almacenamiento vs. Definición**

```mermaid
graph TD
    A[JSON que envías a API] --> B[CreateDynamicFlowHandler]
    B --> C[Archivo guardado en data/flows/]
    C --> D[metadata.originalDefinition = JSON original]
    C --> E[checkpoints = versión simplificada]
    
    F[Al ejecutar] --> G[DynamicFlowAdapter]
    G --> H[Lee originalDefinition]
    H --> I[Crea checkpoints dinámicos]
```

## 📝 **Estructura Correcta del JSON de Entrada**

### **Formato Completo (Enviar a API)**

```json
{
  "flowDefinition": {
    "flowId": "mi-flow-personalizado",
    "name": "Mi Flow Personalizado",  
    "type": "custom",
    "version": "1.0.0",
    "description": "Descripción de lo que hace el flow",
    "author": "tu-nombre",
    "tags": ["tag1", "tag2", "utility"],
    
    "selectors": {
      "selectorName": "**/XCUIElementTypeButton[@name='Button Name']",
      "otherSelector": "**/XCUIElementTypeTextField[@name='Input Field']"
    },
    
    "checkpoints": [
      {
        "id": "step-1",
        "name": "checkpointName",
        "type": "setup|interactive|validation",
        "timeout": 30000,
        "critical": true|false,
        "description": "Descripción de lo que hace este checkpoint",
        "dependencies": ["otherCheckpointName"],
        
        "actions": [
          {
            "type": "openApp",
            "bundleId": "com.apple.mobileslideshow",
            "description": "Abrir la app"
          },
          {
            "type": "wait", 
            "duration": 2000,
            "description": "Esperar carga"
          },
          {
            "type": "findAndClick",
            "selector": "$selectorName",
            "timeout": 10000,
            "description": "Click en elemento"
          }
        ],
        
        "asyncTasks": [
          {
            "id": "task-id",
            "type": "monitor|poller|captchaWatcher",
            "interval": 5000,
            "stopConditions": ["checkpointCompleted"],
            "description": "Descripción de la tarea"
          }
        ],
        
        "conditionalRoutes": [
          {
            "condition": {
              "asyncTask": "task-id",
              "result": "found"
            },
            "action": "pauseAndWait"
          }
        ]
      }
    ],
    
    "options": {
      "infinite": false,
      "maxRuns": 1,
      "runDelay": 0,
      "metadata": {
        "complexity": "low|medium|high",
        "estimatedDuration": 60000,
        "requiresManualInput": false,
        "supportedDevices": ["iOS"],
        "minIOSVersion": "14.0"
      }
    }
  },
  "userId": "tu-usuario",
  "overwrite": false
}
```

## 🏗️ **Componentes Detallados**

### **1. 📋 Información Básica del Flow**

```json
{
  "flowId": "mi-flow-unico",           // ✅ REQUERIDO: ID único del flow
  "name": "Nombre Descriptivo",        // ✅ REQUERIDO: Nombre para mostrar
  "type": "custom",                    // ✅ REQUERIDO: Siempre "custom" para flows dinámicos
  "version": "1.0.0",                  // ⚠️ OPCIONAL: Versión del flow
  "description": "Qué hace el flow",   // ⚠️ OPCIONAL: Descripción detallada
  "author": "tu-nombre",               // ⚠️ OPCIONAL: Autor del flow
  "tags": ["utility", "cleanup"]       // ⚠️ OPCIONAL: Tags para categorización
}
```

### **2. 🎯 Selectores**

Los selectores son referencias reutilizables a elementos UI:

```json
{
  "selectors": {
    "loginButton": "**/XCUIElementTypeButton[@name='Log In']",
    "emailInput": "**/XCUIElementTypeTextField[@name='Email']",
    "passwordInput": "**/XCUIElementTypeSecureTextField[@name='Password']"
  }
}
```

**💡 Uso en acciones**: `"selector": "$loginButton"`

### **3. ⚙️ Checkpoints**

Cada checkpoint es un paso del flow:

```json
{
  "id": "step-unique-id",              // ✅ REQUERIDO: ID único del step
  "name": "checkpointName",            // ✅ REQUERIDO: Nombre del checkpoint
  "type": "setup",                     // ✅ REQUERIDO: setup|interactive|validation
  "timeout": 30000,                    // ⚠️ OPCIONAL: Timeout en ms (default: 60000)
  "critical": true,                    // ⚠️ OPCIONAL: Si falla, para todo (default: false)
  "description": "Qué hace",           // ⚠️ OPCIONAL: Descripción del paso
  "dependencies": ["otherStep"],       // ⚠️ OPCIONAL: Checkpoints que deben completarse antes
  "actions": [...],                    // ✅ REQUERIDO: Array de acciones a ejecutar
  "asyncTasks": [...],                 // ⚠️ OPCIONAL: Tareas en paralelo
  "conditionalRoutes": [...]           // ⚠️ OPCIONAL: Lógica condicional
}
```

### **4. 🎮 Acciones Disponibles**

#### **Acciones Básicas**

```json
// Abrir aplicación
{
  "type": "openApp",
  "bundleId": "com.apple.mobileslideshow",
  "description": "Abrir Photos app"
}

// Esperar tiempo
{
  "type": "wait",
  "duration": 2000,
  "description": "Esperar 2 segundos"
}

// Buscar elemento y hacer click
{
  "type": "findAndClick",
  "selector": "$buttonSelector",
  "timeout": 10000,
  "description": "Click en botón"
}

// Escribir texto
{
  "type": "type",
  "selector": "$inputSelector",
  "text": "Texto a escribir",
  "clearFirst": true,
  "description": "Escribir en campo"
}

// Esperar elemento
{
  "type": "waitForElement",
  "selector": "$elementSelector",
  "timeout": 15000,
  "description": "Esperar que aparezca elemento"
}
```

#### **Acciones Avanzadas**

```json
// Acción condicional
{
  "type": "ifExists",
  "selector": "$optionalButton",
  "timeout": 3000,
  "then": {
    "type": "findAndClick",
    "selector": "$optionalButton"
  },
  "else": {
    "type": "wait",
    "duration": 1000
  },
  "description": "Click si existe, sino esperar"
}

// Loop/repetir acciones
{
  "type": "loop",
  "iterations": 5,
  "actions": [
    {
      "type": "findAndClick", 
      "selector": "$likeButton"
    },
    {
      "type": "wait",
      "duration": 1000
    }
  ],
  "description": "Dar like 5 veces"
}

// Gesto complejo con performActions
{
  "type": "performActions",
  "actions": [
    {
      "type": "pointer",
      "id": "finger1", 
      "parameters": { "pointerType": "touch" },
      "actions": [
        { "type": "pointerMove", "duration": 0, "x": 100, "y": 200 },
        { "type": "pointerDown", "button": 0 },
        { "type": "pointerMove", "duration": 1000, "x": 200, "y": 300 },
        { "type": "pointerUp", "button": 0 }
      ]
    }
  ],
  "description": "Gesto de arrastre personalizado"
}
```

### **5. 🔄 Tareas Asíncronas**

Ejecutan en paralelo mientras el checkpoint principal corre:

```json
{
  "asyncTasks": [
    {
      "id": "sms-monitor",
      "type": "poller",
      "interval": 5000,
      "endpoint": "/api/sms/check/{sessionId}",
      "params": ["sessionId"],
      "saveToContext": "smsData",
      "stopConditions": ["checkpointCompleted"],
      "description": "Monitorear SMS entrantes"
    },
    {
      "id": "captcha-watcher",
      "type": "captchaWatcher", 
      "interval": 3000,
      "pauseOthersOnDetection": true,
      "stopConditions": ["captchaDetected"],
      "description": "Detectar captcha"
    }
  ]
}
```

### **6. 🛤️ Rutas Condicionales**

Lógica de decisión basada en resultados:

```json
{
  "conditionalRoutes": [
    {
      "condition": {
        "asyncTask": "captcha-watcher",
        "result": "captchaDetected"
      },
      "action": "pauseAndSolveCaptcha"
    },
    {
      "condition": {
        "contextKey": "smsReceived",
        "exists": true
      },
      "action": "proceedToNext"
    }
  ]
}
```

## 🔧 **Cómo Crear un Flow (Paso a Paso)**

### **Paso 1: Define la Estructura Básica**

```json
{
  "flowDefinition": {
    "flowId": "photos-cleanup-flow",
    "name": "Limpieza de Fotos",
    "type": "custom", 
    "description": "Borra fotos del álbum Model"
  }
}
```

### **Paso 2: Define los Selectores**

```json
{
  "selectors": {
    "modelAlbum": "**/XCUIElementTypeStaticText[`name == \"Model\"`][1]",
    "selectButton": "**/XCUIElementTypeStaticText[`name == \"Select\"`]",
    "deleteButton": "**/XCUIElementTypeButton[`name == \"Delete\"`]"
  }
}
```

### **Paso 3: Crea los Checkpoints**

```json
{
  "checkpoints": [
    {
      "id": "step-1",
      "name": "openPhotosApp", 
      "type": "setup",
      "critical": true,
      "actions": [
        {
          "type": "openApp",
          "bundleId": "com.apple.mobileslideshow"
        }
      ]
    },
    {
      "id": "step-2", 
      "name": "navigateToAlbum",
      "type": "interactive",
      "dependencies": ["openPhotosApp"],
      "actions": [
        {
          "type": "findAndClick",
          "selector": "$modelAlbum"
        }
      ]
    }
  ]
}
```

### **Paso 4: Envía a la API**

```bash
curl -X POST http://localhost:3000/api/flows/dynamic \
  -H "Content-Type: application/json" \
  -d '{
    "flowDefinition": {
      // Tu JSON completo aquí
    },
    "userId": "tu-usuario",
    "overwrite": false
  }'
```

## 📂 **Estructura de Almacenamiento (Solo Referencia)**

**⚠️ NO EDITES MANUALMENTE estos archivos. Se generan automáticamente.**

```json
{
  "id": "photos-cleanup-flow",
  "type": "photos-cleanup-flow",
  "checkpoints": [
    {
      "name": "openPhotosApp",
      "critical": true,
      "dependencies": [],
      "timeout": 30000
    }
  ],
  "options": {
    "infinite": false,
    "maxRuns": 1,
    "runDelay": 0
  },
  "metadata": {
    "name": "Limpieza de Fotos",
    "description": "Borra fotos del álbum Model", 
    "author": "tu-usuario",
    "isDynamic": true,
    "createdAt": "2025-07-29T...",
    "originalDefinition": {
      // ✅ AQUÍ SE GUARDA TU JSON ORIGINAL COMPLETO
      "flowId": "photos-cleanup-flow",
      "checkpoints": [
        {
          "id": "step-1",
          "actions": [
            {
              "type": "openApp",
              "bundleId": "com.apple.mobileslideshow"
            }
          ]
        }
      ]
    }
  }
}
```

## 🚀 **Comandos Útiles**

### **Ver Acciones Disponibles**
```bash
curl http://localhost:3000/api/flows/dynamic/actions
```

### **Validar Flow Antes de Crear**
```bash
curl -X POST http://localhost:3000/api/flows/dynamic/validate \
  -H "Content-Type: application/json" \
  -d '{"flowDefinition": {...}}'
```

### **Listar Todos los Flows**
```bash
curl http://localhost:3000/api/flows/dynamic
```

### **Ejecutar Flow**
```bash
curl -X POST http://localhost:3000/api/automation/start \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device-id",
    "flowType": "mi-flow-id", 
    "profileId": "profile-001"
  }'
```

## ❌ **Errores Comunes**

### **1. Estructura Incorrecta**
```json
// ❌ MAL - Falta flowDefinition wrapper
{
  "flowId": "mi-flow"
}

// ✅ BIEN - Con wrapper correcto
{
  "flowDefinition": {
    "flowId": "mi-flow"
  }
}
```

### **2. Selector Indefinido**
```json
// ❌ MAL - Selector no definido
{
  "actions": [
    {
      "type": "findAndClick",
      "selector": "$buttonQueNoExiste"  // ← Error
    }
  ]
}

// ✅ BIEN - Selector definido
{
  "selectors": {
    "myButton": "**/XCUIElementTypeButton[@name='Click Me']"
  },
  "checkpoints": [
    {
      "actions": [
        {
          "type": "findAndClick", 
          "selector": "$myButton"  // ← Correcto
        }
      ]
    }
  ]
}
```

### **3. Dependencia Circular**
```json
// ❌ MAL - A depende de B, B depende de A
{
  "checkpoints": [
    {
      "name": "stepA",
      "dependencies": ["stepB"]
    },
    {
      "name": "stepB", 
      "dependencies": ["stepA"]
    }
  ]
}
```

## 🎯 **Mejores Prácticas**

### **1. Nomenclatura Clara**
- **flowId**: `app-action-version` (ej: `photos-cleanup-v1`)
- **checkpoint names**: `verbNoun` (ej: `openApp`, `selectPhotos`)
- **selector names**: `elementPurpose` (ej: `loginButton`, `emailInput`)

### **2. Timeouts Apropiados**
- **Acciones rápidas**: 5-10 segundos
- **Carga de apps**: 15-30 segundos
- **Procesos complejos**: 60+ segundos

### **3. Descripciones Útiles**
```json
{
  "description": "Esperar que aparezca el botón de login",  // ✅ Específico
  "description": "Hacer algo"                              // ❌ Vago
}
```

### **4. Manejo de Errores**
- Usa `critical: true` solo para pasos esenciales
- Incluye `ifExists` para elementos opcionales
- Define `dependencies` correctamente

## 📚 **Ejemplos Completos**

### **Flow Simple - Abrir App**
```json
{
  "flowDefinition": {
    "flowId": "simple-open-app",
    "name": "Abrir Aplicación Simple",
    "type": "custom",
    "checkpoints": [
      {
        "id": "step-1",
        "name": "openApp",
        "type": "setup",
        "critical": true,
        "actions": [
          {
            "type": "openApp",
            "bundleId": "com.apple.mobileslideshow",
            "description": "Abrir Photos"
          },
          {
            "type": "wait",
            "duration": 3000,
            "description": "Esperar carga"
          }
        ]
      }
    ],
    "options": {
      "infinite": false,
      "maxRuns": 1
    }
  }
}
```

### **Flow Complejo - Con Async Tasks**
```json
{
  "flowDefinition": {
    "flowId": "complex-automation",
    "name": "Automatización Compleja",
    "type": "custom",
    "selectors": {
      "phoneInput": "**/XCUIElementTypeTextField[@name='Phone']",
      "codeInput": "**/XCUIElementTypeTextField[@name='Code']"
    },
    "checkpoints": [
      {
        "id": "phone-verification",
        "name": "phoneVerification",
        "type": "interactive", 
        "critical": true,
        "actions": [
          {
            "type": "type",
            "selector": "$phoneInput", 
            "text": "+1234567890"
          }
        ],
        "asyncTasks": [
          {
            "id": "sms-poller",
            "type": "poller",
            "interval": 5000,
            "endpoint": "/api/sms/latest",
            "saveToContext": "smsCode"
          }
        ],
        "conditionalRoutes": [
          {
            "condition": {
              "contextKey": "smsCode",
              "exists": true
            },
            "action": "proceedWithCode"
          }
        ]
      }
    ]
  }
}
```

## 🔍 **Debugging y Troubleshooting**

### **1. Validar JSON**
Siempre valida tu JSON antes de enviarlo:
```bash
cat mi-flow.json | jq .  # Valida sintaxis JSON
```

### **2. Revisar Logs**
Los logs del servidor muestran errores detallados:
```bash
# Ver logs en tiempo real
tail -f logs/app.log | grep -i error
```

### **3. Usar Endpoint de Validación**
```bash
curl -X POST http://localhost:3000/api/flows/dynamic/validate \
  -H "Content-Type: application/json" \
  -d @mi-flow.json
```

## 📞 **Soporte y Recursos**

- **Endpoint de acciones**: `GET /api/flows/dynamic/actions` - Lista todas las acciones disponibles
- **Validación**: `POST /api/flows/dynamic/validate` - Valida tu JSON
- **Ejemplos**: Revisa `/examples/dynamic-tinder-flow.json` para referencia
- **Logs**: Siempre revisa los logs del servidor para errores detallados

## 🎉 **¡Ahora ya sabes cómo crear flows dinámicos correctamente!**

La clave está en entender que:
1. **Envías** una estructura completa a la API
2. **El sistema** la guarda en `originalDefinition`
3. **Durante ejecución** usa esa definición original

¡No hay alucinaciones, solo seguir la estructura documentada! 🚀