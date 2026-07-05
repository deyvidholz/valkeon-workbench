import { WorkspaceSwitcher } from './WorkspaceSwitcher'
import { NavList } from './NavList'
import { SessionList } from './SessionList'
import { TerminalList } from './TerminalList'
import { WorktreeSwitcher } from './WorktreeSwitcher'
import { AccountRow } from './AccountRow'

export function Sidebar() {
  return (
    <div
      style={{
        width: 264,
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
    </div>
  )
}
