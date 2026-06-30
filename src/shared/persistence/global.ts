import type { BoardStorageMode } from './boardStore'

/**
 * Global, per-user state — lives in the app's userData dir, never in any repo.
 * Type-only; concrete defaults live in `src/main/persistence/defaults.ts`.
 */

export interface AppSettings {
  /** The user's display name (shown in the sidebar). Empty until they set it. */
  userName: string
  accent: string
  /** Vendor-neutral default agent: which provider + model new sessions use. */
  defaultProviderId: string
  defaultModelId: string
  terminalFontSize: number
  restoreSessions: boolean
  confirmBeforeClosingRunning: boolean
  launchAtLogin: boolean
  /** Where board content is stored: in the repo (`.valkeon/`) or app-data. */
  boardStorage: BoardStorageMode
}

export interface RecentProject {
  name: string
  path: string
  branch: string
  sessions: number
  /** ISO timestamp of the last open. */
  lastOpened: string
}

export interface WindowBounds {
  x?: number
  y?: number
  width: number
  height: number
  maximized?: boolean
}

export interface GlobalState {
  settings: AppSettings
  recents: RecentProject[]
  windowBounds?: WindowBounds
}
