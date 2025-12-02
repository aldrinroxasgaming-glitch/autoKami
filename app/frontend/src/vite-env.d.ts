/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PRIVY_APP_ID: string
  readonly VITE_API_URL: string
  readonly VITE_KAMI_IMAGE_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
