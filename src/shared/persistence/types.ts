/**
 * Durable, shareable board content — the tier that lives in the repo under
 * `.valkeon/`. Vendor-neutral and type-only (no runtime values) so it is safe to
 * import from both processes and trivial to unit-test.
 *
 * NOTE: runtime/ephemeral fields (live agent flag, the bound session id, the
 * high-frequency activity timeline) are deliberately NOT here — those belong to
 * the local store, never the repo.
 */

export type BoardScope = 'feature' | 'epic' | 'release' | 'chore'

export type ColumnId = 'backlog' | 'todo' | 'in-progress' | 'in-review' | 'done'

export interface BoardColumn {
  id: ColumnId
  name: string
}

export interface Label {
  id: string
  name: string
  color: string
}

/** Durable git linkage. The live session binding is resolved locally, not here. */
export interface CardLink {
  branch: string | null
  worktree: string | null
}

export interface CardAttachment {
  name: string
  size: number
  path?: string
}

export interface BoardCard {
  id: string
  code: number
  column: ColumnId
  /** Fractional index key for intra-column ordering (conflict-free reorders). */
  order: string
  title: string
  body: string
  /** Label ids referencing the board's label palette. */
  labels: string[]
  link: CardLink
  attachments: CardAttachment[]
}

export interface Board {
  id: string
  name: string
  scope: BoardScope
  baseBranch: string
  columns: BoardColumn[]
  labels: Label[]
  cards: BoardCard[]
}

export interface WorkspaceRecord {
  id: string
  name: string
  useWorktree: boolean
  boardIds: string[]
}

/** Everything a project's board store loads/saves. */
export interface ProjectData {
  workspaces: WorkspaceRecord[]
  boards: Board[]
}
