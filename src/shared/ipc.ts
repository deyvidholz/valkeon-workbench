import type { AgentProviderMeta } from './agents/types'
import type { AppSettings, RecentProject, WindowBounds } from './persistence/global'
import type { Board, BoardCard, ProjectData, WorkspaceRecord } from './persistence/types'
import type { PtyCreateResult, PtyCreateSpec, PtyDataEvent, PtyExitEvent } from './pty'
import type { WorktreeInfo } from './git'
import type { Skill, SkillSave } from './skills'
import type { AgentEvent, AgentSessionSpec } from './agents/types'
import type { ContextBuildRequest, ContextBuildResult } from './context'
import type { FileNode, FileContent, DiffFile } from './files'

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
  contextBuild: 'context:build',
  gitWorktrees: 'git:worktrees',
  gitWorktreeAdd: 'git:worktree-add',
  gitWorktreeRemove: 'git:worktree-remove',
  gitIsRepo: 'git:is-repo',
  gitInit: 'git:init',
  gitClone: 'git:clone',
  shellOpenPath: 'shell:open-path',
  skillsList: 'skills:list',
  skillsSave: 'skills:save',
  historyLoad: 'history:load',
  historySave: 'history:save',
  sessionsLoad: 'sessions:load',
  sessionsSave: 'sessions:save',
  notifyShow: 'notify:show',
  notifyClicked: 'notify:clicked',
  filesTree: 'files:tree',
  fileRead: 'files:read',
  gitDiff: 'git:diff',
  menuAction: 'menu:action',
  menuOpenedProject: 'menu:opened-project'
} as const

/** Actions the OS menu sends to the renderer. */
export type MenuAction = 'new-session' | 'new-terminal' | 'close-project'

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
  DiffFile
}
