import { app, BrowserWindow, ipcMain, dialog, session, shell, Notification, nativeImage } from 'electron'
import { join, basename, isAbsolute, resolve } from 'node:path'
import { statSync } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { IpcChannels, type OpenedProject, type CloneResult, type NotifyRequest } from '@shared/ipc'
import { registerAgentProviders, listProviderStatus, getProvider } from './agents/registry'
import { StructuredAgentManager } from './agents/manager'
import { registerAgentIpc } from './agents/ipc'
import { getSpawnEnv } from './env'
import { GlobalStore } from './persistence/globalStore'
import { registerPersistenceIpc } from './persistence/ipc'
import { PtyManager } from './pty/manager'
import { registerPtyIpc } from './pty/ipc'
import { registerGitIpc } from './git/ipc'
import { cloneRepo, isGitRepo } from './git/worktrees'
import { registerSkillsIpc } from './skills/ipc'
import { registerFilesIpc } from './files/ipc'
import { buildAppMenu } from './menu'

// Name the app (dock, menu bar) before anything reads it. Note: in dev the
// macOS *bold* menu name and Finder still show "Electron" because that's the
// bundle running; packaging with productName produces "Valkeon Workbench.app".
app.setName('Valkeon Workbench')

const exec = promisify(execFile)
const isDev = !app.isPackaged

// The app icon (our V_ mark). In dev, main runs from out/main, so the repo's
// resources/ sit two levels up; packaged, they're bundled alongside.
const iconPath = join(__dirname, '../../resources/icon.png')
const appIcon = nativeImage.createFromPath(iconPath)

let mainWindow: BrowserWindow | null = null
let globalStore: GlobalStore
let ptyManager: PtyManager
let agentManager: StructuredAgentManager
let saveBoundsTimer: ReturnType<typeof setTimeout> | null = null
let allowClose = false

/** Live work that should block a quick quit: interactive terminals + agents. */
function liveProcessCount(): number {
  return (ptyManager?.count() ?? 0) + (agentManager?.count() ?? 0)
}

function contentSecurityPolicy(): string {
  const fonts = 'https://fonts.googleapis.com https://fonts.gstatic.com'
  const script = isDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self'"
  const connect = isDev
    ? `connect-src 'self' ws: wss: ${fonts}`
    : `connect-src 'self' ${fonts}`
  return [
    "default-src 'self'",
    script,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    // Monaco editor loads its language/editor workers as bundled (blob) workers.
    "worker-src 'self' blob:",
    connect
  ].join('; ')
}

function persistBounds(): void {
  if (!mainWindow) return
  const maximized = mainWindow.isMaximized()
  // When maximized, keep the last normal bounds so restore returns to a sane size.
  const bounds = maximized ? globalStore.getBounds() : mainWindow.getBounds()
  void globalStore.setBounds({ ...(bounds ?? { width: 1400, height: 900 }), maximized })
}

function scheduleBoundsSave(): void {
  if (saveBoundsTimer) clearTimeout(saveBoundsTimer)
  saveBoundsTimer = setTimeout(persistBounds, 400)
}

