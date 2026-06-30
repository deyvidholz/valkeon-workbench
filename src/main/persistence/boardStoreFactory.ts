import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { app } from 'electron'
import type { BoardStorageMode, BoardStore } from '@shared/persistence/boardStore'
import { RepoFileBoardStore } from './repoFileBoardStore'
import { LocalBoardStore } from './localBoardStore'

// Cache one store instance per (mode, repo) so its internal write-serialization
// queue spans IPC calls — every handler invocation must NOT get a fresh instance,
// or concurrent read-modify-writes lose updates.
const cache = new Map<string, BoardStore>()

/**
 * Resolve the board store for a project. `mode` comes from settings
 * (`boardStorage`), so flipping repo↔local is a one-line config change with no
 * call-site impact — the adapter pattern in action.
 */
export function createBoardStore(mode: BoardStorageMode, repoPath: string): BoardStore {
  const cacheKey = `${mode}:${repoPath}`
  const existing = cache.get(cacheKey)
  if (existing) return existing

  let store: BoardStore
  if (mode === 'repo') {
    store = new RepoFileBoardStore(repoPath)
  } else {
    const key = createHash('sha256').update(repoPath).digest('hex').slice(0, 16)
    const file = join(app.getPath('userData'), 'projects', key, 'board.json')
    store = new LocalBoardStore(file)
  }
  cache.set(cacheKey, store)
  return store
}
