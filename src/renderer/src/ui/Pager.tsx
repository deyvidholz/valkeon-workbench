import { Hover } from './Hover'

interface PagerProps {
  page: number
  pageCount: number
  setPage: (p: number) => void
}

const btn = (disabled: boolean): React.CSSProperties => ({
  width: 28,
  height: 28,
  borderRadius: 7,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#121216',
  border: '1px solid #232329',
  color: disabled ? '#3f3f47' : '#cbcbd2',
  cursor: disabled ? 'default' : 'pointer',
  fontFamily: "'Material Symbols Rounded'",
  fontSize: 18
})

/** Page navigation for the 4-up terminal/session grids. */
export function Pager({ page, pageCount, setPage }: PagerProps) {
  if (pageCount <= 1) return null
  const atStart = page === 0
  const atEnd = page === pageCount - 1
  return (
    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <Hover as="span" onClick={atStart ? undefined : () => setPage(page - 1)} style={btn(atStart)} hover={atStart ? undefined : { background: '#17171c' }}>
        chevron_left
      </Hover>
      <span style={{ fontSize: 12, color: '#73737c', fontFamily: "'Geist Mono', monospace" }}>
        {page + 1} / {pageCount}
      </span>
      <Hover as="span" onClick={atEnd ? undefined : () => setPage(page + 1)} style={btn(atEnd)} hover={atEnd ? undefined : { background: '#17171c' }}>
        chevron_right
      </Hover>
    </div>
  )
}
