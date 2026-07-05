import { useStore } from '../store/useStore'
import { Icon } from '../ui/Icon'
import { LogoMark } from '../ui/LogoMark'
import { Hover } from '../ui/Hover'
import type { Recent } from '../types'

export function Launcher() {
  const recents = useStore((s) => s.recents)
  const openProject = useStore((s) => s.openProject)
  const openClone = useStore((s) => s.openClone)

  const openFromDialog = async (): Promise<void> => {
    // The main process records the opened folder in recents (and allowlists it).
    const res = await window.api?.openProject()
    if (res) openProject(res)
  }
  const openRecent = (r: Recent): void => {
    // Bump the recent's lastOpened so re-opening keeps it at the top.
    void window.api?.recents.add({
      name: r.name,
      path: r.path,
      branch: r.branch,
      sessions: r.sessions,
      lastOpened: new Date().toISOString()
    })
    openProject({ name: r.name, path: r.path, branch: r.branch })
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 38,
        padding: 56,
        animation: 'fadein .4s ease',
        overflowY: 'auto'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, textAlign: 'center' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 15,
            background: 'linear-gradient(135deg,var(--accent,#5b9dd9),var(--accent-hi,#7cb3e6))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow:
              '0 12px 36px var(--accent-glow,rgba(91,157,217,0.22)),0 0 0 1px rgba(255,255,255,0.1) inset'
          }}
        >
          <LogoMark size={30} />
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.18em',
              color: 'var(--accent-hi,#7cb3e6)',
              textTransform: 'uppercase',
              marginBottom: 10
            }}
          >
            Valkeon Workbench
          </div>
          <div style={{ fontSize: 29, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text)' }}>
            Open a project
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 9 }}>
            Every AI coding session for your repo, in one window.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 11, marginTop: 6 }}>
          <Hover
            as="span"
            onClick={() => void openFromDialog()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 17px',
              borderRadius: 9,
              background: 'var(--accent,#5b9dd9)',
              color: 'var(--on-accent)',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer'
            }}
            hover={{ filter: 'brightness(1.08)' }}
          >
            <Icon name="folder_open" size={18} />
            Open project folder
          </Hover>
          <Hover
            as="span"
            onClick={openClone}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 17px',
              borderRadius: 9,
              background: 'var(--surface)',
              border: '1px solid var(--line-2)',
              color: 'var(--text-2)',
              fontSize: 13.5,
              fontWeight: 500,
              cursor: 'pointer'
            }}
            hover={{ background: 'var(--surface-2)' }}
          >
            <Icon name="cloud_download" size={18} />
            Clone from Git
          </Hover>
        </div>
      </div>

      {recents.length > 0 && (
      <div style={{ width: '100%', maxWidth: 680 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.09em',
            color: 'var(--text-muted)',
            marginBottom: 11
          }}
        >
          RECENT PROJECTS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {recents.map((r) => (
            <Hover
              key={r.path}
              onClick={() => openRecent(r)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 13,
                padding: '13px 15px',
                borderRadius: 11,
                background: 'var(--bg)',
                border: '1px solid var(--line)',
                cursor: 'pointer'
              }}
              hover={{ background: 'var(--surface)', border: '1px solid var(--line-2)' }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: 'var(--surface-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Icon name="folder" size={19} color="var(--accent,#5b9dd9)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{r.name}</div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: 'var(--text-muted)',
                    fontFamily: "'Geist Mono', monospace",
                    marginTop: 2
                  }}
                >
                  {r.path}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{r.sessions} sessions</span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: 10.5,
                    color: 'var(--text-muted)',
                    background: 'var(--surface)',
                    border: '1px solid var(--line-2)',
                    padding: '2px 7px',
                    borderRadius: 5
                  }}
                >
                  <Icon name="fork_right" size={12} />
                  {r.branch}
                </span>
                <Icon name="chevron_right" size={18} color="var(--text-faint)" />
              </div>
            </Hover>
          ))}
        </div>
      </div>
      )}
    </div>
  )
}
