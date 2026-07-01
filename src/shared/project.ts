/** How a Start-task isolates its work. */
export type TaskStrategy = 'worktree' | 'branch' | 'current'

/**
 * Per-project settings, stored in the repo at `.valkeon/config.json` so they're
 * shareable/committable. The app uses these to decide how tasks branch and where
 * finished work merges.
 */
export interface ProjectConfig {
  /** Target branch that finished work merges into (e.g. `main`). */
  baseBranch: string
  /** Default isolation for Start-task: a new worktree, a new branch, or the current branch. */
  taskStrategy: TaskStrategy
}

export const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  baseBranch: 'main',
  taskStrategy: 'branch'
}

/** Result of a merge attempt. */
export interface MergeResult {
  ok: boolean
  /** Present on failure — a short reason (conflict, dirty tree, …). */
  error?: string
}
