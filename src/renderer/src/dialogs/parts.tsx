import type { CSSProperties, ReactNode } from 'react'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'

export function DialogHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: ReactNode }) {
  return (
    <div style={{ marginBottom: subtitle ? 16 : 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: subtitle ? 6 : 0 }}>
        <Icon name={icon} size={20} color="var(--accent)" />
        <span style={{ fontSize: 15, fontWeight: 600, color: '#ededf0' }}>{title}</span>
      </div>
      {subtitle && <div style={{ fontSize: 12.5, color: '#73737c' }}>{subtitle}</div>}
    </div>
  )
}

export const eyebrow: CSSProperties = { fontSize: 10.5, color: '#62626b', letterSpacing: '0.06em', marginBottom: 8 }

export const inputStyle: CSSProperties = {
  width: '100%',
  background: '#0a0a0d',
  border: '1px solid #1d1d23',
  borderRadius: 8,
  padding: '9px 11px',
  color: '#e8e8ee',
  fontSize: 12.5
}

export function segStyle(active: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 13px',
    borderRadius: 7,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    color: active ? '#0a1018' : '#9a9aa3',
    background: active ? 'var(--accent)' : '#0e0e12',
    border: `1px solid ${active ? 'transparent' : '#1c1c22'}`
  }
}

export function DialogActions({
  onCancel,
  onConfirm,
  confirmLabel,
  confirmIcon
}: {
  onCancel: () => void
  onConfirm: () => void
  confirmLabel: string
  confirmIcon?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 9 }}>
      <Hover as="span" onClick={onCancel} style={{ padding: '8px 14px', borderRadius: 8, color: '#9a9aa3', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }} hover={{ background: '#16161c' }}>
        Cancel
      </Hover>
      <Hover as="span" onClick={onConfirm} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 8, background: 'var(--accent)', color: '#0a1018', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }} hover={{ filter: 'brightness(1.08)' }}>
        {confirmIcon && <Icon name={confirmIcon} size={16} />}
        {confirmLabel}
      </Hover>
    </div>
  )
}
