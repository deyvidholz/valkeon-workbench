import type { CSSProperties } from 'react'

interface IconProps {
  name: string
  size?: number
  color?: string
  title?: string
  className?: string
  style?: CSSProperties
}

/** A single Material Symbols Rounded glyph (ligature). */
export function Icon({ name, size = 18, color, title, className, style }: IconProps) {
  return (
    <span
      className={className ? `ms ${className}` : 'ms'}
      title={title}
      style={{ fontSize: size, color, ...style }}
    >
      {name}
    </span>
  )
}
