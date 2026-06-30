import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { Icon } from '../../ui/Icon'
import { Hover } from '../../ui/Hover'
import type { WorktreeStatus } from '@shared/git'

const STATUS_COLOR: Record<WorktreeStatus, string> = {
  clean: '#5cc98a',
  dirty: '#e0b15e',
  ahead: '#5b9dd9',
  unknown: '#6b6b74'
}

const basename = (p: string): string => p.replace(/[/\\]+$/, '').split(/[/\\]/).pop() ?? p

/**
 * Lets the developer pick which worktree new sessions & terminals open in.
 * Only shown when the active workspace uses worktrees AND there's more than one
 * worktree to choose between — otherwise there's nothing to switch.
 */
export function WorktreeSwitcher() {
  const workspaces = useStore((s) => s.workspaces)
  const activeWorkspaceId = useStore((s) => s.activeWorkspaceId)
  const worktrees = useStore((s) => s.worktrees)
  const activeWorktreePath = useStore((s) => s.activeWorktreePath)
  const setActiveWorktree = useStore((s) => s.setActiveWorktree)
  const [open, setOpen] = useState(false)

  const active = workspaces.find((w) => w.id === activeWorkspaceId)
  if (!active?.useWorktree || worktrees.length < 2) return null

  const isCurrent = (wtPath: string, isMain: boolean): boolean =>
    activeWorktreePath === wtPath || (!activeWorktreePath && isMain)
  const current = worktrees.find((w) => isCurrent(w.path, w.isMain)) ?? worktrees[0]

  const select = (path: string, isMain: boolean): void => {
    setActiveWorktree(isMain ? null : path)
    setOpen(false)
  }

  return (
    <div style={{ padding: '6px 12px 8px', position: 'relative', borderTop: '1px solid #15151a' }}>
      <Hover
        onClick={() => setOpen((o) => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 9, background: '#0e0e12', border: '1px solid #1c1c22', cursor: 'pointer' }}
        hover={{ border: '1px solid #27272f' }}
      >
        <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(184,156,240,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="account_tree" size={16} color="#b89cf0" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: '#62626b', letterSpacing: '0.06em' }}>WORKTREE</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e4e4ea', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'Geist Mono', monospace" }}>
            {current.branch || basename(current.path)}
          </div>
        </div>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLOR[current.status], flexShrink: 0 }} title={current.status} />
        <Icon name="unfold_more" size={18} color="#56565e" />
      </Hover>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 29 }} />
          <div style={{ position: 'absolute', bottom: 52, left: 12, right: 12, zIndex: 30, background: '#101014', border: '1px solid #25252d', borderRadius: 11, padding: 6, boxShadow: '0 18px 50px rgba(0,0,0,0.55)', maxHeight: 280, overflowY: 'auto' }}>
            {worktrees.map((w) => {
              const on = isCurrent(w.path, w.isMain)
              return (
                <Hover
                  key={w.path}
                  onClick={() => select(w.path, w.isMain)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, cursor: 'pointer', background: on ? '#15151b' : 'transparent' }}
                  hover={{ background: '#17171c' }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[w.status], flexShrink: 0 }} title={w.status} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: '#e4e4ea', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'Geist Mono', monospace" }}>
                      {w.branch || basename(w.path)}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#6b6b74', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {w.isMain ? 'main checkout' : basename(w.path)}
                    </div>
                  </div>
                  {w.isMain && <Icon name="home" size={14} color="#74747d" title="Main checkout" />}
                  {on && <Icon name="check" size={16} color="#b89cf0" />}
                </Hover>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
