import { useState, type CSSProperties, type DragEvent, type MouseEvent, type ReactNode } from 'react'

interface HoverProps {
  as?: 'div' | 'span'
  style?: CSSProperties
  hover?: CSSProperties
  children?: ReactNode
  onClick?: (e: MouseEvent<HTMLElement>) => void
  onContextMenu?: (e: MouseEvent<HTMLElement>) => void
  title?: string
  className?: string
  draggable?: boolean
  onDragStart?: (e: DragEvent<HTMLElement>) => void
  onDragOver?: (e: DragEvent<HTMLElement>) => void
  onDrop?: (e: DragEvent<HTMLElement>) => void
}

/**
 * Replicates the design reference's `style-hover` behavior: merge `hover` over
 * `style` while the pointer is inside. Keeps the inline-style fidelity of the
 * prototype without needing a stylesheet rule per element.
 */
export function Hover({ as = 'div', style, hover, children, onClick, onContextMenu, title, className, draggable, onDragStart, onDragOver, onDrop }: HoverProps) {
  const [hovered, setHovered] = useState(false)
  const merged: CSSProperties = hovered && hover ? { ...style, ...hover } : style ?? {}
  const props = {
    className,
    title,
    onClick,
    onContextMenu,
    draggable,
    onDragStart,
    onDragOver,
    onDrop,
    style: merged,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false)
  }
  return as === 'span' ? <span {...props}>{children}</span> : <div {...props}>{children}</div>
}
