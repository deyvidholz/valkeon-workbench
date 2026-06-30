import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc'
import type { AgentStartSpec } from '@shared/ipc'
import type { ContextBuildRequest } from '@shared/context'
import type { StructuredAgentManager } from './manager'
import type { GlobalStore } from '../persistence/globalStore'
import { createBoardStore } from '../persistence/boardStoreFactory'
import { assertAllowedRepo } from '../security'
import { buildContext } from '../context/assembler'

/**
 * IPC for structured agent sessions + context assembly. `repoPath` is untrusted,
 * so context builds go through the same allowlist as board persistence.
 */
export function registerAgentIpc(manager: StructuredAgentManager, globalStore: GlobalStore): void {
  ipcMain.handle(IpcChannels.agentStart, (_e, spec: AgentStartSpec) => {
    const { id, ...rest } = spec
    return manager.start(id, rest)
  })
  ipcMain.on(IpcChannels.agentSend, (_e, id: string, text: string) => manager.send(id, text))
  ipcMain.handle(IpcChannels.agentStop, (_e, id: string) => manager.stop(id))
  ipcMain.on(IpcChannels.agentDispose, (_e, id: string) => manager.dispose(id))

  ipcMain.handle(IpcChannels.contextBuild, async (_e, req: ContextBuildRequest) => {
    assertAllowedRepo(globalStore, req.repoPath)
    const store = createBoardStore(globalStore.getSettings().boardStorage, req.repoPath)
    let card = undefined
    let board = undefined
    if (req.cardId && req.boardId) {
      const data = await store.load()
      board = data.boards.find((b) => b.id === req.boardId)
      card = board?.cards.find((c) => c.id === req.cardId)
    }
    return buildContext(req.repoPath, req, card, board)
  })
}
