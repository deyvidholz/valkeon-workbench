import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'
import type { WorktreeDetails } from '@shared/git'

export function WorktreeDetailsDialog() {
  const { t } = useTranslation()
  const path = useStore((s) => s.worktreeDetailPath)
  const close = useStore((s) => s.closeWorktreeDetail)
  const project = useStore((s) => s.project)
  const projectConfig = useStore((s) => s.projectConfig)
  const setActiveWorktree = useStore((s) => s.setActiveWorktree)
  const go = useStore((s) => s.go)
  const removeWorktree = useStore((s) => s.removeWorktree)
  const mergeBranchToBase = useStore((s) => s.mergeBranchToBase)
  const askConfirm = useStore((s) => s.askConfirm)
  const [details, setDetails] = useState<WorktreeDetails | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!path || !project?.path) return
    setLoading(true)
    setDetails(null)
    const base = projectConfig.baseBranch || project.branch || 'main'
    void window.api?.git
      .worktreeDetails(project.path, path, base)
      .then((d) => setDetails(d))
      .catch(() => setDetails(null))
      .finally(() => setLoading(false))
  }, [path, project?.path, project?.branch, projectConfig.baseBranch])

  if (!path) return null
  const dirty = details ? details.dirtyFiles.length : 0

  const Row = ({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }): React.ReactNode => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--line)' }}>
      <Icon name={icon} size={16} color="var(--text-dim)" style={{ marginTop: 1 }} />
      <span style={{ fontSize: 11.5, color: 'var(--text-muted)', width: 92, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, minWidth: 0, fontSize: 12, color: 'var(--text-2)' }}>{children}</div>
    </div>
  )

  const actionBtn = (icon: string, label: string, on: () => void, danger = false): React.ReactNode => (
    <Hover as="span" onClick={on} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: `1px solid ${danger ? 'color-mix(in srgb, var(--danger) 40%, transparent)' : 'var(--line-2)'}`, color: danger ? 'var(--danger)' : 'var(--text-2)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }} hover={{ background: danger ? 'color-mix(in srgb, var(--danger) 12%, transparent)' : 'var(--surface-2)' }}>
      <Icon name={icon} size={15} />{label}
    </Hover>
  )

  return (
    <Modal onClose={close} width={560} zIndex={60} panelStyle={{ maxHeight: '82%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
        <Icon name="account_tree" size={18} color="var(--ai)" />
        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', fontFamily: "'Geist Mono', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{details?.branch || path.split('/').pop()}</span>
      </div>

      <div style={{ padding: '6px 18px 0', overflowY: 'auto', flex: 1 }}>
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: 12.5 }}>{t('worktreeDetail.loading', 'Loading…')}</div>
        ) : (
          <>
            <Row icon="fork_right" label={t('worktreeDetail.branch', 'Branch')}><span style={{ fontFamily: "'Geist Mono', monospace" }}>{details?.branch || '—'}</span></Row>
            <Row icon="folder" label={t('worktreeDetail.path', 'Path')}>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11 }}>{path}</span>
              <Hover as="span" onClick={() => void navigator.clipboard?.writeText(path).catch(() => {})} title={t('worktreeDetail.copyPath', 'Copy path')} style={{ marginLeft: 6, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: "'Material Symbols Rounded'", fontSize: 14 }} hover={{ color: 'var(--text-2)' }}>content_copy</Hover>
            </Row>
            <Row icon="commit" label={t('worktreeDetail.head', 'HEAD')}>
              <span style={{ fontFamily: "'Geist Mono', monospace" }}>{details?.head || '—'}</span> {details?.headSubject && <span style={{ color: 'var(--text-dim)' }}>{details.headSubject}</span>}
            </Row>
            <Row icon="difference" label={t('worktreeDetail.status', 'Status')}>
              <span style={{ color: dirty ? 'var(--warn)' : 'var(--ok)' }}>{dirty ? t('worktreeDetail.dirty', '{{n}} uncommitted change(s)', { n: dirty }) : t('worktreeDetail.clean', 'clean')}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontFamily: "'Geist Mono', monospace" }}>↑{details?.ahead ?? 0} ↓{details?.behind ?? 0}</span>
              {details?.mergedIntoBase && <span style={{ color: 'var(--ok)', marginLeft: 8 }}>{t('worktreeDetail.merged', 'merged')}</span>}
            </Row>
            {details && details.dirtyFiles.length > 0 && (
              <Row icon="edit_note" label={t('worktreeDetail.changed', 'Changed')}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 100, overflowY: 'auto' }}>
                  {details.dirtyFiles.slice(0, 40).map((f) => <span key={f} style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, color: 'var(--text-dim)' }}>{f}</span>)}
                </div>
              </Row>
            )}
            {details && details.recentCommits.length > 0 && (
              <div style={{ padding: '11px 0' }}>
                <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 7 }}>{t('worktreeDetail.recentCommits', 'RECENT COMMITS')}</div>
                {details.recentCommits.map((c) => (
                  <div key={c.hash} style={{ display: 'flex', gap: 9, padding: '3px 0', fontSize: 11.5 }}>
                    <span style={{ fontFamily: "'Geist Mono', monospace", color: 'var(--accent-hi)' }}>{c.hash}</span>
                    <span style={{ flex: 1, minWidth: 0, color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.subject}</span>
                    <span style={{ color: 'var(--text-faint)', flexShrink: 0 }}>{c.relative}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '12px 18px', borderTop: '1px solid var(--line)', flexWrap: 'wrap' }}>
        {actionBtn('code', t('worktreeDetail.openExplore', 'Open in Explore'), () => { setActiveWorktree(path); go('code'); close() })}
        {actionBtn('folder_open', t('worktreeDetail.openFolder', 'Open folder'), () => void window.api?.shell.openPath(path))}
        {details?.branch && actionBtn('merge', t('worktreeDetail.merge', 'Merge into base'), () => { mergeBranchToBase(details.branch, path); close() })}
        <div style={{ flex: 1 }} />
        {details?.branch && actionBtn('delete_outline', t('worktreeDetail.delete', 'Delete'), () => {
          askConfirm({
            title: t('worktrees.removeWorktree', 'Remove worktree'),
            message: t('worktrees.removeConfirmMsg', 'Remove the worktree for {{branch}}? The branch is kept — only the working copy is deleted.', { branch: details.branch }),
            confirmLabel: t('worktrees.removeWorktree', 'Remove worktree'),
            onConfirm: () => { removeWorktree(path, details.branch); close() }
          })
        }, true)}
      </div>
    </Modal>
  )
}
