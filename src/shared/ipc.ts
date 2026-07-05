import type { AgentProviderMeta } from './agents/types'
import type { AppSettings, RecentProject, WindowBounds } from './persistence/global'
import type { Board, BoardCard, ProjectData, WorkspaceRecord } from './persistence/types'
import type { PtyCreateResult, PtyCreateSpec, PtyDataEvent, PtyExitEvent } from './pty'
import type { WorktreeInfo } from './git'
import type { Skill, SkillSave } from './skills'
import type { AgentEvent, AgentSessionSpec } from './agents/types'
import type { ContextBuildRequest, ContextBuildResult } from './context'
import type { FileNode, FileContent, DiffFile } from './files'
import type { ProjectConfig, MergeResult } from './project'

/** Channel names shared by main, preload, and (via the typed bridge) renderer. */
export const IpcChannels = {
  windowMinimize: 'window:minimize',
  windowToggleMaximize: 'window:toggle-maximize',
  windowClose: 'window:close',
  windowIsMaximized: 'window:is-maximized',
  windowMaximizeChange: 'window:maximize-change',
  windowCloseRequested: 'window:close-requested',
  windowConfirmClose: 'window:confirm-close',
  dialogOpenProject: 'dialog:open-project',
  cliPendingProject: 'cli:pending-project',
  agentsList: 'agents:list',
  settingsGet: 'settings:get',
  settingsSet: 'settings:set',
  recentsGet: 'recents:get',
  recentsAdd: 'recents:add',
  boardsLoad: 'boards:load',
  boardSave: 'board:save',
  cardSave: 'card:save',
  cardDelete: 'card:delete',
  workspacesSave: 'workspaces:save',
  ptyCreate: 'pty:create',
  ptyInput: 'pty:input',
  ptyResize: 'pty:resize',
  ptyKill: 'pty:kill',
  ptyData: 'pty:data',
  ptyExit: 'pty:exit',
  agentStart: 'agent:start',
  agentSend: 'agent:send',
  agentStop: 'agent:stop',
  agentDispose: 'agent:dispose',
  agentEvent: 'agent:event',
  agentComplete: 'agent:complete',
  contextBuild: 'context:build',
  gitWorktrees: 'git:worktrees',
  gitWorktreeAdd: 'git:worktree-add',
  gitWorktreeRemove: 'git:worktree-remove',
  gitIsRepo: 'git:is-repo',
  gitInit: 'git:init',
  gitClone: 'git:clone',
  gitBranches: 'git:branches',
  gitCreateBranch: 'git:create-branch',
  gitMergeBranch: 'git:merge-branch',
  gitDeleteBranch: 'git:delete-branch',
  projectConfigLoad: 'project-config:load',
  projectConfigSave: 'project-config:save',
  shellOpenPath: 'shell:open-path',
  shellShowItem: 'shell:show-item',
  systemTheme: 'system:theme',
  systemThemeChanged: 'system:theme-changed',
  systemLocale: 'system:locale',
  systemHasVscode: 'system:has-vscode',
  systemOpenInVscode: 'system:open-in-vscode',
  skillsList: 'skills:list',
  skillsSave: 'skills:save',
  skillsSetEnabled: 'skills:set-enabled',
  historyLoad: 'history:load',
  historySave: 'history:save',
  sessionsLoad: 'sessions:load',
  sessionsSave: 'sessions:save',
  notifyShow: 'notify:show',
  notifyClicked: 'notify:clicked',
  notificationsLoad: 'notifications:load',
  notificationsAdd: 'notifications:add',
  notificationsSave: 'notifications:save',
  filesTree: 'files:tree',
  fileRead: 'files:read',
  fileCreate: 'files:create',
  dirCreate: 'files:dir-create',
  fileRename: 'files:rename',
  fileDelete: 'files:delete',
  gitDiff: 'git:diff',
  menuAction: 'menu:action',
  menuOpenedProject: 'menu:opened-project',
  updaterCheck: 'updater:check',
  updaterDownload: 'updater:download',
  updaterInstall: 'updater:install',
  updaterSkip: 'updater:skip',
  updaterOpenReleases: 'updater:open-releases',
  updaterEvent: 'updater:event'
} as const

/** Actions the OS menu sends to the renderer. */
export type MenuAction = 'new-session' | 'new-terminal' | 'close-project'

/**
 * How an update can be applied on the current install:
 * - `auto`   — electron-updater downloads + installs in place (Windows NSIS,
 *   Linux AppImage).
 * - `manual` — we can only detect it; the user installs by hand (unsigned macOS,
 *   Linux `.deb`, WSL). We open the Releases page instead of downloading.
 */
export type UpdateCapability = 'auto' | 'manual'

/** One update-lifecycle event pushed from main to the renderer. */
export type UpdaterEvent =
  | { kind: 'available'; version: string; notes?: string; capability: UpdateCapability; releasesUrl: string }
  | { kind: 'progress'; percent: number }
  | { kind: 'downloaded'; version: string }
  | { kind: 'none' }
  | { kind: 'error'; message: string }

/** Result of the "open project folder" dialog. */
export interface OpenedProject {
  path: string
  name: string
  branch: string
  /** Whether the opened folder is a git repository (worktrees need this). */
  isGitRepo: boolean
}

/**
 * Outcome of a clone request. `canceled` (user dismissed the directory picker)
 * is distinguished from `error` (the clone actually failed) so the renderer can
 * show the real reason instead of a generic message.
 */
export type CloneResult =
  | { ok: true; project: OpenedProject }
  | { ok: false; canceled: true }
  | { ok: false; error: string }

/** Provider metadata plus live availability, as reported by the main process. */
export interface ProviderStatus {
  meta: AgentProviderMeta
  available: boolean
}

/** Start a structured (stream-json) agent session. `id` is the session id. */
export interface AgentStartSpec extends AgentSessionSpec {
  id: string
}

export interface AgentStartResult {
  ok: boolean
  error?: string
  /** True only when a fresh process was spawned (not a reattach to a live one). */
  spawned?: boolean
}

/** One streamed agent event, tagged with its session id, pushed to the renderer. */
export interface AgentEventPayload {
  id: string
  event: AgentEvent
}

/** An OS notification request from the renderer (a session needs attention). */
export interface NotifyRequest {
  title: string
  body: string
  /** The session it concerns; clicking the notification opens it. */
  sessionId: string
}

export type {
  AppSettings,
  RecentProject,
  WindowBounds,
  Board,
  BoardCard,
  ProjectData,
  WorkspaceRecord,
  PtyCreateResult,
  PtyCreateSpec,
  PtyDataEvent,
  PtyExitEvent,
  WorktreeInfo,
  Skill,
  SkillSave,
  AgentEvent,
  AgentSessionSpec,
  ContextBuildRequest,
  ContextBuildResult,
  FileNode,
  FileContent,
  DiffFile,
  ProjectConfig,
  MergeResult
}
