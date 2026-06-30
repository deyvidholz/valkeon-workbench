import { useEffect, useState } from 'react'
import { getModelMeta, getProviderMeta } from '@shared/agents/providers'
import { useStore } from '../store/useStore'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'
import { StatusDot, STATUS_LABEL } from '../ui/StatusDot'
import { ModelChip } from '../ui/ModelChip'
import { XTerm } from '../components/XTerm'
import { PtyComposer } from '../components/PtyComposer'
import { AgentTranscript } from '../components/AgentTranscript'
import { AgentComposer } from '../components/AgentComposer'
import { CONTEXT_SOURCES } from '@shared/context'

const fmtDuration = (ms: number): string => {
  const s = Math.max(0, Math.floor(ms / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${s % 60}s`
  const h = Math.floor(m / 60)
  return `${h}h ${m % 60}m`
}

export function SessionScreen() {
  const sessions = useStore((s) => s.sessions)
  const activeSessionId = useStore((s) => s.activeSessionId)
  const fontSize = useStore((s) => s.fontSize)
  const focusToken = useStore((s) => s.focusComposerToken)
  const go = useStore((s) => s.go)
  const endSession = useStore((s) => s.endSession)
  const restartSession = useStore((s) => s.restartSession)
  const askConfirm = useStore((s) => s.askConfirm)
  const nonce = useStore((s) => (activeSessionId ? s.ptyNonce[activeSessionId] ?? 0 : 0))
  const setSessionModel = useStore((s) => s.setSessionModel)
  const toggleContextSource = useStore((s) => s.toggleContextSource)
  const [moreOpen, setMoreOpen] = useState(false)
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const session = sessions.find((s) => s.id === activeSessionId)
  if (!session) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b6b74' }}>
        No session selected.
      </div>
    )
  }

  const id = session.id
  const ptyId = `${id}:${nonce}`
  const tokenPct = Math.round((session.tokens.used / session.tokens.limit) * 100)

  const confirmStop = (): void =>
    askConfirm({ title: 'Stop session', message: `Stop “${session.name}”? The agent process is terminated and the session is closed.`, confirmLabel: 'Stop session', onConfirm: () => endSession(id) })
  const confirmRestart = (): void =>
    askConfirm({ title: 'Restart session', message: `Restart “${session.name}”? The current process is terminated and a fresh one starts.`, confirmLabel: 'Restart', onConfirm: () => restartSession(id) })

  const detailRow = (label: string, value: React.ReactNode): React.ReactNode => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <span style={{ fontSize: 12, color: '#73737c', flexShrink: 0 }}>{label}</span>
      {value}
    </div>
  )

  const iconBtn = (icon: string, onClick: () => void, title: string): React.ReactNode => (
    <Hover as="span" onClick={onClick} title={title} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, color: '#8a8a93', cursor: 'pointer' }} hover={{ background: '#16161d', color: '#e4e4ea' }}>
      <Icon name={icon} size={18} />
    </Hover>
  )

  const moreItem = (icon: string, label: string, onClick: () => void, danger?: boolean): React.ReactNode => (
    <Hover onClick={() => { setMoreOpen(false); onClick() }} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 7, cursor: 'pointer', color: danger ? '#e07a6e' : '#cbcbd2', fontSize: 12.5 }} hover={{ background: '#17171c' }}>
      <Icon name={icon} size={16} />{label}
    </Hover>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ height: 53, flexShrink: 0, borderBottom: '1px solid #16161a', display: 'flex', alignItems: 'center', gap: 11, padding: '0 16px' }}>
        <Hover as="span" onClick={() => go('workspace')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, color: '#8a8a93', cursor: 'pointer' }} hover={{ background: '#16161d', color: '#e4e4ea' }}>
          <Icon name="arrow_back" size={19} />
        </Hover>
        <StatusDot status={session.status} />
        <span style={{ fontSize: 15, fontWeight: 600, color: '#ededf0', lineHeight: 1, display: 'flex', alignItems: 'center' }}>{session.name}</span>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span onClick={() => setModelMenuOpen((o) => !o)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Change the displayed model">
            <ModelChip label={getModelMeta(session.providerId, session.modelId)?.label ?? session.model} />
          </span>
          {modelMenuOpen && (
            <>
              <div onClick={() => setModelMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 19 }} />
              <div style={{ position: 'absolute', top: 24, left: 0, zIndex: 20, width: 150, background: '#101014', border: '1px solid #25252d', borderRadius: 9, padding: 5, boxShadow: '0 12px 32px rgba(0,0,0,0.5)' }}>
                {getProviderMeta(session.providerId)?.models.map((m) => (
                  <Hover key={m.id} onClick={() => { setSessionModel(session.id, m.id); setModelMenuOpen(false) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 9px', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: m.id === session.modelId ? '#ededf0' : '#cbcbd2' }} hover={{ background: '#17171c' }}>
                    {m.label}
                    {m.id === session.modelId && <Icon name="check" size={14} color="var(--accent)" />}
                  </Hover>
                ))}
              </div>
            </>
          )}
        </div>
        {session.worktree && <Icon name="account_tree" size={15} color="#b89cf0" title="Uses a git worktree" />}
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: "'Geist Mono', monospace", fontSize: 10.5, color: '#7a7a83', background: '#141419', border: '1px solid #222229', padding: '1px 6px', borderRadius: 5 }}>
          <Icon name="fork_right" size={12} />
          {session.branch}
        </span>
        <div style={{ flex: 1 }} />
        <Hover as="span" onClick={confirmStop} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 8, background: '#121216', border: '1px solid #232329', color: '#cbcbd2', fontSize: 12, fontWeight: 500, cursor: 'pointer' }} hover={{ background: '#17171c' }}>
          <Icon name="stop_circle" size={15} />
          Stop
        </Hover>
        {iconBtn('restart_alt', confirmRestart, 'Restart')}
        <div style={{ position: 'relative' }}>
          {iconBtn('more_horiz', () => setMoreOpen((o) => !o), 'More')}
          {moreOpen && (
            <>
              <div onClick={() => setMoreOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 19 }} />
              <div style={{ position: 'absolute', top: 36, right: 0, zIndex: 20, width: 200, background: '#101014', border: '1px solid #25252d', borderRadius: 10, padding: 6, boxShadow: '0 16px 44px rgba(0,0,0,0.5)' }}>
                {session.worktree && moreItem('folder_open', 'Open worktree folder', () => window.api?.shell.openPath(session.worktree as string))}
                {moreItem('content_copy', 'Copy branch name', () => navigator.clipboard?.writeText(session.branch))}
                {moreItem('restart_alt', 'Restart session', confirmRestart)}
                {moreItem('close', 'Close session', confirmStop, true)}
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {session.mode === 'structured' ? (
            <>
              <div style={{ flex: 1, minHeight: 0, background: '#0a0a0c', overflow: 'hidden' }}>
                <AgentTranscript lines={session.lines} status={session.status} sessionName={session.name} />
              </div>
              <AgentComposer key={id} sessionId={id} placeholder={`Message ${session.name}…  (Enter to send, Shift+Enter for newline)`} focusToken={focusToken} />
            </>
          ) : (
            <>
              <div style={{ flex: 1, minHeight: 0, background: '#0a0a0c', overflow: 'hidden' }}>
                <XTerm
                  ptyId={ptyId}
                  spec={{ kind: 'session', cwd: session.cwd, providerId: session.providerId, modelId: session.modelId, skipPermissions: session.skipPermissions, initialInput: session.initialPrompt }}
                  fontSize={Math.max(fontSize, 13)}
                  onInitialInputSent={() => useStore.getState().clearInitialPrompt(id)}
                  onExit={() => {
                    if ((useStore.getState().ptyNonce[id] ?? 0) === nonce) endSession(id)
                  }}
                />
              </div>
              <PtyComposer key={id} ptyId={ptyId} prompt="›" promptColor="var(--accent)" placeholder={`Reply to ${session.name}, or ask for a change…`} focusToken={focusToken} />
            </>
          )}
        </div>

        <div style={{ width: 300, flexShrink: 0, borderLeft: '1px solid #16161a', background: '#0a0a0c', overflowY: 'auto', padding: '18px 18px 28px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#62626b', marginBottom: 12 }}>DETAILS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {detailRow('Status', <span style={{ fontSize: 12, color: '#cbcbd2', display: 'flex', alignItems: 'center', gap: 6 }}><StatusDot status={session.status} />{STATUS_LABEL[session.status]}</span>)}
            {detailRow('Model', <ModelChip label={session.model} />)}
            {detailRow('Branch', <span style={{ fontSize: 11.5, color: '#cbcbd2', fontFamily: "'Geist Mono', monospace" }}>{session.branch}</span>)}
            {detailRow('Worktree', <span style={{ fontSize: 11.5, color: session.worktree ? '#b89cf0' : '#73737c', fontFamily: "'Geist Mono', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.worktree ?? 'main checkout'}</span>)}
            {detailRow('Running for', <span style={{ fontSize: 11.5, color: '#cbcbd2', fontFamily: "'Geist Mono', monospace" }}>{fmtDuration(Date.now() - session.startedAt)}</span>)}
            {detailRow('Mode', <span style={{ fontSize: 11, color: session.mode === 'structured' ? 'var(--accent-hi)' : '#9a9aa3', fontWeight: 600, background: session.mode === 'structured' ? 'var(--accent-soft)' : '#141419', border: `1px solid ${session.mode === 'structured' ? 'var(--accent-line)' : '#222229'}`, padding: '2px 8px', borderRadius: 5 }}>{session.mode === 'structured' ? 'Structured' : 'Interactive'}</span>)}
            {session.mode === 'structured' && session.costUsd != null && detailRow('Cost', <span style={{ fontSize: 11.5, color: '#cbcbd2', fontFamily: "'Geist Mono', monospace" }}>${session.costUsd.toFixed(3)}</span>)}
          </div>
          <div style={{ height: 1, background: '#15151a', margin: '16px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#62626b' }}>CONTEXT</span>
            <span style={{ fontSize: 11, color: '#56565e', fontFamily: "'Geist Mono', monospace" }}>{session.tokens.used}K / {session.tokens.limit}K</span>
          </div>
          <div style={{ height: 5, borderRadius: 4, background: '#16161c', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ width: `${tokenPct}%`, height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,var(--accent),var(--accent-hi))' }} />
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#62626b', marginBottom: 10 }}>FILES TOUCHED</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {session.files.length === 0 && <div style={{ fontSize: 11.5, color: '#56565e' }}>No files yet.</div>}
            {session.files.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="description" size={15} color="#5f5f68" />
                <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: '#b7b7c0', fontFamily: "'Geist Mono', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.p}</span>
                <span style={{ fontSize: 10.5, color: '#5cc98a', fontFamily: "'Geist Mono', monospace" }}>{f.c}</span>
              </div>
            ))}
          </div>

          {session.mode === 'structured' && (
            <>
              <div style={{ height: 1, background: '#15151a', margin: '16px 0' }} />
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#62626b', marginBottom: 4 }}>CONTEXT INJECTED</div>
              <div style={{ fontSize: 10.5, color: '#56565e', lineHeight: 1.45, marginBottom: 10 }}>Prepended to your next turn after a fresh start. Off = zero added tokens.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {CONTEXT_SOURCES.map((src) => {
                  const on = (session.contextSources ?? []).includes(src.id)
                  return (
                    <Hover key={src.id} onClick={() => toggleContextSource(session.id, src.id)} title={src.hint} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 9px', borderRadius: 8, cursor: 'pointer', background: on ? 'var(--accent-soft)' : '#0e0e12', border: `1px solid ${on ? 'var(--accent-line)' : '#1c1c22'}` }} hover={{ border: '1px solid #2c2c35' }}>
                      <Icon name={src.icon} size={15} color={on ? 'var(--accent-hi)' : '#6b6b74'} />
                      <span style={{ flex: 1, fontSize: 11.5, color: on ? '#e4e4ea' : '#9a9aa3' }}>{src.label}</span>
                      <Icon name={on ? 'check_circle' : 'radio_button_unchecked'} size={15} color={on ? 'var(--accent-hi)' : '#3a3a42'} />
                    </Hover>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
