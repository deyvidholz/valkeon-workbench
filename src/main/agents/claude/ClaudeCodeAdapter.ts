import { execFile, spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { promisify } from 'node:util'
import { homedir } from 'node:os'
import { existsSync } from 'node:fs'
import type { AgentProvider, AgentSessionHandle } from '@shared/agents/port'
import type { AgentEvent, AgentSessionSpec } from '@shared/agents/types'
import { CLAUDE_PROVIDER } from '@shared/agents/providers'
import { getSpawnEnv } from '../../env'
import { waitForDir } from '../../fs-wait'
import { gitFileChanges } from '../../git/changes'

const exec = promisify(execFile)

function resolveCwd(cwd: string): string {
  return cwd && cwd !== '~' && existsSync(cwd) ? cwd : homedir()
}

/** Trim a long absolute path to its last two segments for the transcript. */
function shortenPath(p: string): string {
  const parts = p.split('/').filter(Boolean)
  return parts.length <= 2 ? p : `…/${parts.slice(-2).join('/')}`
}

/**
 * First concrete {@link AgentProvider} adapter: drives the Claude Code CLI in
 * **structured (stream-json) mode** so the app can read what the agent does —
 * files touched, token/cost usage, turn status — instead of an opaque TUI.
 *
 * Multi-turn: the CLI is launched with `--input-format stream-json`, kept alive,
 * and fed one JSON user message per `send()`. Its NDJSON stdout is parsed into
 * provider-neutral {@link AgentEvent}s.
 */
export class ClaudeCodeAdapter implements AgentProvider {
  readonly meta = CLAUDE_PROVIDER

  async isAvailable(): Promise<boolean> {
    try {
      await exec(process.platform === 'win32' ? 'where' : 'which', [this.meta.cli], {
        env: getSpawnEnv()
      })
      return true
    } catch {
      return false
    }
  }

  async start(
    spec: AgentSessionSpec,
    onEvent: (event: AgentEvent) => void
  ): Promise<AgentSessionHandle> {
    const env = getSpawnEnv() as NodeJS.ProcessEnv
    // A worktree session's cwd may still be being created by `git worktree add`;
    // wait for it so the agent doesn't silently boot in $HOME.
    await waitForDir(spec.cwd)
    const cwd = resolveCwd(spec.cwd)
    // Baseline for files-touched: only count files modified after this point, so
    // pre-existing working-tree changes the agent never touched don't show.
    const startedAt = Date.now()

    const args = [
      '--print',
      '--verbose',
      '--output-format',
      'stream-json',
      '--input-format',
      'stream-json',
      '--model',
      spec.modelId,
      // Edits flow automatically; full autonomy (incl. shell) needs the toggle.
      '--permission-mode',
      spec.skipPermissions ? 'bypassPermissions' : 'acceptEdits'
    ]
    // Resume a prior CLI session (replays its full context) when reopening a project.
    if (spec.resumeId) args.push('--resume', spec.resumeId)

    let child: ChildProcessWithoutNullStreams
    try {
      child = spawn(this.meta.cli, args, { cwd, env })
    } catch (err) {
      onEvent({ kind: 'line', line: { type: 'err', text: (err as Error).message } })
      onEvent({ kind: 'exit', code: 1 })
      throw err
    }

    let stdoutBuf = ''
    let pendingPreamble = spec.contextPreamble?.trim() || ''
    let disposed = false

    // Once disposed (e.g. a restart reusing this session id), forward nothing —
    // late buffered stdout / a final stderr flush / a delayed exit must not bleed
    // into the freshly-restarted session.
    const emit = (event: AgentEvent): void => {
      if (!disposed) onEvent(event)
    }

    // Spawned but awaiting the first user turn — ready, not yet working.
    emit({ kind: 'status', status: 'idle' })

    const handleObject = (obj: Record<string, unknown>): void => {
      const type = obj.type
      if (type === 'system' && obj.subtype === 'init') {
        if (typeof obj.model === 'string') emit({ kind: 'model', model: obj.model })
        if (typeof obj.session_id === 'string') emit({ kind: 'session-id', sessionId: obj.session_id })
        return
      }
      if (type === 'assistant') {
        const message = obj.message as { content?: unknown[]; usage?: Record<string, number> } | undefined
        // Each assistant message carries the usage for THAT single API call, so
        // its prompt size is the real current context-window usage (the result
        // event's usage instead sums every step incl. cache re-reads → inflated).
        const u = message?.usage
        if (u) {
          const ctx = (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0)
          if (ctx > 0) emit({ kind: 'usage', contextTokens: ctx })
        }
        for (const block of message?.content ?? []) {
          mapAssistantBlock(block as Record<string, unknown>, emit)
        }
        return
      }
      if (type === 'result') {
        if (typeof obj.total_cost_usd === 'number') emit({ kind: 'usage', costUsd: obj.total_cost_usd })
        // Surface a failed turn (max-turns / execution error) instead of masking
        // it as a clean completion.
        if (obj.is_error || (typeof obj.subtype === 'string' && obj.subtype !== 'success')) {
          const sub = typeof obj.subtype === 'string' ? obj.subtype.replace(/_/g, ' ') : 'error'
          emit({ kind: 'line', line: { type: 'err', text: `Turn ended with an error (${sub}).` } })
        }
        // Turn finished — go back to idle (nothing is being produced) and signal
        // turn completion separately (so a spawn-time idle doesn't look like one).
        // Snapshot the real files touched from git (catches Bash-written files too).
        emit({ kind: 'status', status: 'idle' })
        emit({ kind: 'turn-complete' })
        void gitFileChanges(cwd, startedAt).then((files) => emit({ kind: 'files', files }))
      }
    }

    const drainStdout = (chunk: string): void => {
      stdoutBuf += chunk
      let nl: number
      while ((nl = stdoutBuf.indexOf('\n')) >= 0) {
        const line = stdoutBuf.slice(0, nl).trim()
        stdoutBuf = stdoutBuf.slice(nl + 1)
        if (!line) continue
        try {
          handleObject(JSON.parse(line) as Record<string, unknown>)
        } catch {
          // A non-JSON line (e.g. a CLI warning) — surface it as a system note.
          emit({ kind: 'line', line: { type: 'sys', text: line } })
        }
      }
    }

    child.stdout.setEncoding('utf8')
    child.stdout.on('data', drainStdout)
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', (d: string) => {
      const t = d.trim()
      if (t) emit({ kind: 'line', line: { type: 'err', text: t } })
    })
    child.on('error', (err) => emit({ kind: 'line', line: { type: 'err', text: err.message } }))
    // EPIPE/ECONNRESET on stdin (writing to / ending a pipe whose child already
    // exited) is emitted asynchronously — without this listener Node escalates it
    // to an uncaughtException that crashes the whole main process.
    child.stdin.on('error', () => {})
    child.on('close', (code) => emit({ kind: 'exit', code }))

    const writeTurn = (text: string): void => {
      if (!child.stdin.writable) return
      const msg = { type: 'user', message: { role: 'user', content: [{ type: 'text', text }] } }
      try {
        child.stdin.write(`${JSON.stringify(msg)}\n`)
      } catch {
        /* stdin closed between the writable check and the write — ignore */
      }
    }

    return {
      id: '',
      send: (input: string) => {
        const trimmed = input.trim()
        if (!trimmed) return
        // The first turn carries any assembled context preamble.
        const full = pendingPreamble ? `${pendingPreamble}\n\n---\n\n${trimmed}` : trimmed
        pendingPreamble = ''
        emit({ kind: 'line', line: { type: 'user', text: trimmed } })
        emit({ kind: 'status', status: 'running' })
        writeTurn(full)
      },
      stop: async () => {
        try {
          child.stdin.end()
          child.kill('SIGINT')
        } catch {
          /* already gone */
        }
        await new Promise((r) => setTimeout(r, 400))
        try {
          child.kill('SIGTERM')
        } catch {
          /* already gone */
        }
      },
      dispose: () => {
        disposed = true
        try {
          child.stdin.end()
          child.kill('SIGTERM')
        } catch {
          /* already gone */
        }
      }
    }
  }
}

