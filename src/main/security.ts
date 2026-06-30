import { realpathSync } from 'node:fs'
import type { GlobalStore } from './persistence/globalStore'

/**
 * Assert a renderer-supplied `repoPath` is a project the user actually opened
 * (present in recents). Stops a compromised renderer from using the board/git
 * IPC handlers as an arbitrary-filesystem primitive rooted anywhere.
 */
export function assertAllowedRepo(globalStore: GlobalStore, repoPath: string): string {
  let real: string
  try {
    real = realpathSync(repoPath)
  } catch {
    throw new Error('Unknown project path')
  }
  const allowed = new Set(
    globalStore.getRecents().map((r) => {
      try {
        return realpathSync(r.path)
      } catch {
        return r.path
      }
    })
  )
  if (!allowed.has(real)) throw new Error('Project path is not an opened project')
  return repoPath
}
