import type { CSSProperties } from 'react'

interface ModelChipProps {
  label: string
  style?: CSSProperties
}

/** Monospace model pill, e.g. "Sonnet". */
export function ModelChip({ label, style }: ModelChipProps) {
  return (
    <span
      style={{
        fontFamily: "'Geist Mono', monospace",
        fontSize: 10,
        fontWeight: 500,
        padding: '2px 6px',
        borderRadius: 5,
        background: 'var(--surface-2)',
        color: 'var(--text-dim)',
        border: '1px solid var(--line-2)',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        ...style
      }}
    >
      {label}
    </span>
  )
}
