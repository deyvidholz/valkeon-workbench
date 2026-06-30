import type { FileTouch, SessionStatus, TranscriptLine } from '../domain'

/**
 * Identifier for an AI backend. `'claude'` today; future adapters add their own
 * (e.g. `'codex'`, `'gemini'`) without the UI knowing the difference.
 */
export type AgentProviderId = string

export interface AgentModel {
  /** Provider-local id, e.g. 'opus'. */
  id: string
  /** Display label, e.g. 'Opus 4.6'. */
  label: string
  /** Compact label shown in chips, e.g. 'Opus'. */
  short: string
}

/**
 * Static description of an agent provider. Lives in shared code so the renderer
 * can render model pickers / chips for *any* provider without importing adapters.
 */
export interface AgentProviderMeta {
  id: AgentProviderId
  /** Product name, e.g. 'Claude Code'. */
  name: string
  /** Vendor, e.g. 'Anthropic'. */
  vendor: string
  /** Material Symbols ligature used as the provider glyph. */
  icon: string
  /** CLI binary used to drive the provider, e.g. 'claude'. */
  cli: string
  models: AgentModel[]
  defaultModelId: string
  supportsWorktrees: boolean
  /** Whether the provider accepts a "skip permission prompts" launch flag. */
  supportsSkipPermissions: boolean
  /** The actual flag, e.g. '--dangerously-skip-permissions'. */
  skipPermissionsFlag?: string
}

/** Everything needed to start one agent session. Provider-neutral. */
export interface AgentSessionSpec {
  providerId: AgentProviderId
  modelId: string
  cwd: string
  skipPermissions?: boolean
  /**
   * Optional context to prepend to the *first* user turn (board card, linked
   * files, …). Assembled by the ContextProvider seam; provider-neutral text.
   */
  contextPreamble?: string
  /** Resume a prior CLI session by its id (replays the full prior context). */
  resumeId?: string
}

/** Events an adapter streams back while a session runs. */
export type AgentEvent =
  | { kind: 'line'; line: TranscriptLine }
  | { kind: 'status'; status: SessionStatus }
  | { kind: 'file'; file: FileTouch }
  /** Authoritative files-touched snapshot (from `git status`), replaces the list. */
  | { kind: 'files'; files: FileTouch[] }
  /**
   * Telemetry. `contextTokens` is the CURRENT context-window size (from a single
   * assistant message's usage) — NOT a sum across the agent loop. `costUsd` is the
   * cumulative session cost from the result event.
   */
  | { kind: 'usage'; contextTokens?: number; costUsd?: number }
  /** The model the CLI actually launched with (from its init event). */
  | { kind: 'model'; model: string }
  /** The CLI's own session id (for `--resume` later). */
  | { kind: 'session-id'; sessionId: string }
  /** A user turn finished (distinct from going idle on spawn). */
  | { kind: 'turn-complete' }
  | { kind: 'exit'; code: number | null }
