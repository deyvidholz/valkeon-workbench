import { useCallback, useRef, useState } from 'react'

interface ResizeHandleProps {
  /** Called with the pointer delta (px) since the drag started, throttled to frames. */
  onResize: (deltaX: number) => void
  /** Optional: reset to default width on double-click. */
  onReset?: () => void
  /** Which side of the handle the resized pane sits on (affects cursor only). */
  side?: 'left' | 'right'
}

/**
 * A thin vertical drag strip for resizing a side pane. Reports the pointer delta
 * from drag-start; the parent clamps and applies it. Highlights on hover/drag
 * with the accent line.
 */
export function ResizeHandle({ onResize, onReset, side = 'left' }: ResizeHandleProps) {
  const [active, setActive] = useState(false)
  const startX = useRef(0)

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      startX.current = e.clientX
      setActive(true)
      const move = (ev: PointerEvent): void => {
        const dx = ev.clientX - startX.current
        onResize(side === 'left' ? dx : -dx)
      }
      const up = (): void => {
        setActive(false)
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
    },
    [onResize, side]
  )

  return (
    <div
      onPointerDown={onPointerDown}
      onDoubleClick={onReset}
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        [side === 'left' ? 'right' : 'left']: -3,
        width: 6,
        cursor: 'col-resize',
        zIndex: 20,
        background: active ? 'var(--accent-line)' : 'transparent',
        transition: 'background .12s'
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--line-2)' }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
    />
  )
}
