export type WorktreeStatus = 'clean' | 'dirty' | 'ahead' | 'unknown'

export interface WorktreeInfo {
  path: string
  branch: string
  head: string
  bare: boolean
  detached: boolean
  isMain: boolean
  status: WorktreeStatus
}

export interface WorktreeAddRequest {
  repoPath: string
  branch: string
  /** Absolute or repo-relative directory for the new working copy. */
  dir: string
}

export interface WorktreeCommit {
  hash: string
  subject: string
  /** Human relative time, e.g. "2 days ago". */
  relative: string
}

/** Rich per-worktree detail for the details dialog + cleanup analysis. */
export interface WorktreeDetails {
  path: string
  branch: string
  head: string
  headSubject: string
  /** Paths of files with uncommitted changes. */
  dirtyFiles: string[]
  /** Commits on this branch not on the base branch. */
  ahead: number
  /** Commits on the base branch not here. */
  behind: number
  /** Whether this branch is fully contained in the base (safe to delete). */
  mergedIntoBase: boolean
  recentCommits: WorktreeCommit[]
  lastCommitRelative: string | null
}
