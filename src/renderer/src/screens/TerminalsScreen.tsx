import { useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'
import { Pager } from '../ui/Pager'
import { XTerm } from '../components/XTerm'
import { PtyComposer } from '../components/PtyComposer'

export function TerminalsScreen() {
  const terminals = useStore((s) => s.terminals)
  const wsId = useStore((s) => s.activeWorkspaceId)
  const fontSize = useStore((s) => s.fontSize)
  const newTerminal = useStore((s) => s.newTerminal)
  const closeTerminal = useStore((s) => s.closeTerminal)
  const endTerminal = useStore((s) => s.endTerminal)
  const reorderTerminals = useStore((s) => s.reorderTerminals)
  const scoped = useMemo(() => terminals.filter((t) => t.wsId === wsId), [terminals, wsId])
  const [dragId, setDragId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const PER = 4
  const pageCount = Math.max(1, Math.ceil(scoped.length / PER))
  const clampedPage = Math.min(page, pageCount - 1)
  const pageItems = scoped.slice(clampedPage * PER, clampedPage * PER + PER)

  const newBtn = (
    <Hover as="span" onClick={newTerminal} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 8, background: 'var(--accent)', color: '#0a1018', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }} hover={{ filter: 'brightness(1.08)' }}>
      <Icon name="add" size={16} />
      New terminal
    </Hover>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ height: 53, flexShrink: 0, borderBottom: '1px solid #16161a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 11 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#ededf0' }}>Terminals</span>
          <span style={{ fontSize: 12, color: '#6b6b74' }}>Plain shells — separate from AI sessions</span>
        </div>
        {newBtn}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: 16 }}>
        {scoped.length === 0 ? (
          <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center' }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: '#101015', border: '1px solid #1d1d23', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="terminal" size={24} color="#56565e" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#cbcbd2' }}>No terminals open</div>
              <div style={{ fontSize: 12, color: '#6b6b74', marginTop: 4 }}>Open a real shell to run commands, dev servers, or anything else.</div>
            </div>
            {newBtn}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: 10 }}>
            <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: pageItems.length < 2 ? '1fr' : '1fr 1fr', gridTemplateRows: pageItems.length > 2 ? '1fr 1fr' : '1fr', gap: 14 }}>
            {pageItems.map((t) => (
              <div
                key={t.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragId && dragId !== t.id) reorderTerminals(dragId, t.id)
                  setDragId(null)
                }}
                style={{ background: '#0c0c0f', border: '1px solid #1b1b21', borderRadius: 12, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}
              >
                <div style={{ height: 38, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 9, padding: '0 11px', borderBottom: '1px solid #16161a', background: '#0e0e12' }}>
                  <div draggable onDragStart={() => setDragId(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0, cursor: 'grab' }}>
                    <Icon name="terminal" size={15} color="#8a8a93" />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#e4e4ea', whiteSpace: 'nowrap' }}>{t.name}</span>
                    <span style={{ fontSize: 10, color: '#6b6b74', fontFamily: "'Geist Mono', monospace", background: '#141419', border: '1px solid #222229', padding: '1px 6px', borderRadius: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 170 }}>{t.cwd}</span>
                  </div>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.running ? '#5cc98a' : '#56565e', display: 'inline-block', flexShrink: 0, ...(t.running ? { animation: 'pulse 2s infinite' } : null) }} />
                  <Hover as="span" onClick={() => closeTerminal(t.id)} title="Close terminal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 6, color: '#6f6f78', cursor: 'pointer' }} hover={{ background: '#191920', color: '#e07a6e' }}>
                    <Icon name="close" size={16} />
                  </Hover>
                </div>
                <div style={{ flex: 1, minHeight: 0, background: '#0a0a0c', overflow: 'hidden' }}>
                  <XTerm ptyId={t.id} spec={{ kind: 'terminal', cwd: t.cwd }} fontSize={fontSize} onExit={() => endTerminal(t.id)} />
                </div>
                <PtyComposer ptyId={t.id} prompt="$" promptColor="#5cc98a" placeholder="Run a command…" />
              </div>
            ))}
            </div>
            <Pager page={clampedPage} pageCount={pageCount} setPage={setPage} />
          </div>
        )}
      </div>
    </div>
  )
}
