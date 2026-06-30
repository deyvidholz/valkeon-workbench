import type { AgentProvider } from '@shared/agents/port'
import type { ProviderStatus } from '@shared/ipc'
import { ClaudeCodeAdapter } from './claude/ClaudeCodeAdapter'

/**
 * Runtime registry of agent adapters. The app is AI-agnostic: callers resolve
 * providers by id and depend only on the {@link AgentProvider} port. Register
 * additional adapters here to add new AI backends.
 */
const providers = new Map<string, AgentProvider>()

export function registerAgentProviders(): void {
  if (providers.size > 0) return
  const claude = new ClaudeCodeAdapter()
  providers.set(claude.meta.id, claude)
}

export function getProvider(id: string): AgentProvider | undefined {
  return providers.get(id)
}

export function listProviders(): AgentProvider[] {
  return [...providers.values()]
}

/** Metadata + live availability for every registered provider. */
export async function listProviderStatus(): Promise<ProviderStatus[]> {
  return Promise.all(
    listProviders().map(async (p) => ({
      meta: p.meta,
      available: await p.isAvailable().catch(() => false)
    }))
  )
}
