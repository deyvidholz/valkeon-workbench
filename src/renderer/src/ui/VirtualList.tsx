import { useRef, type ReactNode, type CSSProperties } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

interface VirtualListProps<T> {
  items: T[]
  /** Fixed or estimated row height in px. */
  rowHeight: number
  renderRow: (item: T, index: number) => ReactNode
  /** Stable key per item; defaults to index. */
  itemKey?: (item: T, index: number) => string | number
  overscan?: number
  style?: CSSProperties
  className?: string
}

/**
 * A windowed list — only the rows in (and near) the viewport are mounted, so
 * thousands of notifications/history entries stay smooth. Thin wrapper over
 * @tanstack/react-virtual so callers don't repeat the scroll-container plumbing.
 */
export function VirtualList<T>({ items, rowHeight, renderRow, itemKey, overscan = 8, style, className }: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan
  })

  return (
    <div ref={parentRef} className={className} style={{ overflowY: 'auto', minHeight: 0, ...style }}>
      <div style={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
        {virtualizer.getVirtualItems().map((v) => {
          const item = items[v.index]
          return (
            <div
              key={itemKey ? itemKey(item, v.index) : v.index}
              data-index={v.index}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${v.start}px)` }}
            >
              {renderRow(item, v.index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
