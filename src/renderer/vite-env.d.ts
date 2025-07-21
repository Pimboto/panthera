/// <reference types="vite/client" />
/// <reference types="./types/electron.d.ts" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly __ELECTRON__: boolean
  readonly __DEV__: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
