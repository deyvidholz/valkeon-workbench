import type { AppSettings } from '@shared/persistence/global'
import type { BoardColumn, Label } from '@shared/persistence/types'
import { CLAUDE_PROVIDER, DEFAULT_PROVIDER_ID } from '@shared/agents/providers'

export const DEFAULT_SETTINGS: AppSettings = {
  userName: '',
  accent: '#e0574d',
  defaultProviderId: DEFAULT_PROVIDER_ID,
  defaultModelId: CLAUDE_PROVIDER.defaultModelId,
  terminalFontSize: 12,
  restoreSessions: true,
  confirmBeforeClosingRunning: true,
  launchAtLogin: false,
  boardStorage: 'repo'
}

export const DEFAULT_COLUMNS: BoardColumn[] = [
  { id: 'backlog', name: 'Backlog' },
  { id: 'todo', name: 'To Do' },
  { id: 'in-progress', name: 'In Progress' },
  { id: 'in-review', name: 'In Review' },
  { id: 'done', name: 'Done' }
]

/** The 13-color label palette from the design tokens. */
export const BOARD_LABEL_COLORS = [
  '#5b9dd9', '#e07a6e', '#b89cf0', '#7dd99a', '#e0b15e', '#5fb4ad', '#9b8cf0',
  '#d98cc0', '#6cc0e0', '#e8a15b', '#8ad0a0', '#c98ce0', '#e07a9e'
]

export const DEFAULT_LABELS: Label[] = [
  { id: 'feature', name: 'feature', color: '#5b9dd9' },
  { id: 'bug', name: 'bug', color: '#e07a6e' },
  { id: 'ai', name: 'ai', color: '#b89cf0' }
]
