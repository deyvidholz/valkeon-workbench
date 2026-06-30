import { getModelMeta } from '@shared/agents/providers'
import { useStore } from '../store/useStore'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'
import { StatusDot, STATUS_LABEL } from '../ui/StatusDot'
import { ModelChip } from '../ui/ModelChip'
import { XTerm } from './XTerm'
import { PtyComposer } from './PtyComposer'
import { AgentTranscript } from './AgentTranscript'
import { AgentComposer } from './AgentComposer'
import type { Session } from '../types'

interface SessionCardProps {
  session: Session
  onReorderStart?: () => void
  onReorderDrop?: () => void
}

/** Grid/split tile for one live session: real agent PTY + an inline composer. */
export function SessionCard({ session, onReorderStart, onReorderDrop }: SessionCardProps) {
  const openSession = useStore((s) => s.openSession)
  const fontSize = useStore((s) => s.fontSize)
  const nonce = useStore((s) => s.ptyNonce[session.id] ?? 0)
  const endSession = useStore((s) => s.endSession)
  const askConfirm = useStore((s) => s.askConfirm)
  const short = getModelMeta(session.providerId, session.modelId)?.short ?? session.modelId
  const ptyId = `${session.id}:${nonce}`

  const confirmClose = (): void =>
    askConfirm({
      title: 'Close session',
      message: `Close “${session.name}”? The agent process is terminated.`,
      confirmLabel: 'Close session',
      onConfirm: () => endSession(session.id)
    })

  return (
    <div
      onDragOver={onReorderDrop ? (e) => e.preventDefault() : undefined}
      onDrop={onReorderDrop}
      style={{ background: '#0c0c0f', border: '1px solid #1b1b21', borderRadius: 12, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}
    >
      <div style={{ height: 38, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 9, padding: '0 11px', borderBottom: '1px solid #16161a', background: '#0e0e12' }}>
        <div
          draggable={!!onReorderStart}
          onDragStart={onReorderStart}
          style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0, cursor: onReorderStart ? 'grab' : 'default' }}
        >
          <StatusDot status={session.status} />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#e4e4ea', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{session.name}</span>
          <span style={{ fontSize: 10, color: '#6b6b74', fontFamily: "'Geist Mono', monospace" }}>{STATUS_LABEL[session.status].toLowerCase()}</span>
          <ModelChip label={short} />
          {session.worktree && <Icon name="account_tree" size={14} color="#b89cf0" title="Uses a git worktree" />}
        </div>
        <Hover as="span" onClick={() => openSession(session.id)} title="Open session" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 6, color: '#6f6f78', cursor: 'pointer' }} hover={{ background: '#191920', color: '#cfcfd6' }}>
          <Icon name="open_in_full" size={15} />
        </Hover>
        <Hover as="span" onClick={confirmClose} title="Close session" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 6, color: '#6f6f78', cursor: 'pointer' }} hover={{ background: '#191920', color: '#e07a6e' }}>
          <Icon name="close" size={16} />
        </Hover>
      </div>
      {session.mode === 'structured' ? (
        <>
          <div style={{ flex: 1, minHeight: 0, background: '#0a0a0c', overflow: 'hidden' }}>
            <AgentTranscript lines={session.lines} status={session.status} sessionName={session.name} />
          </div>
          <AgentComposer key={session.id} sessionId={session.id} placeholder={`Message ${session.name}…`} />
        </>
      ) : (
        <>
          <div style={{ flex: 1, minHeight: 0, background: '#0a0a0c', overflow: 'hidden' }}>
            <XTerm
              ptyId={ptyId}
              spec={{ kind: 'session', cwd: session.cwd, providerId: session.providerId, modelId: session.modelId, skipPermissions: session.skipPermissions, initialInput: session.initialPrompt }}
              fontSize={fontSize}
              onInitialInputSent={() => useStore.getState().clearInitialPrompt(session.id)}
              onExit={() => {
                if ((useStore.getState().ptyNonce[session.id] ?? 0) === nonce) endSession(session.id)
              }}
            />
          </div>
          <PtyComposer key={session.id} ptyId={ptyId} prompt="›" promptColor="var(--accent)" placeholder={`Reply to ${session.name}, or ask for a change…`} />
        </>
      )}
    </div>
  )
}
