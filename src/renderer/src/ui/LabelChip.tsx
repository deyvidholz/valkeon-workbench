import { rgba } from '../lib/color'
import { Icon } from './Icon'

interface LabelChipProps {
  name: string
  color: string
  onRemove?: () => void
}

export function LabelChip({ name, color, onRemove }: LabelChipProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        height: 18,
        boxSizing: 'border-box',
        fontFamily: "'Geist Mono', monospace",
        fontSize: 9.5,
        fontWeight: 600,
        color,
        background: rgba(color, 0.13),
        padding: '0 6px',
        borderRadius: 5,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap'
      }}
    >
      {name}
      {onRemove && (
        <span
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          style={{ cursor: 'pointer', opacity: 0.65, display: 'flex' }}
        >
          <Icon name="close" size={12} />
        </span>
      )}
    </span>
  )
}
