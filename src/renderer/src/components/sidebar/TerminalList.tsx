import { useMemo } from 'react'
import { useStore } from '../../store/useStore'
import { Icon } from '../../ui/Icon'
import { Hover } from '../../ui/Hover'

const addBtn = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 20,
  height: 20,
  borderRadius: 6,
  color: '#6f6f78',
  cursor: 'pointer'
} as const

export function TerminalList() {
  const terminals = useStore((s) => s.terminals)
  const wsId = useStore((s) => s.activeWorkspaceId)
  const go = useStore((s) => s.go)
  const newTerminal = useStore((s) => s.newTerminal)
  const closeTerminal = useStore((s) => s.closeTerminal)
  const closeAllTerminals = useStore((s) => s.closeAllTerminals)
  const openContextMenu = useStore((s) => s.openContextMenu)
  const scoped = useMemo(() => terminals.filter((t) => t.wsId === wsId), [terminals, wsId])

  return (
    <>
      <div
        style={{
          padding: '15px 16px 7px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#62626b' }}>
          TERMINALS
        </span>
        <Hover as="span" title="New terminal" onClick={newTerminal} style={addBtn} hover={{ background: '#16161d', color: '#cfcfd6' }}>
          <Icon name="add" size={16} />
        </Hover>
      </div>
      <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {scoped.map((t) => (
          <Hover
            key={t.id}
            onClick={() => go('terminals')}
            onContextMenu={(e) => {
              e.preventDefault()
              openContextMenu(e.clientX, e.clientY, [
                { label: 'Open in Terminals', icon: 'open_in_full', onClick: () => go('terminals') },
                { label: 'Close terminal', icon: 'close', danger: true, onClick: () => closeTerminal(t.id) },
                { label: 'Close all terminals', icon: 'layers_clear', danger: true, onClick: closeAllTerminals }
              ])
            }}
            style={{ display: 'flex', gap: 9, padding: 9, borderRadius: 8, cursor: 'pointer', alignItems: 'center' }}
            hover={{ background: '#121217' }}
          >
            <Icon name="terminal" size={16} color="#73737c" style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: '#dcdce2',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {t.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: '#73737c',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginTop: 1,
                  fontFamily: "'Geist Mono', monospace"
                }}
              >
                {t.cwd}
              </div>
            </div>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: t.running ? '#5cc98a' : '#56565e',
                display: 'inline-block',
                flexShrink: 0,
                ...(t.running ? { animation: 'pulse 2s infinite' } : null)
              }}
            />
          </Hover>
        ))}
      </div>
    </>
  )
}
