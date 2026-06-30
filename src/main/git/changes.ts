import { simpleGit } from 'simple-git'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import type { FileTouch } from '@shared/domain'

// App-managed directories — Valkeon's own skill installs and board state live
// here; they're never the agent's task output, so they'd just be noise.
const IGNORED = ['.claude/', '.valkeon/']

/**
 * The files THIS session changed in `cwd`, from `git status` — accurate
 * regardless of how they were changed (Write, Edit, a Bash heredoc, …), with
 * repo-relative paths and a git-style change summary. Returns [] for non-repos.
 *
 * `git status` reports the whole working tree, which includes files dirtied
 * before this session started. `since` (the session's start epoch ms) filters to
 * files modified at/after that point, so a pre-existing dirty file the agent
 * never touched doesn't show up as "files touched".
 */
export async function gitFileChanges(cwd: string, since?: number): Promise<FileTouch[]> {
  try {
    const git = simpleGit(cwd)
    const status = await git.status()
    const changed = status.files.map((f) => f.path).filter((p) => !IGNORED.some((d) => p.startsWith(d)))
    if (!changed.length) return []

    // Line deltas for tracked changes vs HEAD (empty repo → no HEAD → skip).
    const numstat = new Map<string, string>()
    try {
      const diff = await git.diffSummary(['HEAD'])
      for (const f of diff.files) {
        if (!('binary' in f && f.binary)) {
          const ins = (f as { insertions?: number }).insertions ?? 0
          const del = (f as { deletions?: number }).deletions ?? 0
          numstat.set(f.file, `+${ins} −${del}`)
        }
      }
    } catch {
      /* no HEAD yet */
    }

    const out: FileTouch[] = []
    for (const path of changed.slice(0, 80)) {
      let mtimeMs = Infinity
      let size = 0
      let isFile = true
      try {
        const stat = await fs.stat(join(cwd, path))
        mtimeMs = stat.mtimeMs
        size = stat.size
        isFile = stat.isFile()
      } catch {
        // deleted file — keep it (a deletion the agent made), mtime unknown
      }
      // Only files this session actually touched.
      if (since != null && mtimeMs < since) continue

      let c = numstat.get(path)
      if (!c) {
        // Untracked/new — count lines if it's a small text file.
        if (isFile && size < 512 * 1024) {
          try {
            const content = await fs.readFile(join(cwd, path), 'utf8')
            c = `+${content ? content.split('\n').length : 0}`
          } catch {
            c = 'new'
          }
        } else {
          c = isFile ? 'new' : 'deleted'
        }
      }
      out.push({ p: path, c })
    }
    return out
  } catch {
    return []
  }
}
