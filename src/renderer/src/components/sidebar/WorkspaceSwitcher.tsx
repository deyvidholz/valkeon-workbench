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
          background: '#0e0e12',
          border: '1px solid #1c1c22',
          cursor: 'pointer'
        }}
        hover={{ border: '1px solid #27272f' }}
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
          <div style={{ fontSize: 10, color: '#62626b', letterSpacing: '0.06em' }}>WORKSPACE</div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#e4e4ea',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {active?.name}
          </div>
        </div>
        {active?.useWorktree && (
          <Icon name="account_tree" size={15} color="#b89cf0" title="Worktrees enabled" />
        )}
        <Icon name="unfold_more" size={18} color="#56565e" />
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
            background: '#101014',
            border: '1px solid #25252d',
            borderRadius: 11,
            padding: 6,
            boxShadow: '0 18px 50px rgba(0,0,0,0.55)'
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
                  background: isActive ? '#15151b' : 'transparent'
                }}
                hover={{ background: '#17171c' }}
              >
                <Icon name="workspaces" size={17} color={isActive ? 'var(--accent,#5b9dd9)' : '#74747d'} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: '#e4e4ea',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {w.name}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#6b6b74' }}>{count} sessions</div>
                </div>
                {w.useWorktree && <Icon name="account_tree" size={14} color="#b89cf0" />}
                {isActive && <Icon name="check" size={16} color="var(--accent,#5b9dd9)" />}
              </Hover>
            )
          })}
          <div style={{ height: 1, background: '#1d1d23', margin: '5px 8px' }} />
          <Hover
            onClick={openNewWs}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '9px 10px',
              borderRadius: 8,
              cursor: 'pointer',
              color: '#9a9aa3',
              fontSize: 13
            }}
            hover={{ background: '#17171c' }}
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
