import { existsSync } from 'node:fs'

/**
 * Wait (up to `timeoutMs`) for a directory to appear. A worktree-backed session
 * sets its cwd to a worktree path that another async path (`git worktree add`)
 * is still creating; without this the agent/shell would boot in the wrong place
 * (resolveCwd silently falls back to $HOME). Returns once the dir exists or the
 * timeout elapses — callers then resolve the cwd as usual.
 */
export async function waitForDir(dir: string | undefined, timeoutMs = 8000): Promise<void> {
  if (!dir || dir === '~' || existsSync(dir)) return
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 100))
    if (existsSync(dir)) return
  }
}
