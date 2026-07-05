import type { BoardColumn, Label } from '../types'

/**
 * No mock data. The app starts empty: open a real folder to get a workspace,
 * then create sessions, terminals, boards, and cards. Skills load from the
 * project's `.claude/skills`. History accumulates from real actions.
 */

export const BOARD_COLUMNS: BoardColumn[] = [
  { id: 'backlog', name: 'Backlog' },
  { id: 'todo', name: 'To Do' },
  { id: 'in-progress', name: 'In Progress' },
  { id: 'in-review', name: 'In Review' },
  { id: 'done', name: 'Done' }
]

/** 13-color label palette from the design tokens. */
export const LABEL_PALETTE = [
  '#5b9dd9', '#e07a6e', '#b89cf0', '#7dd99a', '#e0b15e', '#5fb4ad', '#9b8cf0',
  '#d98cc0', '#6cc0e0', '#e8a15b', '#8ad0a0', '#c98ce0', '#e07a9e'
]

/** Default labels seeded into a freshly created board. */
export const DEFAULT_LABELS: Label[] = [
  { id: 'feature', name: 'feature', color: '#5b9dd9' },
  { id: 'bug', name: 'bug', color: '#e07a6e' },
  { id: 'chore', name: 'chore', color: 'var(--text-dim)' },
  { id: 'ai', name: 'ai', color: '#e0b15e' }
]
