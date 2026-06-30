import type { WebContents } from 'electron'
import { IpcChannels } from '@shared/ipc'
import type { AgentStartResult } from '@shared/ipc'
import type { AgentProvider, AgentSessionHandle } from '@shared/agents/port'
import type { AgentSessionSpec } from '@shared/agents/types'

/**
 * Owns every live **structured** agent session (the stream-json driver), mirroring
 * {@link PtyManager} for interactive terminals. Handles are kept in main so a
 * session survives the renderer view unmounting; events are pushed to the
 * renderer, which accumulates them into its store (the renderer store is the
 * transcript's source of truth, so no main-side replay is needed on reattach).
 */
export class StructuredAgentManager {
  private handles = new Map<string, AgentSessionHandle>()

  constructor(
    private readonly getProvider: (providerId: string) => AgentProvider | undefined,
    private readonly getWebContents: () => WebContents | null
  ) {}

  count(): number {
    return this.handles.size
  }

  async start(id: string, spec: AgentSessionSpec): Promise<AgentStartResult> {
    // Already running (view remounted) — keep the live process, don't respawn.
    if (this.handles.has(id)) return { ok: true, spawned: false }

    const provider = this.getProvider(spec.providerId)
    if (!provider) return { ok: false, error: `Unknown provider: ${spec.providerId}` }
    if (!(await provider.isAvailable())) {
      return { ok: false, error: `${provider.meta.cli} CLI not found on PATH — install it to start a session.` }
    }

    try {
      const handle = await provider.start(spec, (event) => {
        this.getWebContents()?.send(IpcChannels.agentEvent, { id, event })
        if (event.kind === 'exit') this.handles.delete(id)
      })
      this.handles.set(id, handle)
      return { ok: true, spawned: true }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  }

  send(id: string, text: string): void {
    this.handles.get(id)?.send(text)
  }

  async stop(id: string): Promise<void> {
    const handle = this.handles.get(id)
    if (!handle) return
    this.handles.delete(id)
    await handle.stop()
  }

  dispose(id: string): void {
    const handle = this.handles.get(id)
    if (!handle) return
    this.handles.delete(id)
    handle.dispose()
  }

  killAll(): void {
    for (const handle of this.handles.values()) {
      try {
        handle.dispose()
      } catch {
        /* ignore */
      }
    }
    this.handles.clear()
  }
}