function createWindow(): void {
  const saved = globalStore.getBounds()
  mainWindow = new BrowserWindow({
    width: saved?.width ?? 1400,
    height: saved?.height ?? 900,
    x: saved?.x,
    y: saved?.y,
    minWidth: 980,
    minHeight: 640,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: true,
    icon: appIcon,
    title: 'Valkeon Workbench',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Harden the privileged renderer: deny new windows (open external links in the
  // OS browser instead) and block any top-level navigation away from the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) void shell.openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow?.webContents.getURL()) event.preventDefault()
  })

  const emitMaximize = (max: boolean): void =>
    mainWindow?.webContents.send(IpcChannels.windowMaximizeChange, max)
  mainWindow.on('maximize', () => {
    emitMaximize(true)
    scheduleBoundsSave()
  })
  mainWindow.on('unmaximize', () => {
    emitMaximize(false)
    scheduleBoundsSave()
  })
  mainWindow.on('resize', scheduleBoundsSave)
  mainWindow.on('move', scheduleBoundsSave)

  // Ask the renderer to confirm before closing while PTYs are running.
  mainWindow.on('close', (event) => {
    if (!allowClose && liveProcessCount() > 0) {
      event.preventDefault()
      mainWindow?.webContents.send(IpcChannels.windowCloseRequested)
    }
  })

  // Clear the reference once the native window is gone so `mainWindow?.…`
  // guards actually short-circuit (a destroyed window is non-null but throws
  // on access). PTY exit callbacks fire during shutdown and read it.
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.once('ready-to-show', () => {
    if (saved?.maximized) mainWindow?.maximize()
    mainWindow?.show()
  })

  const rendererUrl = process.env['ELECTRON_RENDERER_URL']
  if (rendererUrl) {
    void mainWindow.loadURL(rendererUrl)
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

/** Read the current git branch for a folder, or 'main' if it isn't a repo. */
async function readBranch(dir: string): Promise<string> {
  try {
    const { stdout } = await exec('git', ['-C', dir, 'rev-parse', '--abbrev-ref', 'HEAD'], {
      env: getSpawnEnv()
    })
    return stdout.trim() || 'main'
  } catch (err) {
    console.warn(`[valkeon] could not read git branch for ${dir}:`, (err as Error).message)
    return 'main'
  }
}

// A project passed on the command line (`valkeon <path>`), resolved once at
// startup and handed to the renderer when it asks (pull, so there's no race
// with the renderer registering its listeners). Multi-instance: each launched
// process parses its own argv, so every `valkeon <path>` opens its own window.
let pendingCliProject: OpenedProject | null = null

/**
 * Extract a project directory from the process argv, resolved against the
 * launching shell's cwd. Packaged builds get `[exe, ...args]`; dev gets
 * `[electron, mainScript, ...args]`. We take the first non-flag argument.
 */
function projectPathFromArgv(argv: string[]): string | null {
  const args = argv.slice(app.isPackaged ? 1 : 2)
  for (const arg of args) {
    if (!arg || arg.startsWith('-')) continue
    return isAbsolute(arg) ? arg : resolve(process.cwd(), arg)
  }
  return null
}

/** Resolve a CLI path into an OpenedProject, recording it as a recent. */
async function resolveCliProject(cliPath: string): Promise<OpenedProject | null> {
  try {
    if (!statSync(cliPath).isDirectory()) {
      console.warn(`[valkeon] CLI path is not a directory: ${cliPath}`)
      return null
    }
  } catch {
    console.warn(`[valkeon] CLI path does not exist: ${cliPath}`)
    return null
  }
  const project: OpenedProject = {
    path: cliPath,
    name: basename(cliPath),
    branch: await readBranch(cliPath),
    isGitRepo: await isGitRepo(cliPath)
  }
  await globalStore.addRecent({ ...project, sessions: 0, lastOpened: new Date().toISOString() })
  return project
}

/** Show the open-folder dialog, record the recent, and return the project. */
async function runOpenProjectDialog(): Promise<OpenedProject | null> {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open project folder',
    properties: ['openDirectory', 'createDirectory']
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const path = result.filePaths[0]
  const project: OpenedProject = {
    path,
    name: basename(path),
    branch: await readBranch(path),
    isGitRepo: await isGitRepo(path)
  }
  await globalStore.addRecent({ ...project, sessions: 0, lastOpened: new Date().toISOString() })
  return project
}

function registerIpc(): void {
  ipcMain.handle(IpcChannels.windowMinimize, () => mainWindow?.minimize())
  ipcMain.handle(IpcChannels.windowToggleMaximize, () => {
    if (!mainWindow) return false
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
    return mainWindow.isMaximized()
  })
  ipcMain.handle(IpcChannels.windowClose, () => mainWindow?.close())
  ipcMain.handle(IpcChannels.windowConfirmClose, () => {
    allowClose = true
    mainWindow?.close()
  })
  ipcMain.handle(IpcChannels.windowIsMaximized, () => mainWindow?.isMaximized() ?? false)

  ipcMain.handle(IpcChannels.dialogOpenProject, () => runOpenProjectDialog())

  // The renderer pulls any `valkeon <path>` project once, on startup.
  ipcMain.handle(IpcChannels.cliPendingProject, () => {
    const project = pendingCliProject
    pendingCliProject = null
    return project
  })

  ipcMain.handle(IpcChannels.agentsList, () => listProviderStatus())

  // OS notifications: a session needs attention (asked a question / finished).
  ipcMain.on(IpcChannels.notifyShow, (_e, req: NotifyRequest) => {
    if (!Notification.isSupported() || !req || typeof req.title !== 'string') return
    const n = new Notification({ title: req.title.slice(0, 120), body: String(req.body ?? '').slice(0, 240), silent: false })
    n.on('click', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus()
        mainWindow.webContents.send(IpcChannels.notifyClicked, req.sessionId)
      }
    })
    n.show()
  })

  ipcMain.handle(IpcChannels.shellOpenPath, (_e, target: string) => shell.openPath(target))

  ipcMain.handle(IpcChannels.gitClone, async (_e, url: string): Promise<CloneResult> => {
    if (!mainWindow || typeof url !== 'string') return { ok: false, error: 'No window available.' }
    const clean = url.trim()
    if (!/^(https?|git|ssh):\/\//.test(clean) && !/^git@/.test(clean))
      return { ok: false, error: "That doesn't look like a git URL (try https://… or git@…)." }
    const name = (clean.split('/').pop() || 'repo').replace(/\.git$/, '').replace(/[^A-Za-z0-9._-]/g, '-') || 'repo'
    const result = await dialog.showOpenDialog(mainWindow, {
      title: `Clone into… (creates ${name}/)`,
      properties: ['openDirectory', 'createDirectory'],
      buttonLabel: 'Clone here'
    })
    if (result.canceled || result.filePaths.length === 0) return { ok: false, canceled: true }
    const target = join(result.filePaths[0], name)
    try {
      await cloneRepo(clean, result.filePaths[0], name)
    } catch (err) {
      const raw = (err as Error).message || 'Clone failed.'
      console.warn('[valkeon] clone failed:', raw)
      // git's stderr is verbose; surface a short, useful first line.
      const msg = /timeout|timed out/i.test(raw)
        ? 'Clone timed out — the repository may be very large or the network slow.'
        : /authentication|denied|403|could not read/i.test(raw)
          ? 'Authentication failed — check the URL and your git credentials.'
          : /not found|repository .* not found|404/i.test(raw)
            ? 'Repository not found — check the URL.'
            : raw.split('\n')[0].slice(0, 200)
      return { ok: false, error: msg }
    }
    const project: OpenedProject = { path: target, name, branch: await readBranch(target), isGitRepo: true }
    await globalStore.addRecent({ ...project, sessions: 0, lastOpened: new Date().toISOString() })
    return { ok: true, project }
  })
}

app.whenReady().then(async () => {
  // Show our V_ mark on the macOS dock (dev shows Electron's otherwise).
  if (process.platform === 'darwin' && app.dock && !appIcon.isEmpty()) app.dock.setIcon(appIcon)

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [contentSecurityPolicy()]
      }
    })
  })

  // GUI-launched macOS apps inherit a minimal PATH; augment it so child
  // processes (git via simple-git, the agent CLI) can be found everywhere.
  process.env.PATH = getSpawnEnv().PATH

  globalStore = new GlobalStore(join(app.getPath('userData'), 'valkeon.json'))
  await globalStore.init()

  // Resolve a project passed on the command line (`valkeon <path>`) before the
  // window loads, so the renderer can open straight into it.
  const cliPath = projectPathFromArgv(process.argv)
  if (cliPath) pendingCliProject = await resolveCliProject(cliPath)

  const webContentsFor = (): Electron.WebContents | null =>
    mainWindow && !mainWindow.isDestroyed() ? mainWindow.webContents : null
  ptyManager = new PtyManager(webContentsFor)

  registerAgentProviders()
  agentManager = new StructuredAgentManager(getProvider, webContentsFor)
  registerIpc()
  registerPersistenceIpc(globalStore)
  registerPtyIpc(ptyManager)
  registerAgentIpc(agentManager, globalStore)
  registerGitIpc(globalStore)
  registerSkillsIpc(globalStore)
  registerFilesIpc(globalStore)
  createWindow()

  buildAppMenu({
    getWindow: () => mainWindow,
    openProjectDialog: async () => {
      const project = await runOpenProjectDialog()
      if (project) mainWindow?.webContents.send(IpcChannels.menuOpenedProject, project)
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// ⌘Q / app quit: confirm first if PTYs are running (don't kill them before the
// user decides), otherwise tear them down and proceed.
app.on('before-quit', (event) => {
  if (!allowClose && liveProcessCount() > 0) {
    event.preventDefault()
    mainWindow?.webContents.send(IpcChannels.windowCloseRequested)
  } else {
    ptyManager?.killAll()
    agentManager?.killAll()
  }
})

// Single-window app: closing the window quits cleanly.
app.on('window-all-closed', () => app.quit())
