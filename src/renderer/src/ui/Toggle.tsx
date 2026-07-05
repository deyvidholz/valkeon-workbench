interface ToggleProps {
  on: boolean
  onClick?: () => void
  /** Amber styling for the destructive skip-permissions toggle. */
  danger?: boolean
}

export function Toggle({ on, onClick, danger }: ToggleProps) {
  return (
    <span
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      style={{
        width: 34,
        height: 20,
        borderRadius: 11,
        background: on ? (danger ? 'var(--warn)' : 'var(--accent)') : 'var(--surface-3)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background .15s',
        flexShrink: 0,
        display: 'inline-block'
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 16 : 2,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left .15s',
          boxShadow: '0 1px 2px var(--shadow)'
        }}
      />
    </span>
  )
}
