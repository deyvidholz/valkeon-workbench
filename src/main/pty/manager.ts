import { homedir } from 'node:os'
import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import * as pty from 'node-pty'
import type { WebContents } from 'electron'
import { IpcChannels } from '@shared/ipc'
import type { PtyCreateResult, PtyCreateSpec } from '@shared/pty'
import { getProviderMeta } from '@shared/agents/providers'
import { getSpawnEnv } from '../env'
import { waitForDir } from '../fs-wait'

function resolveCwd(cwd?: string): string {
  if (cwd && cwd !== '~' && existsSync(cwd)) return cwd
  return homedir()
}

function which(cmd: string, env: NodeJS.ProcessEnv): string | null {
  try {
    const out = execFileSync(process.platform === 'win32' ? 'where' : 'which', [cmd], { env })
      .toString()
      .trim()
    return out.split('\n')[0] || null
  } catch {
    return null
  }
}

/**
 * Owns every live pseudo-terminal. A terminal spawns the user's shell; a session
 * spawns the agent provider's CLI (Claude today) in the chosen cwd/worktree.
 * Output streams to the renderer over IPC as it arrives — real-time, byte-for-byte.
 */
const BUFFER_CAP = 256 * 1024

export class PtyManager {
  private procs = new Map<string, pty.IPty>()
  /** Rolling output per pty so a reattached view can repaint after a view switch. */
  private buffers = new Map<string, string>()
  /** Ids whose process already exited (so we never respawn on a late reattach). */
  private exited = new Map<string, number>()

  constructor(private readonly getWebContents: () => WebContents | null) {}

  count(): number {
    return this.procs.size
  }

  async create(spec: PtyCreateSpec): Promise<PtyCreateResult> {
    // Already running (e.g. the view was remounted) — replay the backlog so the
    // reattached terminal repaints, and keep the same process alive.
    if (this.procs.has(spec.id)) {
      const backlog = this.buffers.get(spec.id)
      if (backlog) this.getWebContents()?.send(IpcChannels.ptyData, { id: spec.id, data: backlog })
      return { ok: true }
    }

    // Already exited — replay its final output and re-emit the exit. NEVER spawn
    // a fresh agent/shell under the same id (that would silently start a new one).
    if (this.exited.has(spec.id)) {
      const backlog = this.buffers.get(spec.id)
      if (backlog) this.getWebContents()?.send(IpcChannels.ptyData, { id: spec.id, data: backlog })
      this.getWebContents()?.send(IpcChannels.ptyExit, { id: spec.id, exitCode: this.exited.get(spec.id) ?? 0 })
      return { ok: true }
    }

    const env = getSpawnEnv() as { [key: string]: string }

    let file: string
    const args: string[] = []

    if (spec.kind === 'session') {
      const meta = getProviderMeta(spec.providerId || 'claude')
      const cli = meta?.cli || 'claude'
      const resolved = which(cli, env)
      if (!resolved) {
        return { ok: false, error: `${cli} CLI not found on PATH — install it to start a session.` }
      }
      file = resolved
      if (spec.modelId) args.push('--model', spec.modelId)
      if (spec.skipPermissions && meta?.skipPermissionsFlag) args.push(meta.skipPermissionsFlag)
      // A worktree session's cwd may still be being created — wait for it so the
      // agent doesn't silently boot in $HOME.
      await waitForDir(spec.cwd)
    } else {
      file =
        spec.shell ||
        process.env.SHELL ||
        (process.platform === 'win32' ? 'powershell.exe' : '/bin/bash')
    }

    const cwd = resolveCwd(spec.cwd)
    let proc: pty.IPty
    try {
      proc = pty.spawn(file, args, {
        name: 'xterm-256color',
        cols: spec.cols && spec.cols > 0 ? spec.cols : 80,
        rows: spec.rows && spec.rows > 0 ? spec.rows : 24,
        cwd,
        env
      })
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }

    this.procs.set(spec.id, proc)
    this.buffers.set(spec.id, '')
    proc.onData((data) => {
      const next = (this.buffers.get(spec.id) ?? '') + data
      this.buffers.set(spec.id, next.length > BUFFER_CAP ? next.slice(next.length - BUFFER_CAP) : next)
      this.getWebContents()?.send(IpcChannels.ptyData, { id: spec.id, data })
    })
    proc.onExit(({ exitCode }) => {
      this.procs.delete(spec.id)
      this.exited.set(spec.id, exitCode)
      this.getWebContents()?.send(IpcChannels.ptyExit, { id: spec.id, exitCode })
    })
    return { ok: true, spawned: true }
  }

  write(id: string, data: string): void {
    this.procs.get(id)?.write(data)
  }

  resize(id: string, cols: number, rows: number): void {
    const proc = this.procs.get(id)
    if (proc && cols > 0 && rows > 0) {
      try {
        proc.resize(cols, rows)
      } catch {
        // window collapsed to 0; ignore
      }
    }
  }

  kill(id: string): void {
    const proc = this.procs.get(id)
    this.buffers.delete(id)
    this.exited.delete(id)
    if (!proc) return
    try {
      proc.kill()
    } catch {
      // already gone
    }
    this.procs.delete(id)
  }

  killAll(): void {
    for (const proc of this.procs.values()) {
      try {
        proc.kill()
      } catch {
        // ignore
      }
    }
    this.procs.clear()
    this.buffers.clear()
    this.exited.clear()
  }
}
