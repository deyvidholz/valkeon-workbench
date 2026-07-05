import type { AgentCompleteSpec, AgentCompleteResult, AgentEvent, AgentProviderMeta, AgentSessionSpec } from './types'

/**
 * Handle to one running agent session. The renderer never sees this directly —
 * it talks to the main process over IPC, which owns the handle.
 */
export interface AgentSessionHandle {
  readonly id: string
  /** Send a user message / input to the running agent. */
  send(input: string): void
  /** Gracefully stop the session (SIGINT, then terminate). */
  stop(): Promise<void>
  /** Tear down listeners and free resources. */
  dispose(): void
}

/**
 * Port (in the hexagonal sense): the contract every AI backend must satisfy.
 * Claude Code is the first adapter; additional providers implement this same
 * interface and are registered alongside it. No caller depends on a concrete
 * vendor — only on this port.
 */
export interface AgentProvider {
  readonly meta: AgentProviderMeta
  /** Is this provider usable on the current machine (e.g. CLI on PATH, logged in)? */
  isAvailable(): Promise<boolean>
  /** Start a session, streaming events back through `onEvent`. */
  start(spec: AgentSessionSpec, onEvent: (event: AgentEvent) => void): Promise<AgentSessionHandle>
  /**
   * One-shot completion: send a single prompt, resolve with the whole answer.
   * Optional — providers that can't do a non-interactive single call omit it, and
   * callers fall back gracefully.
   */
  complete?(spec: AgentCompleteSpec): Promise<AgentCompleteResult>
}
