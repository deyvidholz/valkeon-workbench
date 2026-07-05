/** Kinds of in-app notifications (drives the icon + click behaviour). */
export type NotificationKind = 'session' | 'worktree-cleanup' | 'system'

/** What clicking a notification does. */
export type NotificationAction =
  | { type: 'open-session'; sessionId: string }
  | { type: 'open-worktree-cleanup'; runId: string }
  | { type: 'none' }

/**
 * One persisted in-app notification. Machine-local (like history) — stored per
 * project under userData, never in the repo.
 */
export interface NotificationRecord {
  id: string
  /** Workspace scope; null = project-wide (shown in every workspace). */
  wsId: string | null
  kind: NotificationKind
  title: string
  body: string
  /** Epoch ms. */
  createdAt: number
  viewed: boolean
  action: NotificationAction
}
