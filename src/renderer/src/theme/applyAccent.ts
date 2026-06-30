import { lighten, rgba } from '../lib/color'

/**
 * Push the accent and its derived variants onto :root as CSS variables.
 * `--accent-hi` = lighten 26%, `--accent-soft` = 13% α, `--accent-line` = 34% α,
 * `--accent-glow` = 24% α — exactly as the design reference derives them.
 */
export function applyAccent(accent: string): void {
  const root = document.documentElement.style
  root.setProperty('--accent', accent)
  root.setProperty('--accent-hi', lighten(accent, 0.26))
  root.setProperty('--accent-soft', rgba(accent, 0.13))
  root.setProperty('--accent-line', rgba(accent, 0.34))
  root.setProperty('--accent-glow', rgba(accent, 0.24))
}
