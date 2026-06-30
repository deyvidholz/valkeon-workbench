import { BrowserWindow, Menu, type MenuItemConstructorOptions } from 'electron'
import { IpcChannels, type MenuAction } from '@shared/ipc'

interface MenuDeps {
  getWindow: () => BrowserWindow | null
  openProjectDialog: () => Promise<void>
}

/** Build the application menu, including a real File menu with project actions. */
export function buildAppMenu(deps: MenuDeps): void {
  const isMac = process.platform === 'darwin'
  const send = (action: MenuAction): void => {
    deps.getWindow()?.webContents.send(IpcChannels.menuAction, action)
  }

  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? ([{ role: 'appMenu' }] as MenuItemConstructorOptions[]) : []),
    {
      label: 'File',
      submenu: [
        { label: 'Open Folder…', accelerator: 'CmdOrCtrl+O', click: () => void deps.openProjectDialog() },
        { type: 'separator' },
        { label: 'New Session', accelerator: 'CmdOrCtrl+N', click: () => send('new-session') },
        { label: 'New Terminal', accelerator: 'CmdOrCtrl+T', click: () => send('new-terminal') },
        { type: 'separator' },
        { label: 'Close Project', accelerator: 'CmdOrCtrl+Shift+W', click: () => send('close-project') },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
