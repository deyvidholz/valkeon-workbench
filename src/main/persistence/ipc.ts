import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc'
import type { AppSettings, RecentProject } from '@shared/persistence/global'
import type { Board, BoardCard, WorkspaceRecord } from '@shared/persistence/types'
import type { GlobalStore } from './globalStore'
import { createBoardStore } from './boardStoreFactory'
import { assertAllowedRepo } from '../security'
import { loadHistory, saveHistory } from './historyStore'
import { loadSessions, saveSessions } from './sessionsStore'

/**
 * Wire settings / recents / board persistence to IPC, delegating to the stores.
 *
 * `repoPath` is untrusted (it comes from the renderer). Board handlers only
 * accept a path the user actually opened — i.e. one present in the recents
 * allowlist — so a compromised renderer can't turn these handlers into an
 * arbitrary-filesystem read/write primitive rooted anywhere.
 */
export function registerPersistenceIpc(globalStore: GlobalStore): void {
  const storeFor = (repoPath: string) => {
    assertAllowedRepo(globalStore, repoPath)
    return createBoardStore(globalStore.getSettings().boardStorage, repoPath)
  }

  ipcMain.handle(IpcChannels.settingsGet, () => globalStore.getSettings())
  ipcMain.handle(IpcChannels.settingsSet, (_e, patch: Partial<AppSettings>) =>
    globalStore.setSettings(patch)
  )

  ipcMain.handle(IpcChannels.recentsGet, () => globalStore.getRecents())
  ipcMain.handle(IpcChannels.recentsAdd, (_e, recent: RecentProject) =>
    globalStore.addRecent(recent)
  )

  ipcMain.handle(IpcChannels.boardsLoad, (_e, repoPath: string) => storeFor(repoPath).load())
  ipcMain.handle(IpcChannels.workspacesSave, (_e, repoPath: string, workspaces: WorkspaceRecord[]) =>
    storeFor(repoPath).saveWorkspaces(workspaces)
  )
  ipcMain.handle(IpcChannels.boardSave, (_e, repoPath: string, board: Board) =>
    storeFor(repoPath).saveBoard(board)
  )
  ipcMain.handle(IpcChannels.cardSave, (_e, repoPath: string, boardId: string, card: BoardCard) =>
    storeFor(repoPath).saveCard(boardId, card)
  )
  ipcMain.handle(IpcChannels.cardDelete, (_e, repoPath: string, boardId: string, cardId: string) =>
    storeFor(repoPath).deleteCard(boardId, cardId)
  )

  ipcMain.handle(IpcChannels.historyLoad, (_e, repoPath: string) =>
    loadHistory(assertAllowedRepo(globalStore, repoPath))
  )
  ipcMain.handle(IpcChannels.historySave, (_e, repoPath: string, entries: unknown[]) =>
    saveHistory(assertAllowedRepo(globalStore, repoPath), entries)
  )

  ipcMain.handle(IpcChannels.sessionsLoad, (_e, repoPath: string) =>
    loadSessions(assertAllowedRepo(globalStore, repoPath))
  )
  ipcMain.handle(IpcChannels.sessionsSave, (_e, repoPath: string, sessions: unknown[]) =>
    saveSessions(assertAllowedRepo(globalStore, repoPath), sessions)
  )
}
