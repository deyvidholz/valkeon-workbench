import { getProviderMeta, PROVIDER_META } from '@shared/agents/providers'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { Toggle } from '../ui/Toggle'
import { DialogActions, DialogHeader, eyebrow, inputStyle, segStyle } from './parts'

export function NewSessionDialog() {
  const open = useStore((s) => s.newSessionOpen)
  const form = useStore((s) => s.newSession)
  const setForm = useStore((s) => s.setNewSession)
  const create = useStore((s) => s.createSession)
  const close = useStore((s) => s.closeNewSession)
  const workspaces = useStore((s) => s.workspaces)
  const wsId = useStore((s) => s.activeWorkspaceId)
  const project = useStore((s) => s.project)
  const { t } = useTranslation()
  if (!open) return null

  const ws = workspaces.find((w) => w.id === wsId)
  const provider = getProviderMeta(form.providerId)
  const notRepo = project?.isGitRepo === false

  return (
    <Modal onClose={close} width={480} zIndex={56} panelStyle={{ padding: 20 }}>
      <DialogHeader icon="add_circle" title={t('newSession.title', 'New session')} subtitle={<>{t('newSession.subtitlePre', 'Starts a')} {provider?.name ?? t('newSession.agent', 'agent')} {t('newSession.subtitleMid', 'session in')} <span style={{ color: 'var(--text-dim)' }}>{ws?.name}</span>.</>} />

      <div style={eyebrow}>{t('newSession.name', 'NAME')}</div>
      <input value={form.name} onChange={(e) => setForm({ name: e.target.value })} placeholder={t('newSession.namePlaceholder', 'e.g. refactor-billing')} style={{ ...inputStyle, marginBottom: 16 }} autoFocus />

      {PROVIDER_META.length > 1 && (
        <>
          <div style={eyebrow}>{t('newSession.provider', 'PROVIDER')}</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
            {PROVIDER_META.map((p) => (
              <span key={p.id} onClick={() => setForm({ providerId: p.id, modelId: p.defaultModelId })} style={segStyle(form.providerId === p.id)}>
                {p.name}
              </span>
            ))}
          </div>
        </>
      )}

      <div style={eyebrow}>{t('newSession.model', 'MODEL')}</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {provider?.models.map((m) => (
          <span key={m.id} onClick={() => setForm({ modelId: m.id })} style={segStyle(form.modelId === m.id)}>
            {m.short}
          </span>
        ))}
      </div>

      <div style={eyebrow}>{t('newSession.mode', 'MODE')}</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <span onClick={() => setForm({ mode: 'interactive' })} style={segStyle(form.mode === 'interactive')}>{t('newSession.interactive', 'Interactive')}</span>
        <span onClick={() => setForm({ mode: 'structured' })} style={segStyle(form.mode === 'structured')}>{t('newSession.structured', 'Structured')}</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 18 }}>
        {form.mode === 'structured'
          ? t('newSession.structuredDesc', 'Our own transcript + live telemetry (files touched, tokens, status) and opt-in context injection. Same token cost as interactive.')
          : t('newSession.interactiveDesc', 'The raw agent terminal — full CLI feel, slash commands, the TUI.')}
      </div>

      <div
        onClick={() => !notRepo && setForm({ worktree: !form.worktree })}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 13px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--line)', cursor: notRepo ? 'default' : 'pointer', marginBottom: 20, opacity: notRepo ? 0.55 : 1 }}
      >
        <Icon name="account_tree" size={19} color="var(--ai)" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{t('newSession.useWorktree', 'Use a git worktree')}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {notRepo ? t('newSession.notRepoHint', 'Folder isn’t a git repo — initialize it in Worktrees first') : t('newSession.worktreeHint', 'Isolated checkout so this session won’t collide with others')}
          </div>
        </div>
        <Toggle on={form.worktree && !notRepo} onClick={() => !notRepo && setForm({ worktree: !form.worktree })} />
      </div>

      <div onClick={() => setForm({ skipPerms: !form.skipPerms })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 13px', borderRadius: 10, background: '#100c0c', border: '1px solid #2a1a1a', cursor: 'pointer', marginBottom: 12 }}>
        <Icon name="gpp_maybe" size={19} color="var(--warn)" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{t('newSession.skipPerms', 'Skip permission prompts')}</div>
          <div style={{ fontSize: 11, color: '#8a7a5e', marginTop: 2, fontFamily: "'Geist Mono', monospace" }}>--dangerously-skip-permissions</div>
        </div>
        <Toggle on={form.skipPerms} danger onClick={() => setForm({ skipPerms: !form.skipPerms })} />
      </div>

      <div onClick={() => setForm({ notify: !form.notify })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 13px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--line)', cursor: 'pointer', marginBottom: 20 }}>
        <Icon name="notifications_active" size={19} color="var(--accent-hi)" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{t('newSession.notify', 'Notify me when it needs me')}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{t('newSession.notifyHint', 'OS notification when a turn finishes or the agent asks something')}</div>
        </div>
        <Toggle on={form.notify} onClick={() => setForm({ notify: !form.notify })} />
      </div>

      <DialogActions onCancel={close} onConfirm={create} confirmLabel={t('newSession.startSession', 'Start session')} confirmIcon="add" />
    </Modal>
  )
}
