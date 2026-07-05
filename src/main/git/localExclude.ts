import { promises as fs } from 'node:fs'
import { join } from 'node:path'

const BEGIN = '# >>> Valkeon (local, not committed) >>>'
const END = '# <<< Valkeon <<<'

/**
 * Resolve the real git info dir for a repo. `.git` is normally a directory, but
 * for linked worktrees / submodules it's a file: `gitdir: <path>`. In that case
 * the shared `info/` lives under the common dir, so we point there.
 */
async function gitInfoDir(repoPath: string): Promise<string | null> {
  const dotGit = join(repoPath, '.git')
  try {
    const st = await fs.stat(dotGit)
    if (st.isDirectory()) return join(dotGit, 'info')
    if (st.isFile()) {
      const txt = await fs.readFile(dotGit, 'utf8')
      const m = txt.match(/gitdir:\s*(.+)\s*/)
      if (!m) return null
      const gitdir = m[1].trim()
      const abs = gitdir.startsWith('/') ? gitdir : join(repoPath, gitdir)
      // For a worktree, commondir points at the main .git; excludes belong there.
      try {
        const common = (await fs.readFile(join(abs, 'commondir'), 'utf8')).trim()
        return join(common.startsWith('/') ? common : join(abs, common), 'info')
      } catch {
        return join(abs, 'info')
      }
    }
  } catch {
    return null
  }
  return null
}

/**
 * Idempotently ensure each pattern is present in `.git/info/exclude` — a
 * per-clone, uncommitted gitignore. Used to hide machine-local Valkeon artifacts
 * (`.valkeon/`, …) without touching the repo's committed `.gitignore`. No-ops on
 * a non-git folder.
 */
export async function ensureLocalExcludes(repoPath: string, patterns: string[]): Promise<void> {
  if (!repoPath || !patterns.length) return
  const infoDir = await gitInfoDir(repoPath)
  if (!infoDir) return
  const file = join(infoDir, 'exclude')

  let current = ''
  try {
    current = await fs.readFile(file, 'utf8')
  } catch {
    /* no exclude file yet — we'll create it */
  }

  // Which patterns are missing (anywhere in the file, so we don't duplicate)?
  const lines = new Set(current.split(/\r?\n/).map((l) => l.trim()))
  const missing = patterns.filter((p) => !lines.has(p.trim()))
  if (!missing.length) return

  let next = current
  if (current.includes(BEGIN) && current.includes(END)) {
    // Append inside the existing managed block.
    next = current.replace(END, `${missing.join('\n')}\n${END}`)
  } else {
    const block = `${BEGIN}\n${missing.join('\n')}\n${END}\n`
    next = current && !current.endsWith('\n') ? `${current}\n${block}` : `${current}${block}`
  }

  await fs.mkdir(infoDir, { recursive: true }).catch(() => {})
  await fs.writeFile(file, next, 'utf8').catch(() => {})
}
