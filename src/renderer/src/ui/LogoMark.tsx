interface LogoMarkProps {
  /** Glyph size, matching the old <Icon name="terminal"/> size it replaces. */
  size?: number
  color?: string
}

/**
 * The Valkeon mark: a terminal-style **V_** — the "V" (for Valkeon) takes the
 * place of the classic `>` prompt, keeping the blinking cursor. Drop-in for the
 * old `<Icon name="terminal" />` used inside the logo square.
 */
export function LogoMark({ size = 30, color = '#0a1018' }: LogoMarkProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        fontFamily: "'Geist Mono', monospace",
        fontWeight: 800,
        fontSize: size * 0.92,
        lineHeight: 1,
        color,
        letterSpacing: '-0.04em',
        userSelect: 'none'
      }}
    >
      V
      <span style={{ marginLeft: size * 0.04, animation: 'blink 1.15s steps(1, start) infinite' }}>_</span>
    </span>
  )
}
