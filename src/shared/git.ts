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
