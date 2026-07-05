import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
  const toggleSessionNotify = useStore((s) => s.toggleSessionNotify)
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
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        {t('session.noSelection', 'No session selected.')}
      </div>
    )
  }

  const id = session.id
  const ptyId = `${id}:${nonce}`
  const tokenPct = Math.round((session.tokens.used / session.tokens.limit) * 100)

  const confirmStop = (): void =>
    askConfirm({ title: t('session.stopTitle', 'Stop session'), message: t('session.stopMessage', 'Stop “{{name}}”? The agent process is terminated and the session is closed.', { name: session.name }), confirmLabel: t('session.stopConfirm', 'Stop session'), onConfirm: () => endSession(id) })
  const confirmRestart = (): void =>
    askConfirm({ title: t('session.restartTitle', 'Restart session'), message: t('session.restartMessage', 'Restart “{{name}}”? The current process is terminated and a fresh one starts.', { name: session.name }), confirmLabel: t('session.restartConfirm', 'Restart'), onConfirm: () => restartSession(id) })

  const detailRow = (label: string, value: React.ReactNode): React.ReactNode => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
      {value}
    </div>
  )

  const iconBtn = (icon: string, onClick: () => void, title: string): React.ReactNode => (
    <Hover as="span" onClick={onClick} title={title} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, color: 'var(--text-dim)', cursor: 'pointer' }} hover={{ background: 'var(--surface-2)', color: 'var(--text)' }}>
      <Icon name={icon} size={18} />
    </Hover>
  )

  const moreItem = (icon: string, label: string, onClick: () => void, danger?: boolean): React.ReactNode => (
    <Hover onClick={() => { setMoreOpen(false); onClick() }} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 7, cursor: 'pointer', color: danger ? 'var(--danger)' : 'var(--text-2)', fontSize: 12.5 }} hover={{ background: 'var(--surface-2)' }}>
      <Icon name={icon} size={16} />{label}
    </Hover>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ height: 53, flexShrink: 0, borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 11, padding: '0 16px' }}>
        <Hover as="span" onClick={() => go('workspace')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, color: 'var(--text-dim)', cursor: 'pointer' }} hover={{ background: 'var(--surface-2)', color: 'var(--text)' }}>
          <Icon name="arrow_back" size={19} />
        </Hover>
        <StatusDot status={session.status} />
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', lineHeight: 1, display: 'flex', alignItems: 'center' }}>{session.name}</span>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span onClick={() => setModelMenuOpen((o) => !o)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} title={t('session.changeModel', 'Change the displayed model')}>
            <ModelChip label={getModelMeta(session.providerId, session.modelId)?.label ?? session.model} />
          </span>
          {modelMenuOpen && (
            <>
              <div onClick={() => setModelMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 19 }} />
              <div style={{ position: 'absolute', top: 24, left: 0, zIndex: 20, width: 150, background: 'var(--surface)', border: '1px solid var(--line-2)', borderRadius: 9, padding: 5, boxShadow: '0 12px 32px var(--shadow)' }}>
                {getProviderMeta(session.providerId)?.models.map((m) => (
                  <Hover key={m.id} onClick={() => { setSessionModel(session.id, m.id); setModelMenuOpen(false) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 9px', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: m.id === session.modelId ? 'var(--text)' : 'var(--text-2)' }} hover={{ background: 'var(--surface-2)' }}>
                    {m.label}
                    {m.id === session.modelId && <Icon name="check" size={14} color="var(--accent)" />}
                  </Hover>
                ))}
              </div>
            </>
          )}
        </div>
        {session.worktree && <Icon name="account_tree" size={15} color="var(--ai)" title={t('session.usesWorktree', 'Uses a git worktree')} />}
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: "'Geist Mono', monospace", fontSize: 10.5, color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--line-2)', padding: '1px 6px', borderRadius: 5 }}>
          <Icon name="fork_right" size={12} />
          {session.branch}
        </span>
        <div style={{ flex: 1 }} />
        <Hover as="span" onClick={confirmStop} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--line-2)', color: 'var(--text-2)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }} hover={{ background: 'var(--surface-2)' }}>
          <Icon name="stop_circle" size={15} />
          {t('session.stop', 'Stop')}
        </Hover>
        <Hover as="span" onClick={() => toggleSessionNotify(id)} title={session.notify === true ? t('session.notifyOn', 'Notifications on — click to disable') : t('session.notifyOff', 'Notify me when this session needs me')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, color: session.notify === true ? 'var(--accent-hi)' : 'var(--text-faint)', cursor: 'pointer' }} hover={{ background: 'var(--surface-2)' }}>
          <Icon name={session.notify === true ? 'notifications_active' : 'notifications_off'} size={18} />
        </Hover>
        {iconBtn('restart_alt', confirmRestart, t('session.restart', 'Restart'))}
        <div style={{ position: 'relative' }}>
          {iconBtn('more_horiz', () => setMoreOpen((o) => !o), t('session.more', 'More'))}
          {moreOpen && (
            <>
              <div onClick={() => setMoreOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 19 }} />
              <div style={{ position: 'absolute', top: 36, right: 0, zIndex: 20, width: 200, background: 'var(--surface)', border: '1px solid var(--line-2)', borderRadius: 10, padding: 6, boxShadow: '0 16px 44px var(--shadow)' }}>
                {session.worktree && moreItem('folder_open', t('session.openWorktree', 'Open worktree folder'), () => window.api?.shell.openPath(session.worktree as string))}
                {moreItem('content_copy', t('session.copyBranch', 'Copy branch name'), () => navigator.clipboard?.writeText(session.branch))}
                {moreItem('restart_alt', t('session.restartTitle', 'Restart session'), confirmRestart)}
                {moreItem('close', t('session.closeSession', 'Close session'), confirmStop, true)}
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {session.mode === 'structured' ? (
            <>
              <div style={{ flex: 1, minHeight: 0, background: 'var(--bg)', overflow: 'hidden' }}>
                <AgentTranscript lines={session.lines} status={session.status} sessionName={session.name} />
              </div>
              <AgentComposer key={id} sessionId={id} placeholder={t('session.structuredPlaceholder', 'Message {{name}}…  ( /model · /clear · Enter to send )', { name: session.name })} focusToken={focusToken} />
            </>
          ) : (
            <>
              <div style={{ flex: 1, minHeight: 0, background: 'var(--bg)', overflow: 'hidden' }}>
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
              <PtyComposer key={id} ptyId={ptyId} prompt="›" promptColor="var(--accent)" placeholder={t('session.interactivePlaceholder', 'Reply to {{name}}, or ask for a change…', { name: session.name })} focusToken={focusToken} />
            </>
          )}
        </div>

        <div style={{ width: 300, flexShrink: 0, borderLeft: '1px solid var(--line)', background: 'var(--bg)', overflowY: 'auto', padding: '18px 18px 28px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 12 }}>{t('session.details', 'DETAILS')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {detailRow(t('session.statusLabel', 'Status'), <span style={{ fontSize: 12, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}><StatusDot status={session.status} />{STATUS_LABEL[session.status]}</span>)}
            {detailRow(t('session.modelLabel', 'Model'), <ModelChip label={session.model} />)}
            {detailRow(t('session.branchLabel', 'Branch'), <span style={{ fontSize: 11.5, color: 'var(--text-2)', fontFamily: "'Geist Mono', monospace" }}>{session.branch}</span>)}
            {detailRow(t('session.worktreeLabel', 'Worktree'), <span style={{ fontSize: 11.5, color: session.worktree ? 'var(--ai)' : 'var(--text-muted)', fontFamily: "'Geist Mono', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.worktree ?? t('session.mainCheckout', 'main checkout')}</span>)}
            {detailRow(
              session.mode === 'structured' ? t('session.activeFor', 'Active for') : t('session.runningFor', 'Running for'),
              <span style={{ fontSize: 11.5, color: 'var(--text-2)', fontFamily: "'Geist Mono', monospace" }}>
                {fmtDuration(
                  session.mode === 'structured'
                    ? (session.activeMs ?? 0) + (session.status === 'running' && session.runStartedAt != null ? Date.now() - session.runStartedAt : 0)
                    : Date.now() - session.startedAt
                )}
              </span>
            )}
            {detailRow(t('session.modeLabel', 'Mode'), <span style={{ fontSize: 11, color: session.mode === 'structured' ? 'var(--accent-hi)' : 'var(--text-dim)', fontWeight: 600, background: session.mode === 'structured' ? 'var(--accent-soft)' : 'var(--surface)', border: `1px solid ${session.mode === 'structured' ? 'var(--accent-line)' : 'var(--line-2)'}`, padding: '2px 8px', borderRadius: 5 }}>{session.mode === 'structured' ? t('session.structured', 'Structured') : t('session.interactive', 'Interactive')}</span>)}
            {session.mode === 'structured' && session.costUsd != null && detailRow(t('session.costLabel', 'Cost'), <span style={{ fontSize: 11.5, color: 'var(--text-2)', fontFamily: "'Geist Mono', monospace" }}>${session.costUsd.toFixed(3)}</span>)}
          </div>
          <div style={{ height: 1, background: 'var(--line)', margin: '16px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{t('session.context', 'CONTEXT')}</span>
            <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: "'Geist Mono', monospace" }}>{session.tokens.used}K / {session.tokens.limit}K</span>
          </div>
          <div style={{ height: 5, borderRadius: 4, background: 'var(--surface-2)', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ width: `${tokenPct}%`, height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,var(--accent),var(--accent-hi))' }} />
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 10 }}>{t('session.filesTouched', 'FILES TOUCHED')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {session.files.length === 0 && <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{t('session.noFiles', 'No files yet.')}</div>}
            {session.files.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="description" size={15} color="var(--text-muted)" />
                <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: 'var(--text-2)', fontFamily: "'Geist Mono', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.p}</span>
                <span style={{ fontSize: 10.5, color: 'var(--ok)', fontFamily: "'Geist Mono', monospace" }}>{f.c}</span>
              </div>
            ))}
          </div>

          {session.mode === 'structured' && (
            <>
              <div style={{ height: 1, background: 'var(--line)', margin: '16px 0' }} />
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 4 }}>{t('session.contextInjected', 'CONTEXT INJECTED')}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-faint)', lineHeight: 1.45, marginBottom: 10 }}>{t('session.contextInjectedHint', 'Prepended to your next turn after a fresh start. Off = zero added tokens.')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {CONTEXT_SOURCES.map((src) => {
                  const on = (session.contextSources ?? []).includes(src.id)
                  return (
                    <Hover key={src.id} onClick={() => toggleContextSource(session.id, src.id)} title={src.hint} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 9px', borderRadius: 8, cursor: 'pointer', background: on ? 'var(--accent-soft)' : 'var(--surface)', border: `1px solid ${on ? 'var(--accent-line)' : 'var(--line)'}` }} hover={{ border: '1px solid var(--line-2)' }}>
                      <Icon name={src.icon} size={15} color={on ? 'var(--accent-hi)' : 'var(--text-muted)'} />
                      <span style={{ flex: 1, fontSize: 11.5, color: on ? 'var(--text)' : 'var(--text-dim)' }}>{src.label}</span>
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
