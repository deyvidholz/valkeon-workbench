import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'
import type { ContextMenuItem } from '../types'

const PANEL: React.CSSProperties = {
  width: 210,
  background: 'var(--surface)',
  border: '1px solid var(--line-2)',
  borderRadius: 10,
  padding: 6,
  boxShadow: '0 16px 44px var(--shadow)',
  animation: 'fadein .12s ease'
}

function MenuItems({ items, close }: { items: ContextMenuItem[]; close: () => void }) {
  // Which submenu (by index) is currently open.
  const [openSub, setOpenSub] = useState<number | null>(null)
  return (
    <>
      {items.map((it, i) => {
        if (it.divider) return <div key={i} style={{ height: 1, background: 'var(--line)', margin: '5px 6px' }} />
        const hasSub = !!it.submenu?.length
        return (
          <div key={i} style={{ position: 'relative' }} onMouseEnter={() => setOpenSub(hasSub ? i : null)} onMouseLeave={() => hasSub && setOpenSub((s) => (s === i ? null : s))}>
            <Hover
              onClick={() => {
                if (it.disabled || hasSub) return
                close()
                it.onClick?.()
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 7, cursor: it.disabled ? 'default' : 'pointer', color: it.disabled ? 'var(--text-faint)' : it.danger ? 'var(--danger)' : 'var(--text-2)', fontSize: 12.5, opacity: it.disabled ? 0.6 : 1 }}
              hover={it.disabled ? {} : { background: 'var(--surface-2)' }}
            >
              <Icon name={it.icon} size={16} />
              <span style={{ flex: 1 }}>{it.label}</span>
              {hasSub && <Icon name="chevron_right" size={15} />}
            </Hover>
            {hasSub && openSub === i && (
              <div style={{ position: 'absolute', top: -6, left: '100%', marginLeft: 2, ...PANEL }}>
                <MenuItems items={it.submenu!} close={close} />
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

export function ContextMenu() {
  const menu = useStore((s) => s.contextMenu)
  const close = useStore((s) => s.closeContextMenu)
  if (!menu) return null

  const top = Math.min(menu.y, window.innerHeight - (menu.items.length * 36 + 24))
  const left = Math.min(menu.x, window.innerWidth - 224)

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 75 }}>
      <div onClick={close} onContextMenu={(e) => { e.preventDefault(); close() }} style={{ position: 'absolute', inset: 0 }} />
      <div style={{ position: 'absolute', top: Math.max(8, top), left: Math.max(8, left), ...PANEL }}>
        <MenuItems items={menu.items} close={close} />
      </div>
    </div>
  )
}
