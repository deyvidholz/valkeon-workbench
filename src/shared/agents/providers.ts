import type { AgentProviderMeta } from './types'

/**
 * Registry of provider *metadata* (vendor-neutral, safe to import in the
 * renderer). The matching runtime adapters live in `src/main/agents/`.
 *
 * To support another AI later: add its metadata here and register an adapter
 * in `src/main/agents/registry.ts`. The UI picks it up automatically.
 */

export const CLAUDE_PROVIDER: AgentProviderMeta = {
  id: 'claude',
  name: 'Claude Code',
  vendor: 'Anthropic',
  icon: 'auto_awesome',
  cli: 'claude',
  // Labels are version-less on purpose: the CLI's `--model <alias>` always
  // resolves to the current model for that tier, so a hard-coded version (e.g.
  // "Sonnet 4.6") just goes stale when the CLI ships a newer one.
  models: [
    { id: 'opus', label: 'Opus', short: 'Opus' },
    { id: 'sonnet', label: 'Sonnet', short: 'Sonnet' },
    { id: 'haiku', label: 'Haiku', short: 'Haiku' }
  ],
  defaultModelId: 'sonnet',
  supportsWorktrees: true,
  supportsSkipPermissions: true,
  skipPermissionsFlag: '--dangerously-skip-permissions'
}

export const PROVIDER_META: readonly AgentProviderMeta[] = [CLAUDE_PROVIDER]

export const DEFAULT_PROVIDER_ID = CLAUDE_PROVIDER.id

export function getProviderMeta(id: string): AgentProviderMeta | undefined {
  return PROVIDER_META.find((p) => p.id === id)
}

/** Resolve a model's display info for a provider, falling back to the raw id. */
export function getModelMeta(providerId: string, modelId: string) {
  const provider = getProviderMeta(providerId)
  return provider?.models.find((m) => m.id === modelId)
}
