/** A node in the project file tree (repo-relative paths). */
export interface FileNode {
  /** Repo-relative path (POSIX separators). */
  path: string
  name: string
  dir: boolean
  /** Present for directories; absent/lazy for large trees. */
  children?: FileNode[]
}

export interface FileContent {
  path: string
  content: string
  /** True if the file was too large / binary and not returned. */
  truncated?: boolean
}

export type DiffStatus = 'added' | 'modified' | 'deleted'

/** One file's before/after for the review diff editor. */
export interface DiffFile {
  path: string
  status: DiffStatus
  /** Content at the base (HEAD) — empty for added files. */
  oldContent: string
  /** Content in the working tree — empty for deleted files. */
  newContent: string
}
