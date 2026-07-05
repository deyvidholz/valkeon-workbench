import { WorkspaceSwitcher } from './WorkspaceSwitcher'
import { NavList } from './NavList'
import { SessionList } from './SessionList'
import { TerminalList } from './TerminalList'
import { WorktreeSwitcher } from './WorktreeSwitcher'
import { AccountRow } from './AccountRow'
import { useStore } from '../../store/useStore'
import { ResizeHandle } from '../../ui/ResizeHandle'

export function Sidebar() {
  const width = useStore((s) => s.sidebarWidth)
  const setSidebarWidth = useStore((s) => s.setSidebarWidth)
  const persistPaneWidths = useStore((s) => s.persistPaneWidths)
  return (
    <div
      style={{
        position: 'relative',
        width,
        flexShrink: 0,
        background: 'var(--bg)',
        borderRight: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      }}
    >
      <WorkspaceSwitcher />
      <div style={{ height: 1, background: 'var(--line)', margin: '2px 14px 6px' }} />
      <NavList />
      <div style={{ height: 1, background: 'var(--line)', margin: '6px 14px' }} />
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 8 }}>
        <SessionList />
        <TerminalList />
      </div>
      <WorktreeSwitcher />
      <AccountRow />
      <ResizeHandle side="left" onResize={(dx) => setSidebarWidth(width + dx)} onEnd={persistPaneWidths} onReset={() => { setSidebarWidth(264); persistPaneWidths() }} />
    </div>
  )
}
