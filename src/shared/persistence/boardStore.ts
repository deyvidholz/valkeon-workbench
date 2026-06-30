import type { Board, BoardCard, ProjectData, WorkspaceRecord } from './types'

export type BoardStorageMode = 'repo' | 'local'

/**
 * Port (hexagonal) for board persistence. The app depends only on this contract;
 * `RepoFileBoardStore` writes human-readable files under `.valkeon/` (committed
 * with the repo), `LocalBoardStore` keeps everything in the per-user app-data
 * dir. "Repo vs local" is therefore a config choice, not a rewrite — exactly the
 * same swappable-adapter shape as the AI provider layer.
 */
export interface BoardStore {
  readonly mode: BoardStorageMode
  /** Load all workspaces + boards for the project (empty result if none yet). */
  load(): Promise<ProjectData>
  /** Persist the workspace records (names, worktree flag, board membership). */
  saveWorkspaces(workspaces: WorkspaceRecord[]): Promise<void>
  /** Create or replace a board's definition (columns, labels, scope, base branch). */
  saveBoard(board: Board): Promise<void>
  /** Create or replace a single card. */
  saveCard(boardId: string, card: BoardCard): Promise<void>
  /** Remove a card. */
  deleteCard(boardId: string, cardId: string): Promise<void>
}
