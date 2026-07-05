import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'
import { StatusDot } from '../ui/StatusDot'
import type { WorktreeInfo, WorktreeStatus } from '@shared/git'

const STATUS_COLOR: Record<WorktreeStatus, string> = {
  clean: '#5cc98a',
  dirty: '#e0b15e',
  ahead: '#5b9dd9',
  unknown: '#6b6b74'
}

interface Row {
  branch: string
  path: string
  status: WorktreeStatus
  last: string
  sessionName: string | null
  sessionStatus: 'running' | 'waiting' | 'idle' | 'done' | null
}

export function WorktreesScreen() {
  const { t } = useTranslation()
  const project = useStore((s) => s.project)
  const sessions = useStore((s) => s.sessions)
  const wsId = useStore((s) => s.activeWorkspaceId)
  const openSession = useStore((s) => s.openSession)
  const askConfirm = useStore((s) => s.askConfirm)
  const setProjectIsRepo = useStore((s) => s.setProjectIsRepo)
  const openNewWorktree = useStore((s) => s.openNewWorktree)
  const removeWorktreeAction = useStore((s) => s.removeWorktree)
  const mergeBranchToBase = useStore((s) => s.mergeBranchToBase)
  const deleteBranch = useStore((s) => s.deleteBranch)
  const baseBranch = useStore((s) => s.projectConfig.baseBranch)
  const branches = useStore((s) => s.branches)
  const openProjectSettings = useStore((s) => s.openProjectSettings)
  const worktreesVersion = useStore((s) => s.worktreesVersion)
  const [gitTrees, setGitTrees] = useState<WorktreeInfo[] | null>(null)
  const [isRepo, setIsRepo] = useState<boolean | null>(null)
  const [initializing, setInitializing] = useState(false)

  const realPath = !!project?.path && project.path.startsWith('/')
  const load = (): void => {
    if (realPath && project) {
      void window.api?.git
        .isRepo(project.path)
        .then((repo) => {
          setIsRepo(repo)
          if (repo) void window.api?.git.worktrees(project.path).then(setGitTrees).catch(() => setGitTrees([]))
        })
        .catch(() => setIsRepo(false))
    } else {
      // Demo/seed project (no real path): pretend it's a repo so the list shows.
      setIsRepo(true)
    }
  }
  useEffect(load, [project?.path, worktreesVersion])

  const realRepo = realPath && isRepo === true

  const initGit = (): void => {
    if (!project) return
    setInitializing(true)
    void window.api?.git
      .init(project.path)
      .then(() => {
        setProjectIsRepo(true)
        setIsRepo(true)
        return window.api?.git.worktrees(project.path)
      })
      .then((trees) => trees && setGitTrees(trees))
      .catch(() => {})
      .finally(() => setInitializing(false))
  }

  const scoped = useMemo(() => sessions.filter((s) => s.wsId === wsId), [sessions, wsId])

  // Real git worktrees when available; otherwise derive from sessions for the demo.
  const rows: Row[] = useMemo(() => {
    if (gitTrees && gitTrees.length) {
      return gitTrees
        .filter((w) => !w.isMain)
        .map((w) => {
          const sess = scoped.find((s) => s.worktree && w.path.endsWith(s.worktree.replace(/^\.\.\//, '')))
          return { branch: w.branch || '(detached)', path: w.path, status: w.status, last: '—', sessionName: sess?.name ?? null, sessionStatus: sess?.status ?? null }
        })
    }
    return scoped
      .filter((s) => s.worktree)
      .map((s) => ({ branch: s.branch, path: s.worktree as string, status: 'clean' as WorktreeStatus, last: 'now', sessionName: s.name, sessionStatus: s.status }))
  }, [gitTrees, scoped])

  const mainTree = gitTrees?.find((w) => w.isMain)
  const mainPath = mainTree?.path ?? project?.path ?? '~/code/acme-platform'
  const mainBranch = mainTree?.branch ?? project?.branch ?? 'main'

  const removeWorktree = (path: string, branch: string): void => {
    askConfirm({
      title: t('worktrees.removeWorktree', 'Remove worktree'),
      message: t('worktrees.removeConfirmMsg', 'Remove the worktree for {{branch}}? The branch is kept — only the working copy is deleted.', { branch }),
      confirmLabel: t('worktrees.removeWorktree', 'Remove worktree'),
      onConfirm: () => {
        // Routes through the store so the removal is logged to history and the
        // sidebar switcher + local list stay in sync (via worktreesVersion).
        if (realRepo && project) removeWorktreeAction(path, branch)
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--line)', flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>{t('worktrees.title', 'Worktrees')}</div>
            <span style={{ fontSize: 10.5, color: 'var(--accent-hi)', fontFamily: "'Geist Mono', monospace", background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', padding: '2px 8px', borderRadius: 6 }}>{t('worktrees.activeCount', 'optional · {{count}} active', { count: rows.length })}</span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>{t('worktrees.subtitle', 'Isolated checkouts so sessions can work in parallel without colliding')}</div>
        </div>
        <Hover as="span" onClick={() => realRepo && openNewWorktree(`feature/${rows.length + 1}`)} title={realRepo ? t('worktrees.createWorktree', 'Create a worktree') : t('worktrees.initGitFirst', 'Initialize git first')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--line-2)', color: 'var(--text-2)', fontSize: 12.5, fontWeight: 500, cursor: realRepo ? 'pointer' : 'default', opacity: realRepo ? 1 : 0.5 }} hover={realRepo ? { background: 'var(--surface-2)' } : undefined}>
          <Icon name="add" size={16} />{t('worktrees.newWorktree', 'New worktree')}
        </Hover>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 28px', minHeight: 0 }}>
        {realPath && isRepo === false ? (
          <div style={{ minHeight: '70%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center' }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="account_tree" size={24} color="var(--text-faint)" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>{t('worktrees.notRepo', 'Not a git repository')}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, maxWidth: 360, lineHeight: 1.5 }}>
                {t('worktrees.notRepoDesc', 'Worktrees need git. Initialize this folder to enable isolated checkouts so sessions can work in parallel.')}
              </div>
            </div>
            <Hover as="span" onClick={initGit} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', opacity: initializing ? 0.6 : 1 }} hover={{ filter: 'brightness(1.08)' }}>
              <Icon name="account_tree" size={16} />
              {initializing ? t('worktrees.initializing', 'Initializing…') : t('worktrees.initGitRepo', 'Initialize git repository')}
            </Hover>
            <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
              {t('worktrees.createsRepoPrefix', 'Creates a repo with')} <span style={{ fontFamily: "'Geist Mono', monospace", color: 'var(--text-dim)' }}>main</span> {t('worktrees.createsRepoSuffix', 'as the default branch')}
            </div>
          </div>
        ) : (
          <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 11, background: 'var(--bg)', border: '1px solid var(--line)', marginBottom: 16 }}>
          <Icon name="home_storage" size={20} color="var(--text-dim)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{t('worktrees.mainCheckout', 'main checkout')}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'Geist Mono', monospace", marginTop: 2 }}>{mainPath}</div>
          </div>
          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, color: 'var(--text-dim)' }}>{mainBranch}</span>
          <span style={{ fontSize: 11, color: 'var(--ok)', fontFamily: "'Geist Mono', monospace", width: 92, textAlign: 'right' }}>{t('worktrees.clean', 'clean')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px 6px' }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{t('worktrees.linkedWorktrees', 'LINKED WORKTREES')}</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('worktrees.mergesInto', 'merges into')} <span style={{ fontFamily: "'Geist Mono', monospace", color: 'var(--text-dim)' }}>{baseBranch}</span></span>
          <Hover as="span" title={t('worktrees.projectSettings', 'Project settings')} onClick={openProjectSettings} style={{ display: 'flex', width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
            <Icon name="tune" size={14} />
          </Hover>
        </div>
        {rows.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-faint)', padding: '14px 4px' }}>{t('worktrees.noLinked', 'No linked worktrees. New sessions can create one.')}</div>}
        {rows.map((w, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 12px', borderRadius: 9 }}>
            <Icon name="account_tree" size={18} color="var(--accent)" />
            <div style={{ width: 184, flexShrink: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-2)', fontFamily: "'Geist Mono', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.branch}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: "'Geist Mono', monospace", marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.path}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {w.sessionName && w.sessionStatus ? (
                <Hover as="span" onClick={() => { const s = scoped.find((x) => x.name === w.sessionName); if (s) openSession(s.id) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-dim)', cursor: 'pointer' }} hover={{ color: 'var(--text-2)' }}>
                  <StatusDot status={w.sessionStatus} />{w.sessionName}
                </Hover>
              ) : (
                <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{t('worktrees.noActiveSession', 'no active session')}</span>
              )}
            </div>
            <span style={{ fontSize: 11, fontFamily: "'Geist Mono', monospace", color: STATUS_COLOR[w.status], width: 92, textAlign: 'right' }}>{w.status}</span>
            <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: "'Geist Mono', monospace", width: 38, textAlign: 'right' }}>{w.last}</span>
            {w.branch !== baseBranch && w.branch !== '(detached)' && (
              <Hover as="span" title={t('worktrees.mergeIntoFull', 'Merge into {{branch}} (commits work, then removes the worktree)', { branch: baseBranch })} onClick={() => mergeBranchToBase(w.branch, w.path)} style={{ fontFamily: "'Material Symbols Rounded'", fontSize: 17, color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ color: 'var(--ok)' }}>merge</Hover>
            )}
            <Hover as="span" title={t('worktrees.openFolder', 'Open folder')} onClick={() => window.api?.shell.openPath(w.path)} style={{ fontFamily: "'Material Symbols Rounded'", fontSize: 17, color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ color: 'var(--text-2)' }}>folder_open</Hover>
            <Hover as="span" title={t('worktrees.removeWorktree', 'Remove worktree')} onClick={() => removeWorktree(w.path, w.branch)} style={{ fontFamily: "'Material Symbols Rounded'", fontSize: 17, color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ color: 'var(--danger)' }}>delete_outline</Hover>
          </div>
        ))}

        {(() => {
          const wtBranches = new Set(rows.map((r) => r.branch))
          const other = branches.filter((b) => b !== baseBranch && !wtBranches.has(b))
          if (!other.length) return null
          return (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-muted)', padding: '18px 4px 6px' }}>{t('worktrees.otherBranches', 'OTHER BRANCHES')}</div>
              {other.map((b) => (
                <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 12px', borderRadius: 9 }}>
                  <Icon name="fork_right" size={17} color="var(--text-dim)" />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: 'var(--text-2)', fontFamily: "'Geist Mono', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b}</span>
                  <Hover as="span" title={t('worktrees.mergeInto', 'Merge into {{branch}}', { branch: baseBranch })} onClick={() => mergeBranchToBase(b, null)} style={{ fontFamily: "'Material Symbols Rounded'", fontSize: 17, color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ color: 'var(--ok)' }}>merge</Hover>
                  <Hover as="span" title={t('worktrees.deleteBranch', 'Delete branch')} onClick={() => deleteBranch(b)} style={{ fontFamily: "'Material Symbols Rounded'", fontSize: 17, color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ color: 'var(--danger)' }}>delete_outline</Hover>
                </div>
              ))}
            </>
          )
        })()}
          </>
        )}
      </div>
    </div>
  )
}
