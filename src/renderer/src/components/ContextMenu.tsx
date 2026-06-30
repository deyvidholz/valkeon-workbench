import { useStore } from '../store/useStore'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'

export function ContextMenu() {
  const menu = useStore((s) => s.contextMenu)
  const close = useStore((s) => s.closeContextMenu)
  if (!menu) return null

  const top = Math.min(menu.y, window.innerHeight - (menu.items.length * 36 + 24))
  const left = Math.min(menu.x, window.innerWidth - 224)

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 75 }}>
      <div onClick={close} onContextMenu={(e) => { e.preventDefault(); close() }} style={{ position: 'absolute', inset: 0 }} />
      <div style={{ position: 'absolute', top: Math.max(8, top), left: Math.max(8, left), width: 210, background: '#101014', border: '1px solid #25252d', borderRadius: 10, padding: 6, boxShadow: '0 16px 44px rgba(0,0,0,0.5)', animation: 'fadein .12s ease' }}>
        {menu.items.map((it, i) => (
          <Hover key={i} onClick={() => { close(); it.onClick() }} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 7, cursor: 'pointer', color: it.danger ? '#e07a6e' : '#cbcbd2', fontSize: 12.5 }} hover={{ background: '#17171c' }}>
            <Icon name={it.icon} size={16} />
            {it.label}
          </Hover>
        ))}
      </div>
    </div>
  )
}
