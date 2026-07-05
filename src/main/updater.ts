import { app, ipcMain, shell, type WebContents } from 'electron'
import electronUpdater from 'electron-updater'
import { IpcChannels, type UpdateCapability, type UpdaterEvent } from '@shared/ipc'
import type { GlobalStore } from './persistence/globalStore'

const { autoUpdater } = electronUpdater

const RELEASES_URL = 'https://github.com/deyvidholz/valkeon-workbench/releases'

/**
 * Where the app can install an update in place:
 * - Windows (NSIS) and Linux AppImage → electron-updater downloads + installs.
 * - Everything else (unsigned macOS, Linux `.deb`, WSL) → we can only detect the
 *   update; the user reinstalls by hand, so we open the Releases page.
 */
function updateCapability(): UpdateCapability {
  if (process.platform === 'win32') return 'auto'
  if (process.platform === 'linux' && process.env.APPIMAGE) return 'auto'
  return 'manual'
}

function releaseNotesToText(notes: unknown): string | undefined {
  if (typeof notes === 'string') return notes.replace(/<[^>]+>/g, '').trim().slice(0, 600) || undefined
  if (Array.isArray(notes)) {
    const joined = notes
      .map((n) => (n && typeof n === 'object' && 'note' in n ? String((n as { note?: string }).note ?? '') : ''))
      .join('\n')
      .replace(/<[^>]+>/g, '')
      .trim()
    return joined.slice(0, 600) || undefined
  }
  return undefined
}

/**
 * Wire up in-app update checking. Returns a `checkForUpdates` function to call
 * once the window is ready. Safe to call in dev — it no-ops there (electron-
 * updater has no feed without a packaged app-update.yml).
 */
export function registerUpdater(
  store: GlobalStore,
  getWebContents: () => WebContents | null
): { checkForUpdates: () => void } {
  const send = (event: UpdaterEvent): void => getWebContents()?.send(IpcChannels.updaterEvent, event)

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false

  autoUpdater.on('update-available', (info) => {
    // Respect a version the user explicitly skipped.
    if (store.getSkippedUpdateVersion() === info.version) return
    send({
      kind: 'available',
      version: info.version,
      notes: releaseNotesToText((info as { releaseNotes?: unknown }).releaseNotes),
      capability: updateCapability(),
      releasesUrl: RELEASES_URL
    })
  })
  autoUpdater.on('update-not-available', () => send({ kind: 'none' }))
  autoUpdater.on('download-progress', (p) => send({ kind: 'progress', percent: Math.round(p.percent) }))
  autoUpdater.on('update-downloaded', (info) => send({ kind: 'downloaded', version: info.version }))
  autoUpdater.on('error', (err) => {
    console.warn('[valkeon] updater error:', err?.message || err)
    send({ kind: 'error', message: err?.message || 'Update failed.' })
  })

  ipcMain.handle(IpcChannels.updaterCheck, () => {
    if (!app.isPackaged) return
    autoUpdater.checkForUpdates().catch((err) => console.warn('[valkeon] update check failed:', err?.message || err))
  })
  ipcMain.handle(IpcChannels.updaterDownload, () => {
    autoUpdater.downloadUpdate().catch((err) => send({ kind: 'error', message: err?.message || 'Download failed.' }))
  })
  ipcMain.handle(IpcChannels.updaterInstall, () => {
    // Defer so the IPC reply flushes before the app quits to install.
    setImmediate(() => autoUpdater.quitAndInstall())
  })
  ipcMain.handle(IpcChannels.updaterSkip, (_e, version: string) => store.setSkippedUpdateVersion(version))
  ipcMain.handle(IpcChannels.updaterOpenReleases, () => shell.openExternal(RELEASES_URL))

  return {
    checkForUpdates: () => {
      if (!app.isPackaged) return
      autoUpdater
        .checkForUpdates()
        .catch((err) => console.warn('[valkeon] update check failed:', err?.message || err))
    }
  }
}
