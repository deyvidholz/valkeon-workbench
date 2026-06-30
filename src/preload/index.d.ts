import type { ValkeonApi } from './index'

declare global {
  interface Window {
    api: ValkeonApi
  }
}

export {}
