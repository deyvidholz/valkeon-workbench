import { simpleGit } from 'simple-git'
import type { WorktreeInfo, WorktreeStatus } from '@shared/git'
import type { MergeResult } from '@shared/project'

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

/** Local branch names (excludes detached HEAD entries). */
export async function listBranches(repoPath: string): Promise<string[]> {
  try {
    const out = await simpleGit(repoPath).raw(['branch', '--format=%(refname:short)'])
    return out
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s && !s.includes('HEAD'))
  } catch {
    return []
  }
}

/** Force-delete a local branch (used after merge / to discard). */
export async function deleteBranch(repoPath: string, branch: string): Promise<string[]> {
  await simpleGit(repoPath).raw(['branch', '-D', branch]).catch(() => {})
  return listBranches(repoPath)
}

/** Create (or switch to) a branch in the main checkout. */
export async function createBranch(repoPath: string, branch: string): Promise<void> {
  const git = simpleGit(repoPath)
  try {
    await git.raw(['switch', '-c', branch])
  } catch {
    // Branch may already exist → just switch to it.
    await git.raw(['switch', branch])
  }
}

/**
 * Merge `branch` into `target` in the main checkout. Commits any uncommitted work
 * on `branch` first (the agent is told not to commit), then checks out `target`
 * and merges. Aborts on conflict and reports it rather than leaving a mess.
 */
export async function mergeBranch(repoPath: string, branch: string, target: string): Promise<MergeResult> {
  const git = simpleGit(repoPath)
  try {
    // Commit any pending work sitting on `branch` (in the main checkout or its worktree).
    const wt = (await listWorktrees(repoPath)).find((w) => w.branch === branch)
    const workGit = wt ? simpleGit(wt.path) : git
    const st = await workGit.status()
    if (!st.isClean()) {
      await workGit.add(['-A'])
      await workGit.commit(`Valkeon: finish ${branch}`)
    }
    // Merge into target from the main checkout.
    await git.raw(['switch', target])
    await git.raw(['merge', '--no-ff', branch, '-m', `Merge ${branch} into ${target}`])
    return { ok: true }
  } catch (err) {
    const msg = (err as Error).message || 'Merge failed.'
    // Leave no half-merged state.
    await git.raw(['merge', '--abort']).catch(() => {})
    if (/conflict/i.test(msg)) return { ok: false, error: `Merge conflict merging ${branch} into ${target}. Resolve it manually.` }
    return { ok: false, error: msg.split('\n')[0].slice(0, 200) }
  }
}
