import type { ResolvedTheme } from '@shared/persistence/global'
import { useStore } from '../store/useStore'
import { resolveTheme } from './applyTheme'

/**
 * The concrete theme currently in effect (`system` resolved against the OS).
 * Reactive — components re-render when the preference or OS appearance changes.
 * Use for canvas-style consumers (Monaco, xterm, mermaid) that can't read CSS vars.
 */
export function useResolvedTheme(): ResolvedTheme {
  const pref = useStore((s) => s.themePref)
  const sys = useStore((s) => s.systemTheme)
  return resolveTheme(pref, sys === 'dark')
}
