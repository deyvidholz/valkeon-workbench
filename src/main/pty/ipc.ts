import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc'
import type { PtyCreateSpec } from '@shared/pty'
import { PtyManager } from './manager'

export function registerPtyIpc(manager: PtyManager): void {
  // create returns a result (so the renderer can show a spawn error)
  ipcMain.handle(IpcChannels.ptyCreate, (_e, spec: PtyCreateSpec) => manager.create(spec))
  // input/resize/kill are fire-and-forget for the lowest possible latency
  ipcMain.on(IpcChannels.ptyInput, (_e, id: string, data: string) => manager.write(id, data))
  ipcMain.on(IpcChannels.ptyResize, (_e, id: string, cols: number, rows: number) =>
    manager.resize(id, cols, rows)
  )
  ipcMain.on(IpcChannels.ptyKill, (_e, id: string) => manager.kill(id))
}