function mapAssistantBlock(block: Record<string, unknown>, emit: (e: AgentEvent) => void): void {
  if (block.type === 'text' && typeof block.text === 'string') {
    const text = block.text.trim()
    if (text) emit({ kind: 'line', line: { type: 'text', text } })
    return
  }
  if (block.type === 'tool_use') {
    const name = typeof block.name === 'string' ? block.name : 'tool'
    const input = (block.input as Record<string, unknown>) ?? {}
    // Different edit tools name their target differently (NotebookEdit uses
    // `notebook_path`), so check the known keys.
    const filePath =
      typeof input.file_path === 'string'
        ? input.file_path
        : typeof input.notebook_path === 'string'
          ? input.notebook_path
          : typeof input.path === 'string'
            ? input.path
            : undefined

    if (name === 'Bash' && typeof input.command === 'string') {
      emit({ kind: 'line', line: { type: 'cmd', text: input.command } })
      return
    }
    if (filePath) {
      // The transcript shows the activity; the authoritative files-touched list
      // comes from git on turn completion (see the result handler).
      emit({ kind: 'line', line: { type: 'tool', text: `${name} ${shortenPath(filePath)}` } })
      return
    }
    const detail = typeof input.pattern === 'string' ? ` ${input.pattern}` : ''
    emit({ kind: 'line', line: { type: 'tool', text: `${name}${detail}` } })
  }
}
