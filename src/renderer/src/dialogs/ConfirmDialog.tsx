import { useStore } from '../store/useStore'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'

export function ConfirmDialog() {
  const confirm = useStore((s) => s.confirm)
  const close = useStore((s) => s.closeConfirm)
  if (!confirm) return null

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,4,6,0.66)' }}>
      <div onClick={close} style={{ position: 'absolute', inset: 0 }} />
      <div style={{ position: 'relative', width: 384, background: '#0d0d11', border: '1px solid #25252d', borderRadius: 13, padding: 20, boxShadow: '0 30px 80px rgba(0,0,0,0.65)', animation: 'fadein .15s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 11 }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 9, background: 'rgba(224,122,110,0.13)', color: '#e07a6e' }}>
            <Icon name="warning" size={19} />
          </span>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#ededf0' }}>{confirm.title}</span>
        </div>
        <div style={{ fontSize: 12.5, color: '#9a9aa3', lineHeight: 1.55, marginBottom: 18 }}>{confirm.message}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 9 }}>
          <Hover as="span" onClick={close} style={{ padding: '8px 14px', borderRadius: 8, color: '#cbcbd2', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', background: '#16161c', border: '1px solid #232329' }} hover={{ background: '#1c1c22' }}>
            Cancel
          </Hover>
          <Hover
            as="span"
            onClick={() => {
              confirm.onConfirm()
              close()
            }}
            style={{ padding: '8px 15px', borderRadius: 8, background: '#e0574d', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
            hover={{ filter: 'brightness(1.08)' }}
          >
            {confirm.confirmLabel}
          </Hover>
        </div>
      </div>
    </div>
  )
}
