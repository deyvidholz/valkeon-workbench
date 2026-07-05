import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'
import { Markdown } from '../components/Markdown'
import type { CleanupAction, WorktreeVerdict } from '../types'

const VERDICT_COLOR: Record<WorktreeVerdict['verdict'], string> = {
  dead: 'var(--danger)',
  review: 'var(--warn)',
  keep: 'var(--ok)'
}

export function WorktreeCleanupDialog() {
  const { t } = useTranslation()
  const open = useStore((s) => s.cleanupOpen)
  const run = useStore((s) => s.cleanupRun)
  const loading = useStore((s) => s.cleanupLoading)
  const close = useStore((s) => s.closeCleanup)
  const apply = useStore((s) => s.applyCleanupDecisions)
  const askConfirm = useStore((s) => s.askConfirm)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [analysis, setAnalysis] = useState<WorktreeVerdict | null>(null)

  if (!open) return null
  const verdicts = run?.verdicts ?? []
  const allSelected = verdicts.length > 0 && selected.size === verdicts.length

  const toggle = (p: string): void =>
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(p)) n.delete(p)
      else n.add(p)
      return n
    })
  const toggleAll = (): void => setSelected(allSelected ? new Set() : new Set(verdicts.map((v) => v.path)))

  const runAction = (action: CleanupAction, labelKey: string, labelDef: string): void => {
    const paths = [...selected]
    if (!paths.length) return
    if (action === 'keep') {
      void apply(paths, action)
      setSelected(new Set())
      return
    }
    askConfirm({
      title: t('cleanup.confirmTitle', 'Apply to {{count}} worktree(s)?', { count: paths.length }),
      message: t('cleanup.confirmMsg', 'This will {{action}}. This cannot be undone.', { action: t(labelKey, labelDef).toLowerCase() }),
      confirmLabel: t(labelKey, labelDef),
      onConfirm: () => {
        void apply(paths, action)
        setSelected(new Set())
      }
    })
  }

  const ACTIONS: { action: CleanupAction; icon: string; key: string; def: string; danger?: boolean }[] = [
    { action: 'keep', icon: 'check_circle', key: 'cleanup.keep', def: 'Keep' },
    { action: 'delete-worktree', icon: 'folder_delete', key: 'cleanup.deleteWorktree', def: 'Delete worktree', danger: true },
    { action: 'delete-worktree-branch', icon: 'delete_forever', key: 'cleanup.deleteBranch', def: 'Delete worktree + branch', danger: true },
    { action: 'merge-delete', icon: 'merge', key: 'cleanup.mergeDelete', def: 'Merge then delete' }
  ]

  return (
    <Modal onClose={close} width={640} zIndex={60} panelStyle={{ maxHeight: '82%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
        <Icon name="cleaning_services" size={18} color="var(--text-2)" />
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{t('cleanup.title', 'Worktree cleanup')}</span>
        <div style={{ flex: 1 }} />
        {!loading && (
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
            {t('cleanup.summary', '{{dead}} dead · {{review}} to review · {{keep}} keep', {
              dead: verdicts.filter((v) => v.verdict === 'dead').length,
              review: verdicts.filter((v) => v.verdict === 'review').length,
              keep: verdicts.filter((v) => v.verdict === 'keep').length
            })}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <span className="ms" style={{ fontSize: 26, animation: 'spin 1s linear infinite', color: 'var(--accent-hi)' }}>progress_activity</span>
          {t('cleanup.analyzing', 'Analyzing worktrees…')}
        </div>
      ) : verdicts.length === 0 ? (
        <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 12.5 }}>{t('cleanup.none', 'No worktrees to clean up.')}</div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px', borderBottom: '1px solid var(--line)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 11.5, color: 'var(--text-dim)' }}>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              {t('cleanup.selectAll', 'Select all')}
            </label>
            {selected.size > 0 && <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{t('cleanup.nSelected', '{{count}} selected', { count: selected.size })}</span>}
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {verdicts.map((v) => (
              <div key={v.path} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '11px 18px', borderBottom: '1px solid var(--line)' }}>
                <input type="checkbox" checked={selected.has(v.path)} onChange={() => toggle(v.path)} style={{ marginTop: 3 }} />
                <span style={{ marginTop: 1, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: VERDICT_COLOR[v.verdict], background: `color-mix(in srgb, ${VERDICT_COLOR[v.verdict]} 14%, transparent)`, padding: '2px 6px', borderRadius: 5, flexShrink: 0 }}>{v.verdict}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', fontFamily: "'Geist Mono', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.branch || v.path}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2, lineHeight: 1.4 }}>{v.oneLine}</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 10.5, color: 'var(--text-muted)', fontFamily: "'Geist Mono', monospace" }}>
                    <span>{t('cleanup.changes', '{{n}} changes', { n: v.changes })}</span>
                    <span>↑{v.ahead} ↓{v.behind}</span>
                    {v.merged && <span style={{ color: 'var(--ok)' }}>{t('cleanup.merged', 'merged')}</span>}
                  </div>
                </div>
                <Hover as="span" title={t('cleanup.viewAnalysis', 'Full analysis')} onClick={() => setAnalysis(v)} style={{ display: 'flex', width: 26, height: 26, borderRadius: 6, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0 }} hover={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
                  <Icon name="description" size={16} />
                </Hover>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderTop: '1px solid var(--line)', flexWrap: 'wrap' }}>
            {selected.size === 0 ? (
              <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{t('cleanup.selectHint', 'Select worktrees, then choose what to do.')}</span>
            ) : (
              <>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{t('cleanup.applyTo', 'Apply to {{count}}:', { count: selected.size })}</span>
                {ACTIONS.map((a) => (
                  <Hover key={a.action} as="span" onClick={() => runAction(a.action, a.key, a.def)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 7, border: `1px solid ${a.danger ? 'color-mix(in srgb, var(--danger) 40%, transparent)' : 'var(--line-2)'}`, color: a.danger ? 'var(--danger)' : 'var(--text-2)', fontSize: 11.5, fontWeight: 500, cursor: 'pointer' }} hover={{ background: a.danger ? 'color-mix(in srgb, var(--danger) 12%, transparent)' : 'var(--surface-2)' }}>
                    <Icon name={a.icon} size={14} />{t(a.key, a.def)}
                  </Hover>
                ))}
              </>
            )}
            <div style={{ flex: 1 }} />
            <Hover as="span" onClick={close} style={{ padding: '7px 14px', borderRadius: 8, color: 'var(--text-dim)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }} hover={{ background: 'var(--surface-2)' }}>{t('cleanup.done', 'Done')}</Hover>
          </div>
        </>
      )}

      {analysis && (
        <Modal onClose={() => setAnalysis(null)} width={520} zIndex={70} panelStyle={{ padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '13px 16px', borderBottom: '1px solid var(--line)' }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', color: VERDICT_COLOR[analysis.verdict], background: `color-mix(in srgb, ${VERDICT_COLOR[analysis.verdict]} 14%, transparent)`, padding: '2px 6px', borderRadius: 5 }}>{analysis.verdict}</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', fontFamily: "'Geist Mono', monospace" }}>{analysis.branch || analysis.path}</span>
          </div>
          <div style={{ padding: 16, overflowY: 'auto' }}>
            <Markdown source={analysis.analysis || analysis.oneLine} />
          </div>
        </Modal>
      )}
    </Modal>
  )
}
