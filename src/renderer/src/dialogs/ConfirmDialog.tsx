import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'

export function ConfirmDialog() {
  const { t } = useTranslation()
  const confirm = useStore((s) => s.confirm)
  const close = useStore((s) => s.closeConfirm)
  if (!confirm) return null

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--scrim)' }}>
      <div onClick={close} style={{ position: 'absolute', inset: 0 }} />
      <div style={{ position: 'relative', width: 384, background: 'var(--bg)', border: '1px solid var(--line-2)', borderRadius: 13, padding: 20, boxShadow: '0 30px 80px var(--shadow)', animation: 'fadein .15s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 11 }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 9, background: 'color-mix(in srgb, var(--danger) 13%, transparent)', color: 'var(--danger)' }}>
            <Icon name="warning" size={19} />
          </span>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{confirm.title}</span>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.55, marginBottom: 18 }}>{confirm.message}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 9 }}>
          <Hover as="span" onClick={close} style={{ padding: '8px 14px', borderRadius: 8, color: 'var(--text-2)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', background: 'var(--surface-2)', border: '1px solid var(--line-2)' }} hover={{ background: 'var(--surface-3)' }}>
            {t('confirmDialog.cancel', 'Cancel')}
          </Hover>
          <Hover
            as="span"
            onClick={() => {
              confirm.onConfirm()
              close()
            }}
            style={{ padding: '8px 15px', borderRadius: 8, background: 'var(--danger)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
            hover={{ filter: 'brightness(1.08)' }}
          >
            {confirm.confirmLabel}
          </Hover>
        </div>
      </div>
    </div>
  )
}
