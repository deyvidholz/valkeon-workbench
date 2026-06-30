import { useEffect, useState } from 'react'
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
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 26, borderRadius: 6, color: '#6f6f78', cursor: 'pointer', fontFamily: "'Material Symbols Rounded'", fontSize: size }}
      hover={danger ? { background: '#e0584e', color: '#fff' } : { background: '#16161c', color: '#cfcfd6' }}
    >
      {icon}
    </Hover>
  )
}

export function TitleBar() {
  const view = useStore((s) => s.view)
  const project = useStore((s) => s.project)
  const recents = useStore((s) => s.recents)
  const projectMenuOpen = useStore((s) => s.projectMenuOpen)
  const toggleProjectMenu = useStore((s) => s.toggleProjectMenu)
  const openProject = useStore((s) => s.openProject)
  const closeProject = useStore((s) => s.closeProject)
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
      title: 'Close project',
      message: 'Go back to the home screen? Running sessions and terminals in this project will be closed.',
      confirmLabel: 'Close project',
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
    <div className="drag" style={{ height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px 0 14px', background: '#0c0c0f', borderBottom: '1px solid #16161a' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg,var(--accent),var(--accent-hi))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 0 1px rgba(255,255,255,0.10) inset' }}>
          <LogoMark size={14} />
        </div>

        {isLauncher ? (
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e4e4ea', letterSpacing: '-0.01em' }}>Valkeon Workbench</span>
        ) : (
          <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
            <Hover as="span" onClick={confirmHome} title="Back to home" style={{ fontSize: 11, fontWeight: 600, color: '#73737c', letterSpacing: '-0.01em', padding: '3px 6px', borderRadius: 6, cursor: 'pointer' }} hover={{ background: '#15151a', color: '#cbcbd2' }}>
              Valkeon
            </Hover>
            <span style={{ color: '#33333a' }}>/</span>
            <Hover onClick={() => toggleProjectMenu()} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '3px 8px', borderRadius: 7, cursor: 'pointer' }} hover={{ background: '#15151a' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#e4e4ea' }}>{project?.name ?? 'project'}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: "'Geist Mono', monospace", fontSize: 10.5, color: '#7a7a83', background: '#141419', border: '1px solid #222229', padding: '1px 6px', borderRadius: 5 }}>
                <Icon name="fork_right" size={12} />
                {project?.branch ?? 'main'}
              </span>
              <Icon name="unfold_more" size={16} color="#56565e" />
            </Hover>
            {projectMenuOpen && (
              <>
                <div onClick={() => toggleProjectMenu(false)} className="no-drag" style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
                <div className="no-drag" style={{ position: 'absolute', top: 34, left: 24, zIndex: 50, width: 280, background: '#101014', border: '1px solid #25252d', borderRadius: 11, padding: 6, boxShadow: '0 18px 50px rgba(0,0,0,0.55)' }}>
                  {recents.length > 0 && <div style={{ fontSize: 10, color: '#62626b', letterSpacing: '0.06em', padding: '6px 9px 4px' }}>RECENT</div>}
                  {recents.slice(0, 5).map((r) => (
                    <Hover key={r.path} onClick={() => openRecent(r)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 9px', borderRadius: 8, cursor: 'pointer' }} hover={{ background: '#17171c' }}>
                      <Icon name="folder" size={16} color="var(--accent)" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, color: '#e4e4ea', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                        <div style={{ fontSize: 10, color: '#6b6b74', fontFamily: "'Geist Mono', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.path}</div>
                      </div>
                    </Hover>
                  ))}
                  <div style={{ height: 1, background: '#1d1d23', margin: '5px 8px' }} />
                  <Hover onClick={() => void openFromDialog()} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 9px', borderRadius: 8, cursor: 'pointer', color: '#cbcbd2', fontSize: 12.5 }} hover={{ background: '#17171c' }}>
                    <Icon name="folder_open" size={16} />Open another folder…
                  </Hover>
                  <Hover onClick={confirmHome} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 9px', borderRadius: 8, cursor: 'pointer', color: '#9a9aa3', fontSize: 12.5 }} hover={{ background: '#17171c' }}>
                    <Icon name="home" size={16} />Close project
                  </Hover>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        {!isLauncher && (
          <Hover className="no-drag" onClick={openPalette} style={{ display: 'flex', alignItems: 'center', gap: 8, width: 340, maxWidth: '42%', padding: '5px 11px', borderRadius: 8, background: '#0f0f13', border: '1px solid #1c1c22', cursor: 'text' }} hover={{ border: '1px solid #26262e' }}>
            <Icon name="search" size={15} color="#5f5f68" />
            <span style={{ fontSize: 12.5, color: '#62626b', flex: 1 }}>Search sessions, terminals, boards, cards</span>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 10.5, color: '#56565e', background: '#16161c', padding: '1px 5px', borderRadius: 4 }}>⌘K</span>
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
