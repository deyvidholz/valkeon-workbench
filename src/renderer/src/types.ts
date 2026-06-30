import type { FileTouch, SessionStatus, TokenUsage, TranscriptLine } from '@shared/domain'
import type { AgentProviderId } from '@shared/agents/types'
import type { ContextSourceId } from '@shared/context'

/**
 * How a session is driven. `interactive` = raw agent TUI in an xterm (full CLI
 * feel). `structured` = headless stream-json driver: our own transcript + live
 * telemetry (files, tokens, status) + opt-in context injection.
 */
export type SessionMode = 'interactive' | 'structured'
import type { RecentProject } from '@shared/persistence/global'
import type {
  Board as SharedBoard,
  BoardCard as SharedCard,
  BoardColumn,
  BoardScope,
  ColumnId,
  Label
} from '@shared/persistence/types'

export type { BoardColumn, BoardScope, ColumnId, Label }

export type ViewId =
  | 'launcher'
  | 'workspace'
  | 'session'
  | 'terminals'
  | 'board'
  | 'worktrees'
  | 'history'
  | 'skills'
  | 'settings'

export type LayoutMode = 'grid' | 'tabs' | 'split'

export interface Workspace {
  id: string
  name: string
  useWorktree: boolean
}

export interface Session {
  id: string
  wsId: string
  name: string
  providerId: AgentProviderId
  status: SessionStatus
  model: string
  modelId: string
  branch: string
  worktree: string | null
  duration: string
  task: string
  tokens: TokenUsage
  files: FileTouch[]
  lines: TranscriptLine[]
  /** Live sessions drive a real PTY (an xterm); seed/demo sessions render their static transcript. */
  live: boolean
  /** cwd for the agent CLI (worktree path, project path, or home). */
  cwd?: string
  skipPermissions?: boolean
  /** Epoch ms the session started (for the "Running for" timer). */
  startedAt: number
  /** First message sent to the agent once it spawns (e.g. a Start-task prompt). */
  initialPrompt?: string
  /** Interactive (xterm) vs structured (stream-json driver). Defaults interactive. */
  mode: SessionMode
  /** Structured only: cumulative cost in USD reported by the CLI. */
  costUsd?: number
  /** Structured only: context sources to inject into the first turn. */
  contextSources?: ContextSourceId[]
  /** Structured only: the card this session is working (for context assembly). */
  cardId?: string
  boardId?: string
  /** Structured only: accumulated time spent actually producing (status === running). */
  activeMs?: number
  /** Structured only: epoch ms the current run started, while running. */
  runStartedAt?: number
  /** Structured only: the CLI's own session id, used to `--resume` on reopen. */
  claudeSessionId?: string
}

export interface Terminal {
  id: string
  wsId: string
  name: string
  cwd: string
  running: boolean
}

export type Recent = Pick<RecentProject, 'name' | 'path' | 'sessions' | 'branch'>

export interface Project {
  name: string
  path: string
  branch: string
  /** Whether the folder is a git repo. Undefined for recents until re-checked. */
  isGitRepo?: boolean
}

export interface ActivityEntry {
  icon: string
  text: string
  time: string
  /** Semantic icon color; defaults to muted gray when absent. */
  color?: string
}

/** Runtime board card: durable fields + live agent/session/activity. */
export interface Card extends SharedCard {
  sessionId: string | null
  agent: boolean
  activity: ActivityEntry[]
}

export interface Board extends Omit<SharedBoard, 'cards'> {
  wsId: string
  cards: Card[]
}

export type { Skill } from '@shared/skills'

export type HistoryKind = 'session' | 'terminal' | 'board' | 'card' | 'label' | 'worktree' | 'skill'

/** A registered activity-log entry. Every meaningful action appends one. */
export interface HistoryEntry {
  id: string
  wsId: string
  kind: HistoryKind
  icon: string
  color?: string
  label: string
  detail: string
  ts: number
  target?: { kind: 'session' | 'board' | 'card'; id: string; boardId?: string }
}

export interface ConfirmConfig {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
}

export interface ContextMenuItem {
  label: string
  icon: string
  danger?: boolean
  onClick: () => void
}
