import { ipcMain } from 'electron'
import { dirname, isAbsolute, resolve, sep } from 'node:path'
import { IpcChannels } from '@shared/ipc'
import type { ProjectConfig } from '@shared/project'
import type { GlobalStore } from '../persistence/globalStore'
import { assertAllowedRepo } from '../security'
import { addWorktree, initRepo, isGitRepo, listWorktrees, removeWorktree, listBranches, createBranch, mergeBranch, deleteBranch } from './worktrees'
import { ensureLocalExcludes } from './localExclude'
import { ensureBuiltinSkills } from '../skills/reader'
import { loadProjectConfig, saveProjectConfig } from '../persistence/projectConfigStore'

/** A worktree dir must live inside the project or its parent directory. */
function assertSafeWorktreeDir(repoPath: string, dir: string): string {
  const target = isAbsolute(dir) ? resolve(dir) : resolve(repoPath, dir)
  const parent = resolve(dirname(repoPath))
  const repo = resolve(repoPath)
  const inside = (root: string): boolean => target === root || target.startsWith(root + sep)
  if (!inside(parent) && !inside(repo)) {
    throw new Error('Worktree path must be inside the project or its parent directory')
  }
  return target
}

function assertSafeBranch(branch: string): string {
  if (!branch || branch.length > 200 || branch.startsWith('-') || branch.includes('..') || /[\s~^:?*[\\\x00]/.test(branch)) {
    throw new Error(`Invalid branch name: ${JSON.stringify(branch)}`)
  }
  return branch
}

export function registerGitIpc(globalStore: GlobalStore): void {
  const guard = (repoPath: string): string => assertAllowedRepo(globalStore, repoPath)

  ipcMain.handle(IpcChannels.gitWorktrees, (_e, repoPath: string) =>
    listWorktrees(guard(repoPath))
  )
  ipcMain.handle(IpcChannels.gitWorktreeAdd, async (_e, repoPath: string, branch: string, dir: string) => {
    const repo = guard(repoPath)
    const safeDir = assertSafeWorktreeDir(repo, dir)
    const trees = await addWorktree(repo, assertSafeBranch(branch), safeDir)
    // A worktree is a separate checkout, so the project's (uncommitted) vw-* skills
    // aren't there — install them so agents in the worktree can use them.
    await ensureBuiltinSkills(safeDir).catch(() => {})
    return trees
  })
  ipcMain.handle(IpcChannels.gitWorktreeRemove, (_e, repoPath: string, dir: string) => {
    const repo = guard(repoPath)
    return removeWorktree(repo, assertSafeWorktreeDir(repo, dir))
  })
  ipcMain.handle(IpcChannels.gitIsRepo, (_e, repoPath: string) => isGitRepo(guard(repoPath)))
  ipcMain.handle(IpcChannels.gitInit, async (_e, repoPath: string) => {
    const repo = guard(repoPath)
    const res = await initRepo(repo)
    // A brand-new repo: exclude Valkeon's machine-local files right away.
    await ensureLocalExcludes(repo, ['.valkeon/']).catch(() => {})
    return res
  })
  ipcMain.handle(IpcChannels.gitBranches, (_e, repoPath: string) => listBranches(guard(repoPath)))
  ipcMain.handle(IpcChannels.gitCreateBranch, (_e, repoPath: string, branch: string) =>
    createBranch(guard(repoPath), assertSafeBranch(branch))
  )
  ipcMain.handle(IpcChannels.gitMergeBranch, (_e, repoPath: string, branch: string, target: string) =>
    mergeBranch(guard(repoPath), assertSafeBranch(branch), assertSafeBranch(target))
  )
  ipcMain.handle(IpcChannels.gitDeleteBranch, (_e, repoPath: string, branch: string) =>
    deleteBranch(guard(repoPath), assertSafeBranch(branch))
  )
  ipcMain.handle(IpcChannels.projectConfigLoad, (_e, repoPath: string) => loadProjectConfig(guard(repoPath)))
  ipcMain.handle(IpcChannels.projectConfigSave, (_e, repoPath: string, config: ProjectConfig) =>
    saveProjectConfig(guard(repoPath), config)
  )
}
