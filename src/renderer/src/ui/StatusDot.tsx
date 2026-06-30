import type { CSSProperties } from 'react'
import type { SessionStatus } from '@shared/domain'

export const STATUS_COLOR: Record<SessionStatus, string> = {
  running: '#5cc98a',
  waiting: '#e0b15e',
  idle: '#6b6b74',
  done: '#5b9dd9'
}

export const STATUS_LABEL: Record<SessionStatus, string> = {
  running: 'Running',
  waiting: 'Waiting',
  idle: 'Idle',
  done: 'Done'
}

interface StatusDotProps {
  status: SessionStatus
  size?: number
  style?: CSSProperties
}

export function StatusDot({ status, size = 7, style }: StatusDotProps) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: STATUS_COLOR[status],
        display: 'inline-block',
        flexShrink: 0,
        ...(status === 'running' ? { animation: 'pulse 2s infinite' } : null),
        ...style
      }}
    />
  )
}
