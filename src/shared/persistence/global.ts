import type { BoardStorageMode } from './boardStore'

/**
 * Global, per-user state — lives in the app's userData dir, never in any repo.
 * Type-only; concrete defaults live in `src/main/persistence/defaults.ts`.
 */

/** UI theme preference. `system` follows the OS (via Electron `nativeTheme`). */
export type ThemePref = 'system' | 'dark' | 'light'
/** The concrete theme actually applied once `system` is resolved. */
export type ResolvedTheme = 'dark' | 'light'
/** Language preference. `system` follows the OS locale, mapped to a supported one. */
export type LocalePref = 'system' | 'en' | 'pt-BR' | 'es-AR'
/** The concrete locale actually applied once `system` is resolved. */
export type ResolvedLocale = 'en' | 'pt-BR' | 'es-AR'

export interface AppSettings {
  /** The user's display name (shown in the sidebar). Empty until they set it. */
  userName: string
  accent: string
  /** Light/dark/system theme. `system` tracks the OS appearance live. */
  themePref: ThemePref
  /** UI language; `system` maps the OS locale to the nearest supported one. */
  localePref: LocalePref
  /** Vendor-neutral default agent: which provider + model new sessions use. */
  defaultProviderId: string
  defaultModelId: string
  terminalFontSize: number
  restoreSessions: boolean
  confirmBeforeClosingRunning: boolean
  launchAtLogin: boolean
  /** Persisted widths for the resizable app sidebar + Explore file tree (px). */
  sidebarWidth: number
  exploreTreeWidth: number
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
  /** An update version the user chose to skip; we won't prompt for it again. */
  skippedUpdateVersion?: string
}
