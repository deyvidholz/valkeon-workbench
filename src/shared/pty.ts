/** A pseudo-terminal drives either a plain shell (terminal) or an agent CLI (session). */
export type PtyKind = 'terminal' | 'session'

export interface PtyCreateSpec {
  id: string
  kind: PtyKind
  cwd?: string
  /** Terminal only: override the shell (defaults to $SHELL). */
  shell?: string
  /** Session only: which agent provider's CLI to launch. */
  providerId?: string
  /** Session only: provider model id (passed as a CLI flag). */
  modelId?: string
  /** Session only: append the provider's skip-permissions flag. */
  skipPermissions?: boolean
  /** Optional first line to send once the process spawns (e.g. a Start-task prompt). */
  initialInput?: string
  cols?: number
  rows?: number
}

export interface PtyCreateResult {
  ok: boolean
  error?: string
  /** True only when a brand-new process was spawned (not a reattach/replay). */
  spawned?: boolean
}

export interface PtyDataEvent {
  id: string
  data: string
}

export interface PtyExitEvent {
  id: string
  exitCode: number
}
