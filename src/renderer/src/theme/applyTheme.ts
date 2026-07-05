import type { ResolvedTheme, ThemePref } from '@shared/persistence/global'

/**
 * Resolve a theme preference against the current OS appearance.
 * `system` follows the OS; `dark`/`light` are explicit.
 */
export function resolveTheme(pref: ThemePref, systemIsDark: boolean): ResolvedTheme {
  if (pref === 'system') return systemIsDark ? 'dark' : 'light'
  return pref
}

/**
 * Apply a resolved theme by toggling `data-theme` on the document root. The
 * light token overrides in global.css key off `:root[data-theme='light']`;
 * dark is the default so we clear the attribute for it.
 */
export function applyTheme(resolved: ResolvedTheme): void {
  const root = document.documentElement
  if (resolved === 'light') root.dataset.theme = 'light'
  else delete root.dataset.theme
}
