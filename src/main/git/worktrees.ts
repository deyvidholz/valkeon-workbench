import { simpleGit } from 'simple-git'
import type { WorktreeInfo, WorktreeStatus } from '@shared/git'

async function statusOf(dir: string): Promise<WorktreeStatus> {
  try {
    const st = await simpleGit(dir).status()
    if (!st.isClean()) return 'dirty'
    return st.ahead > 0 ? 'ahead' : 'clean'
  } catch {
    return 'unknown'
  }
}

export async function listWorktrees(repoPath: string): Promise<WorktreeInfo[]> {
  let raw: string
  try {
    raw = await simpleGit(repoPath).raw(['worktree', 'list', '--porcelain'])
  } catch {
    return []
  }

  const blocks = raw
    .split('\n\n')
    .map((b) => b.trim())
    .filter(Boolean)

  const list: WorktreeInfo[] = []
  for (const block of blocks) {
    const info: WorktreeInfo = {
      path: '',
      branch: '',
      head: '',
      bare: false,
      detached: false,
      isMain: false,
      status: 'unknown'
    }
    for (const line of block.split('\n')) {
      if (line.startsWith('worktree ')) info.path = line.slice('worktree '.length)
      else if (line.startsWith('HEAD ')) info.head = line.slice('HEAD '.length)
      else if (line.startsWith('branch ')) info.branch = line.slice('branch '.length).replace('refs/heads/', '')
      else if (line === 'bare') info.bare = true
      else if (line === 'detached') info.detached = true
    }
    if (!info.path) continue
    info.isMain = list.length === 0
    info.status = info.bare ? 'unknown' : await statusOf(info.path)
    list.push(info)
  }
  return list
}

export async function addWorktree(
  repoPath: string,
  branch: string,
  dir: string
): Promise<WorktreeInfo[]> {
  const git = simpleGit(repoPath)
  try {
    await git.raw(['worktree', 'add', '-b', branch, dir])
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    // Only fall back to attaching when the branch already exists; otherwise the
    // real failure (bad path, no commits, …) must surface.
    if (!/already exists/i.test(msg)) throw err
    await git.raw(['worktree', 'add', dir, branch])
  }
  return listWorktrees(repoPath)
}

export async function removeWorktree(repoPath: string, dir: string): Promise<WorktreeInfo[]> {
  await simpleGit(repoPath).raw(['worktree', 'remove', '--force', dir])
  return listWorktrees(repoPath)
}

/**
 * Clone `url` into `parentDir/<name>`.
 *
 * Hardened for a GUI process: git can't show a credential or host-key prompt
 * here, so we disable interactive prompts (they'd hang forever) and bound the
 * operation with a timeout so a stalled/slow clone surfaces as an error instead
 * of an IPC promise that never resolves.
 */
export async function cloneRepo(url: string, parentDir: string, name: string): Promise<void> {
  const env = {
    ...process.env,
    GIT_TERMINAL_PROMPT: '0',
    GIT_SSH_COMMAND: 'ssh -oBatchMode=yes -oStrictHostKeyChecking=accept-new'
  }
  await simpleGit(parentDir, { timeout: { block: 120_000 } })
    .env(env)
    .clone(url, name)
}

export async function isGitRepo(repoPath: string): Promise<boolean> {
  try {
    const out = await simpleGit(repoPath).raw(['rev-parse', '--is-inside-work-tree'])
    return out.trim() === 'true'
  } catch {
    return false
  }
}

/** `git init` the folder with `main` as the default branch. Returns the branch. */
export async function initRepo(repoPath: string): Promise<string> {
  const git = simpleGit(repoPath)
  try {
    await git.raw(['init', '-b', 'main'])
  } catch {
    // Older git without `-b`: init then point HEAD at main.
    await git.raw(['init'])
    try {
      await git.raw(['symbolic-ref', 'HEAD', 'refs/heads/main'])
    } catch {
      /* leave default branch */
    }
  }
  return 'main'
}
