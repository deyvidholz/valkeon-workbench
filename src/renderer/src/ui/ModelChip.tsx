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
        background: '#16161d',
        color: '#9a9aa3',
        border: '1px solid #232330',
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
