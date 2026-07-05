import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'
import { DialogHeader, eyebrow, inputStyle, segStyle } from './parts'
import type { TaskStrategy } from '@shared/project'

const STRATEGIES: { id: TaskStrategy; label: string; desc: string; icon: string }[] = [
  { id: 'branch', label: 'New branch', desc: 'Create feat/<task> in the main checkout', icon: 'fork_right' },
  { id: 'worktree', label: 'Worktree', desc: 'Isolated checkout on a new branch — parallel-safe', icon: 'account_tree' },
  { id: 'current', label: 'Current branch', desc: 'Work in place, no new branch', icon: 'edit' },
  { id: 'auto', label: 'Let AI decide', desc: 'The agent picks worktree, branch, or current per task', icon: 'auto_awesome' }
]

export function ProjectSettingsDialog() {
  const { t } = useTranslation()
  const open = useStore((s) => s.projectSettingsOpen)
  const close = useStore((s) => s.closeProjectSettings)
  const config = useStore((s) => s.projectConfig)
  const branches = useStore((s) => s.branches)
  const save = useStore((s) => s.saveProjectConfig)
  const project = useStore((s) => s.project)
  if (!open) return null

  return (
    <Modal onClose={close} width={520} zIndex={58} panelStyle={{ padding: 20 }}>
      <DialogHeader icon="tune" title={t('projectSettings.title', 'Project settings')} subtitle={<>{t('projectSettings.gitFor', 'How Valkeon drives git for ')}<span style={{ color: 'var(--text-dim)' }}>{project?.name}</span>{t('projectSettings.savedTo', '. Saved to ')}<span style={{ fontFamily: "'Geist Mono', monospace" }}>.valkeon/config.json</span>.</>} />

      <div style={eyebrow}>{t('projectSettings.defaultTaskStrategy', 'DEFAULT TASK STRATEGY')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 18 }}>
        {STRATEGIES.map((s) => {
          const on = config.taskStrategy === s.id
          return (
            <Hover key={s.id} onClick={() => save({ taskStrategy: s.id })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 10, cursor: 'pointer', background: on ? 'var(--accent-soft)' : 'var(--surface)', border: `1px solid ${on ? 'var(--accent-line)' : 'var(--line)'}` }} hover={on ? undefined : { border: '1px solid var(--line-2)' }}>
              <Icon name={s.icon} size={19} color={on ? 'var(--accent-hi)' : 'var(--info)'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{t(`projectSettings.strategy_${s.id}_label`, s.label)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{t(`projectSettings.strategy_${s.id}_desc`, s.desc)}</div>
              </div>
              <Icon name={on ? 'radio_button_checked' : 'radio_button_unchecked'} size={17} color={on ? 'var(--accent-hi)' : 'var(--surface-4)'} />
            </Hover>
          )
        })}
      </div>

      <div style={eyebrow}>{t('projectSettings.baseBranch', 'BASE BRANCH')}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 8 }}>{t('projectSettings.baseBranchHint', 'Finished work merges into this branch (from the Worktrees view).')}</div>
      <input
        list="vw-branch-list"
        value={config.baseBranch}
        onChange={(e) => save({ baseBranch: e.target.value })}
        placeholder="main"
        style={{ ...inputStyle, marginBottom: 8, fontFamily: "'Geist Mono', monospace" }}
      />
      <datalist id="vw-branch-list">
        {branches.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>
      {branches.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
          {branches.slice(0, 8).map((b) => (
            <span key={b} onClick={() => save({ baseBranch: b })} style={segStyle(config.baseBranch === b)}>{b}</span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
        <Hover as="span" onClick={close} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 8, background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }} hover={{ filter: 'brightness(1.08)' }}>
          <Icon name="check" size={16} />{t('projectSettings.done', 'Done')}
        </Hover>
      </div>
    </Modal>
  )
}
