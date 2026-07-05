import type { CSSProperties, ReactNode } from 'react'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'

export function DialogHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: ReactNode }) {
  return (
    <div style={{ marginBottom: subtitle ? 16 : 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: subtitle ? 6 : 0 }}>
        <Icon name={icon} size={20} color="var(--accent)" />
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{title}</span>
      </div>
      {subtitle && <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{subtitle}</div>}
    </div>
  )
}

export const eyebrow: CSSProperties = { fontSize: 10.5, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 8 }

export const inputStyle: CSSProperties = {
  width: '100%',
  background: 'var(--bg)',
  border: '1px solid var(--line)',
  borderRadius: 8,
  padding: '9px 11px',
  color: 'var(--text)',
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
    color: active ? 'var(--on-accent)' : 'var(--text-dim)',
    background: active ? 'var(--accent)' : 'var(--surface)',
    border: `1px solid ${active ? 'transparent' : 'var(--line)'}`
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
      <Hover as="span" onClick={onCancel} style={{ padding: '8px 14px', borderRadius: 8, color: 'var(--text-dim)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }} hover={{ background: 'var(--surface-2)' }}>
        Cancel
      </Hover>
      <Hover as="span" onClick={onConfirm} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 8, background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }} hover={{ filter: 'brightness(1.08)' }}>
        {confirmIcon && <Icon name={confirmIcon} size={16} />}
        {confirmLabel}
      </Hover>
    </div>
  )
}
