import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { Icon } from '../ui/Icon'
import { LogoMark } from '../ui/LogoMark'
import { Hover } from '../ui/Hover'
import type { Recent } from '../types'

function WinButton({ icon, size, onClick, danger }: { icon: string; size: number; onClick: () => void; danger?: boolean }) {
  return (
    <Hover
      as="span"
      className="no-drag"
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 26, borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: "'Material Symbols Rounded'", fontSize: size }}
      hover={danger ? { background: 'var(--danger)', color: '#fff' } : { background: 'var(--surface-2)', color: 'var(--text-2)' }}
    >
      {icon}
    </Hover>
  )
}

export function TitleBar() {
  const { t } = useTranslation()
  const view = useStore((s) => s.view)
  const project = useStore((s) => s.project)
  const recents = useStore((s) => s.recents)
  const projectMenuOpen = useStore((s) => s.projectMenuOpen)
  const toggleProjectMenu = useStore((s) => s.toggleProjectMenu)
  const openProject = useStore((s) => s.openProject)
  const closeProject = useStore((s) => s.closeProject)
  const openProjectSettings = useStore((s) => s.openProjectSettings)
  const askConfirm = useStore((s) => s.askConfirm)
  const openPalette = useStore((s) => s.openPalette)
  const isLauncher = view === 'launcher'
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    window.api?.window.isMaximized().then(setMaximized).catch(() => {})
    return window.api?.window.onMaximizeChange(setMaximized)
  }, [])

  const confirmHome = (): void => {
    toggleProjectMenu(false)
    askConfirm({
      title: t('titleBar.closeProject', 'Close project'),
      message: t('titleBar.closeProjectMessage', 'Go back to the home screen? Running sessions and terminals in this project will be closed.'),
      confirmLabel: t('titleBar.closeProject', 'Close project'),
      onConfirm: closeProject
    })
  }
  const openFromDialog = async (): Promise<void> => {
    toggleProjectMenu(false)
    const res = await window.api?.openProject()
    if (res) openProject(res)
  }
  const openRecent = (r: Recent): void => {
    toggleProjectMenu(false)
    void window.api?.recents.add({ name: r.name, path: r.path, branch: r.branch, sessions: r.sessions, lastOpened: new Date().toISOString() })
    openProject({ name: r.name, path: r.path, branch: r.branch })
  }

  return (
    <div className="drag" style={{ height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px 0 14px', background: 'var(--bg)', borderBottom: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg,var(--accent),var(--accent-hi))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 0 1px rgba(255,255,255,0.10) inset' }}>
          <LogoMark size={14} />
        </div>

        {isLauncher ? (
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>{t('titleBar.appName', 'Valkeon Workbench')}</span>
        ) : (
          <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
            <Hover as="span" onClick={confirmHome} title={t('titleBar.backToHome', 'Back to home')} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '-0.01em', padding: '3px 6px', borderRadius: 6, cursor: 'pointer' }} hover={{ background: 'var(--surface)', color: 'var(--text-2)' }}>
              {t('titleBar.brand', 'Valkeon')}
            </Hover>
            <span style={{ color: 'var(--line-2)' }}>/</span>
            <Hover onClick={() => toggleProjectMenu()} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '3px 8px', borderRadius: 7, cursor: 'pointer' }} hover={{ background: 'var(--surface)' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{project?.name ?? t('titleBar.projectFallback', 'project')}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: "'Geist Mono', monospace", fontSize: 10.5, color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--line-2)', padding: '1px 6px', borderRadius: 5 }}>
                <Icon name="fork_right" size={12} />
                {project?.branch ?? 'main'}
              </span>
              <Icon name="unfold_more" size={16} color="var(--text-faint)" />
            </Hover>
            {projectMenuOpen && (
              <>
                <div onClick={() => toggleProjectMenu(false)} className="no-drag" style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
                <div className="no-drag" style={{ position: 'absolute', top: 34, left: 24, zIndex: 50, width: 280, background: 'var(--surface)', border: '1px solid var(--line-2)', borderRadius: 11, padding: 6, boxShadow: '0 18px 50px var(--shadow)' }}>
                  {recents.length > 0 && <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em', padding: '6px 9px 4px' }}>{t('titleBar.recent', 'RECENT')}</div>}
                  {recents.slice(0, 5).map((r) => (
                    <Hover key={r.path} onClick={() => openRecent(r)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 9px', borderRadius: 8, cursor: 'pointer' }} hover={{ background: 'var(--surface-2)' }}>
                      <Icon name="folder" size={16} color="var(--accent)" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'Geist Mono', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.path}</div>
                      </div>
                    </Hover>
                  ))}
                  <div style={{ height: 1, background: 'var(--line)', margin: '5px 8px' }} />
                  <Hover onClick={() => { toggleProjectMenu(false); openProjectSettings() }} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 9px', borderRadius: 8, cursor: 'pointer', color: 'var(--text-2)', fontSize: 12.5 }} hover={{ background: 'var(--surface-2)' }}>
                    <Icon name="tune" size={16} />{t('titleBar.projectSettings', 'Project settings…')}
                  </Hover>
                  <Hover onClick={() => void openFromDialog()} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 9px', borderRadius: 8, cursor: 'pointer', color: 'var(--text-2)', fontSize: 12.5 }} hover={{ background: 'var(--surface-2)' }}>
                    <Icon name="folder_open" size={16} />{t('titleBar.openAnotherFolder', 'Open another folder…')}
                  </Hover>
                  <Hover onClick={confirmHome} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 9px', borderRadius: 8, cursor: 'pointer', color: 'var(--text-dim)', fontSize: 12.5 }} hover={{ background: 'var(--surface-2)' }}>
                    <Icon name="home" size={16} />{t('titleBar.closeProject', 'Close project')}
                  </Hover>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        {!isLauncher && (
          <Hover className="no-drag" onClick={openPalette} style={{ display: 'flex', alignItems: 'center', gap: 8, width: 340, maxWidth: '42%', padding: '5px 11px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--line)', cursor: 'text' }} hover={{ border: '1px solid var(--line-2)' }}>
            <Icon name="search" size={15} color="var(--text-muted)" />
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)', flex: 1 }}>{t('titleBar.searchPlaceholder', 'Search sessions, terminals, boards, cards')}</span>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 10.5, color: 'var(--text-faint)', background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 4 }}>⌘K</span>
          </Hover>
        )}
      </div>

      <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <WinButton icon="remove" size={18} onClick={() => void window.api?.window.minimize()} />
        <WinButton icon={maximized ? 'filter_none' : 'crop_square'} size={15} onClick={() => void window.api?.window.toggleMaximize()} />
        <WinButton icon="close" size={18} danger onClick={() => void window.api?.window.close()} />
      </div>
    </div>
  )
}
