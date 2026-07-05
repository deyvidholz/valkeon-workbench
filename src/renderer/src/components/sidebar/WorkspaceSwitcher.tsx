import { useStore } from '../../store/useStore'
import { Icon } from '../../ui/Icon'
import { Hover } from '../../ui/Hover'

export function WorkspaceSwitcher() {
  const workspaces = useStore((s) => s.workspaces)
  const activeWorkspaceId = useStore((s) => s.activeWorkspaceId)
  const sessions = useStore((s) => s.sessions)
  const wsMenuOpen = useStore((s) => s.wsMenuOpen)
  const toggleWsMenu = useStore((s) => s.toggleWsMenu)
  const switchWorkspace = useStore((s) => s.switchWorkspace)
  const openNewWs = useStore((s) => s.openNewWs)

  const active = workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0]

  return (
    <div style={{ padding: '10px 12px 6px', position: 'relative' }}>
      <Hover
        onClick={() => toggleWsMenu()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 10px',
          borderRadius: 9,
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          cursor: 'pointer'
        }}
        hover={{ border: '1px solid var(--line-2)' }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: 'var(--accent-soft,rgba(91,157,217,0.13))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Icon name="workspaces" size={16} color="var(--accent,#5b9dd9)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>WORKSPACE</div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {active?.name}
          </div>
        </div>
        {active?.useWorktree && (
          <Icon name="account_tree" size={15} color="var(--ai)" title="Worktrees enabled" />
        )}
        <Icon name="unfold_more" size={18} color="var(--text-faint)" />
      </Hover>

      {wsMenuOpen && (
        <>
          <div
            onClick={() => toggleWsMenu(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 29 }}
          />
          <div
          style={{
            position: 'absolute',
            top: 48,
            left: 12,
            right: 12,
            zIndex: 30,
            background: 'var(--surface)',
            border: '1px solid var(--line-2)',
            borderRadius: 11,
            padding: 6,
            boxShadow: '0 18px 50px var(--shadow)'
          }}
        >
          {workspaces.map((w) => {
            const count = sessions.filter((s) => s.wsId === w.id).length
            const isActive = w.id === activeWorkspaceId
            return (
              <Hover
                key={w.id}
                onClick={() => switchWorkspace(w.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 10px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: isActive ? 'var(--surface)' : 'transparent'
                }}
                hover={{ background: 'var(--surface-2)' }}
              >
                <Icon name="workspaces" size={17} color={isActive ? 'var(--accent,#5b9dd9)' : 'var(--text-muted)'} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--text)',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {w.name}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{count} sessions</div>
                </div>
                {w.useWorktree && <Icon name="account_tree" size={14} color="var(--ai)" />}
                {isActive && <Icon name="check" size={16} color="var(--accent,#5b9dd9)" />}
              </Hover>
            )
          })}
          <div style={{ height: 1, background: 'var(--line)', margin: '5px 8px' }} />
          <Hover
            onClick={openNewWs}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '9px 10px',
              borderRadius: 8,
              cursor: 'pointer',
              color: 'var(--text-dim)',
              fontSize: 13
            }}
            hover={{ background: 'var(--surface-2)' }}
          >
            <Icon name="add" size={17} />
            New workspace
          </Hover>
          </div>
        </>
      )}
    </div>
  )
}
