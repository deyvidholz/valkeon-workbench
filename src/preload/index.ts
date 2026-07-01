import { contextBridge, ipcRenderer } from 'electron'
import {
  IpcChannels,
  type OpenedProject,
  type ProviderStatus,
  type AppSettings,
  type RecentProject,
  type Board,
  type BoardCard,
  type ProjectData,
  type WorkspaceRecord,
  type PtyCreateResult,
  type PtyCreateSpec,
  type PtyDataEvent,
  type PtyExitEvent,
  type WorktreeInfo,
  type Skill,
  type SkillSave,
  type MenuAction,
  type CloneResult,
  type AgentStartSpec,
  type AgentStartResult,
  type AgentEventPayload,
  type ContextBuildRequest,
  type ContextBuildResult,
  type NotifyRequest,
  type FileNode,
  type FileContent,
  type DiffFile
} from '@shared/ipc'

const api = {
  platform: process.platform,
  window: {
    minimize: (): Promise<void> => ipcRenderer.invoke(IpcChannels.windowMinimize),
    toggleMaximize: (): Promise<boolean> => ipcRenderer.invoke(IpcChannels.windowToggleMaximize),
    close: (): Promise<void> => ipcRenderer.invoke(IpcChannels.windowClose),
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke(IpcChannels.windowIsMaximized),
    /** Subscribe to maximize/unmaximize. Returns an unsubscribe function. */
    onMaximizeChange: (cb: (maximized: boolean) => void): (() => void) => {
      const listener = (_event: unknown, maximized: boolean): void => cb(maximized)
      ipcRenderer.on(IpcChannels.windowMaximizeChange, listener)
      return () => ipcRenderer.removeListener(IpcChannels.windowMaximizeChange, listener)
    },
    confirmClose: (): Promise<void> => ipcRenderer.invoke(IpcChannels.windowConfirmClose),
    onCloseRequested: (cb: () => void): (() => void) => {
      const listener = (): void => cb()
      ipcRenderer.on(IpcChannels.windowCloseRequested, listener)
      return () => ipcRenderer.removeListener(IpcChannels.windowCloseRequested, listener)
    }
  },
  openProject: (): Promise<OpenedProject | null> =>
    ipcRenderer.invoke(IpcChannels.dialogOpenProject),
  agents: {
    list: (): Promise<ProviderStatus[]> => ipcRenderer.invoke(IpcChannels.agentsList)
  },
  shell: {
    openPath: (target: string): Promise<string> => ipcRenderer.invoke(IpcChannels.shellOpenPath, target)
  },
  skills: {
    list: (repoPath: string): Promise<Skill[]> => ipcRenderer.invoke(IpcChannels.skillsList, repoPath),
    save: (repoPath: string, save: SkillSave): Promise<Skill[]> =>
      ipcRenderer.invoke(IpcChannels.skillsSave, repoPath, save),
    setEnabled: (repoPath: string, id: string, enabled: boolean): Promise<Skill[]> =>
      ipcRenderer.invoke(IpcChannels.skillsSetEnabled, repoPath, id, enabled)
  },
  menu: {
    onAction: (cb: (action: MenuAction) => void): (() => void) => {
      const listener = (_e: unknown, action: MenuAction): void => cb(action)
      ipcRenderer.on(IpcChannels.menuAction, listener)
      return () => ipcRenderer.removeListener(IpcChannels.menuAction, listener)
    },
    onOpenedProject: (cb: (project: OpenedProject) => void): (() => void) => {
      const listener = (_e: unknown, project: OpenedProject): void => cb(project)
      ipcRenderer.on(IpcChannels.menuOpenedProject, listener)
      return () => ipcRenderer.removeListener(IpcChannels.menuOpenedProject, listener)
    }
  },
  settings: {
    get: (): Promise<AppSettings> => ipcRenderer.invoke(IpcChannels.settingsGet),
    set: (patch: Partial<AppSettings>): Promise<AppSettings> =>
      ipcRenderer.invoke(IpcChannels.settingsSet, patch)
  },
  recents: {
    get: (): Promise<RecentProject[]> => ipcRenderer.invoke(IpcChannels.recentsGet),
    add: (recent: RecentProject): Promise<RecentProject[]> =>
      ipcRenderer.invoke(IpcChannels.recentsAdd, recent)
  },
  boards: {
    load: (repoPath: string): Promise<ProjectData> =>
      ipcRenderer.invoke(IpcChannels.boardsLoad, repoPath),
    saveWorkspaces: (repoPath: string, workspaces: WorkspaceRecord[]): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.workspacesSave, repoPath, workspaces),
    saveBoard: (repoPath: string, board: Board): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.boardSave, repoPath, board),
    saveCard: (repoPath: string, boardId: string, card: BoardCard): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.cardSave, repoPath, boardId, card),
    deleteCard: (repoPath: string, boardId: string, cardId: string): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.cardDelete, repoPath, boardId, cardId)
  },
  history: {
    load: (repoPath: string): Promise<unknown[]> => ipcRenderer.invoke(IpcChannels.historyLoad, repoPath),
    save: (repoPath: string, entries: unknown[]): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.historySave, repoPath, entries)
  },
  sessions: {
    load: (repoPath: string): Promise<unknown[]> => ipcRenderer.invoke(IpcChannels.sessionsLoad, repoPath),
    save: (repoPath: string, sessions: unknown[]): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.sessionsSave, repoPath, sessions)
  },
  pty: {
    create: (spec: PtyCreateSpec): Promise<PtyCreateResult> =>
      ipcRenderer.invoke(IpcChannels.ptyCreate, spec),
    write: (id: string, data: string): void => ipcRenderer.send(IpcChannels.ptyInput, id, data),
    resize: (id: string, cols: number, rows: number): void =>
      ipcRenderer.send(IpcChannels.ptyResize, id, cols, rows),
    kill: (id: string): void => ipcRenderer.send(IpcChannels.ptyKill, id),
    onData: (cb: (e: PtyDataEvent) => void): (() => void) => {
      const listener = (_e: unknown, payload: PtyDataEvent): void => cb(payload)
      ipcRenderer.on(IpcChannels.ptyData, listener)
      return () => ipcRenderer.removeListener(IpcChannels.ptyData, listener)
    },
    onExit: (cb: (e: PtyExitEvent) => void): (() => void) => {
      const listener = (_e: unknown, payload: PtyExitEvent): void => cb(payload)
      ipcRenderer.on(IpcChannels.ptyExit, listener)
      return () => ipcRenderer.removeListener(IpcChannels.ptyExit, listener)
    }
  },
  agent: {
    start: (spec: AgentStartSpec): Promise<AgentStartResult> =>
      ipcRenderer.invoke(IpcChannels.agentStart, spec),
    send: (id: string, text: string): void => ipcRenderer.send(IpcChannels.agentSend, id, text),
    stop: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.agentStop, id),
    dispose: (id: string): void => ipcRenderer.send(IpcChannels.agentDispose, id),
    onEvent: (cb: (e: AgentEventPayload) => void): (() => void) => {
      const listener = (_e: unknown, payload: AgentEventPayload): void => cb(payload)
      ipcRenderer.on(IpcChannels.agentEvent, listener)
      return () => ipcRenderer.removeListener(IpcChannels.agentEvent, listener)
    }
  },
  context: {
    build: (req: ContextBuildRequest): Promise<ContextBuildResult> =>
      ipcRenderer.invoke(IpcChannels.contextBuild, req)
  },
  files: {
    tree: (repoPath: string): Promise<FileNode[]> => ipcRenderer.invoke(IpcChannels.filesTree, repoPath),
    read: (repoPath: string, relPath: string): Promise<FileContent> =>
      ipcRenderer.invoke(IpcChannels.fileRead, repoPath, relPath),
    diff: (repoPath: string): Promise<DiffFile[]> => ipcRenderer.invoke(IpcChannels.gitDiff, repoPath),
    createFile: (repoPath: string, relPath: string): Promise<boolean> =>
      ipcRenderer.invoke(IpcChannels.fileCreate, repoPath, relPath),
    createDir: (repoPath: string, relPath: string): Promise<boolean> =>
      ipcRenderer.invoke(IpcChannels.dirCreate, repoPath, relPath),
    rename: (repoPath: string, oldRel: string, newRel: string): Promise<boolean> =>
      ipcRenderer.invoke(IpcChannels.fileRename, repoPath, oldRel, newRel),
    remove: (repoPath: string, relPath: string): Promise<boolean> =>
      ipcRenderer.invoke(IpcChannels.fileDelete, repoPath, relPath)
  },
  notify: {
    show: (req: NotifyRequest): void => ipcRenderer.send(IpcChannels.notifyShow, req),
    onClicked: (cb: (sessionId: string) => void): (() => void) => {
      const listener = (_e: unknown, sessionId: string): void => cb(sessionId)
      ipcRenderer.on(IpcChannels.notifyClicked, listener)
      return () => ipcRenderer.removeListener(IpcChannels.notifyClicked, listener)
    }
  },
  git: {
    worktrees: (repoPath: string): Promise<WorktreeInfo[]> =>
      ipcRenderer.invoke(IpcChannels.gitWorktrees, repoPath),
    addWorktree: (repoPath: string, branch: string, dir: string): Promise<WorktreeInfo[]> =>
      ipcRenderer.invoke(IpcChannels.gitWorktreeAdd, repoPath, branch, dir),
    removeWorktree: (repoPath: string, dir: string): Promise<WorktreeInfo[]> =>
      ipcRenderer.invoke(IpcChannels.gitWorktreeRemove, repoPath, dir),
    isRepo: (repoPath: string): Promise<boolean> => ipcRenderer.invoke(IpcChannels.gitIsRepo, repoPath),
    init: (repoPath: string): Promise<string> => ipcRenderer.invoke(IpcChannels.gitInit, repoPath),
    clone: (url: string): Promise<CloneResult> => ipcRenderer.invoke(IpcChannels.gitClone, url)
  }
}

export type ValkeonApi = typeof api

contextBridge.exposeInMainWorld('api', api)
