import { ipcMain } from 'electron'
import { promises as fs } from 'node:fs'
import { join, resolve, dirname, basename, sep, posix } from 'node:path'
import { simpleGit } from 'simple-git'
import { IpcChannels } from '@shared/ipc'
import type { FileNode, FileContent, DiffFile, DiffStatus } from '@shared/files'
import type { GlobalStore } from '../persistence/globalStore'
import { assertAllowedRepo } from '../security'
import { assertInside } from '../persistence/paths'

// Directories never shown in the IDE tree: VCS/tooling internals, heavy build
// output, and — per product requirement — Valkeon's own `.valkeon` state.
const HIDDEN_DIRS = new Set(['.git', '.valkeon', 'node_modules', 'out', 'dist', '.vite', '.next', '.turbo', '.cache', '.DS_Store'])
const MAX_NODES = 8000
const MAX_DEPTH = 12
const MAX_FILE_BYTES = 1024 * 1024 // 1 MB — bigger files aren't shown/diffed

const toPosix = (p: string): string => p.split(sep).join('/')

function looksBinary(buf: Buffer): boolean {
  const n = Math.min(buf.length, 4096)
  for (let i = 0; i < n; i++) if (buf[i] === 0) return true
  return false
}

async function buildTree(repoRoot: string, relDir: string, depth: number, budget: { n: number }): Promise<FileNode[]> {
  if (depth > MAX_DEPTH || budget.n >= MAX_NODES) return []
  let entries: import('node:fs').Dirent[]
  try {
    entries = await fs.readdir(join(repoRoot, relDir), { withFileTypes: true })
  } catch {
    return []
  }
  const dirs: FileNode[] = []
  const files: FileNode[] = []
  for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (budget.n >= MAX_NODES) break
    if (HIDDEN_DIRS.has(e.name)) continue
    const rel = relDir ? posix.join(relDir, e.name) : e.name
    if (e.isDirectory()) {
      budget.n++
      dirs.push({ path: rel, name: e.name, dir: true, children: await buildTree(repoRoot, rel, depth + 1, budget) })
    } else if (e.isFile()) {
      budget.n++
      files.push({ path: rel, name: e.name, dir: false })
    }
  }
  return [...dirs, ...files]
}

// App/VCS state the user must not mutate through the IDE.
const PROTECTED = ['.git', '.valkeon']
const isProtected = (rel: string): boolean => {
  const p = toPosix(rel)
  return PROTECTED.some((d) => p === d || p.startsWith(`${d}/`))
}

/**
 * Resolve a NEW path for writing: its parent must exist inside the (canonical)
 * repo, and the leaf can't escape. Returns the absolute target.
 */
async function resolveForWrite(repo: string, relPath: string): Promise<string> {
  if (isProtected(relPath)) throw new Error('protected path')
  const realRepo = await fs.realpath(repo)
  const abs = resolve(realRepo, relPath)
  const realParent = await fs.realpath(dirname(abs))
  const target = join(realParent, basename(abs))
  return assertInside(realRepo, target)
}

/** File tree + read + review-diff + create/rename/delete for the IDE. `repoPath` untrusted → allowlisted. */
export function registerFilesIpc(globalStore: GlobalStore): void {
  const guard = (repoPath: string): string => assertAllowedRepo(globalStore, repoPath)

  ipcMain.handle(IpcChannels.filesTree, async (_e, repoPath: string): Promise<FileNode[]> => {
    const repo = guard(repoPath)
    return buildTree(repo, '', 0, { n: 0 })
  })

  ipcMain.handle(IpcChannels.fileRead, async (_e, repoPath: string, relPath: string): Promise<FileContent> => {
    const repo = guard(repoPath)
    try {
      // Canonicalize the BASE too — assertInside is lexical, and on macOS the repo
      // path itself often traverses a symlink (/tmp→/private/tmp), so comparing a
      // realpath'd target against a non-canonical base would reject every file.
      const realRepo = await fs.realpath(repo)
      const abs = assertInside(realRepo, await fs.realpath(assertInside(realRepo, resolve(realRepo, relPath))))
      const stat = await fs.stat(abs)
      if (!stat.isFile() || stat.size > MAX_FILE_BYTES) return { path: relPath, content: '', truncated: true }
      const buf = await fs.readFile(abs)
      if (looksBinary(buf)) return { path: relPath, content: '', truncated: true }
      return { path: relPath, content: buf.toString('utf8') }
    } catch {
      return { path: relPath, content: '', truncated: true }
    }
  })

  ipcMain.handle(IpcChannels.gitDiff, async (_e, repoPath: string): Promise<DiffFile[]> => {
    const repo = guard(repoPath)
    const realRepo = await fs.realpath(repo).catch(() => repo)
    const git = simpleGit(repo)
    let status
    try {
      status = await git.status()
    } catch {
      return []
    }
    const out: DiffFile[] = []
    for (const f of status.files.slice(0, 200)) {
      const path = toPosix(f.path)
      if (path.startsWith('.valkeon/') || path.startsWith('.git/')) continue
      const code = `${f.index}${f.working_dir}`.trim()
      const st: DiffStatus = /A|\?/.test(code) ? 'added' : /D/.test(code) ? 'deleted' : 'modified'
      let oldContent = ''
      let newContent = ''
      if (st !== 'added') {
        oldContent = await git.show([`HEAD:${path}`]).catch(() => '')
        if (oldContent.length > MAX_FILE_BYTES || oldContent.includes('\u0000')) oldContent = ''
      }
      if (st !== 'deleted') {
        try {
          // Same symlink hardening as fileRead — don't dereference an in-repo
          // symlink to leak an out-of-repo file into the diff.
          const abs = assertInside(realRepo, await fs.realpath(join(repo, f.path)))
          const buf = await fs.readFile(abs)
          newContent = buf.length <= MAX_FILE_BYTES && !looksBinary(buf) ? buf.toString('utf8') : ''
        } catch {
          newContent = ''
        }
      }
      out.push({ path, status: st, oldContent, newContent })
    }
    return out
  })

  ipcMain.handle(IpcChannels.fileCreate, async (_e, repoPath: string, relPath: string): Promise<boolean> => {
    const target = await resolveForWrite(guard(repoPath), relPath)
    await fs.writeFile(target, '', { flag: 'wx' }) // wx → fail if it already exists
    return true
  })

  ipcMain.handle(IpcChannels.dirCreate, async (_e, repoPath: string, relPath: string): Promise<boolean> => {
    const target = await resolveForWrite(guard(repoPath), relPath)
    await fs.mkdir(target, { recursive: false })
    return true
  })

  ipcMain.handle(IpcChannels.fileRename, async (_e, repoPath: string, oldRel: string, newRel: string): Promise<boolean> => {
    const repo = guard(repoPath)
    if (isProtected(oldRel) || isProtected(newRel)) throw new Error('protected path')
    const realRepo = await fs.realpath(repo)
    const from = assertInside(realRepo, await fs.realpath(resolve(realRepo, oldRel)))
    const to = await resolveForWrite(repo, newRel)
    await fs.rename(from, to)
    return true
  })

  ipcMain.handle(IpcChannels.fileDelete, async (_e, repoPath: string, relPath: string): Promise<boolean> => {
    const repo = guard(repoPath)
    if (isProtected(relPath)) throw new Error('protected path')
    const realRepo = await fs.realpath(repo)
    const abs = assertInside(realRepo, await fs.realpath(resolve(realRepo, relPath)))
    if (abs === realRepo) throw new Error('cannot delete the repo root')
    await fs.rm(abs, { recursive: true, force: true })
    return true
  })
}
