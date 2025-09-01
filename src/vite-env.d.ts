/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string
  // agrega aquí otras variables que uses, siempre con prefijo VITE_
  // readonly VITE_API_FEED: string
  // readonly VITE_API_ANALYTICS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}