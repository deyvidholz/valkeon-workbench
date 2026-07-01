import { promises as fs } from 'node:fs'
import { join } from 'node:path'

export const VALKEON_DIR = '.valkeon'

const GITIGNORE = `# Valkeon Workbench
# Board content in this directory IS meant to be committed (it travels with the repo).
# These subfolders hold machine-local, possibly-sensitive state — keep them out of git.
local/
cache/
skills-disabled/
`

/**
 * Ensure `.valkeon/` exists with a starter `.gitignore`. Called lazily on the
 * first write — opening a project never writes into the user's repo on its own.
 * Returns the absolute `.valkeon/` path.
 */
export async function ensureValkeonScaffold(repoPath: string): Promise<string> {
  const dir = join(repoPath, VALKEON_DIR)
  await fs.mkdir(dir, { recursive: true })
  const gitignore = join(dir, '.gitignore')
  try {
    await fs.access(gitignore)
  } catch {
    await fs.writeFile(gitignore, GITIGNORE, 'utf8')
  }
  return dir
}
