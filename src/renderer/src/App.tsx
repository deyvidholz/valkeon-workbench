import { useEffect, useState } from 'react'
import { useStore } from './store/useStore'
import { applyAccent } from './theme/applyAccent'
import { TitleBar } from './components/TitleBar'
import { Sidebar } from './components/sidebar/Sidebar'
import { SearchPalette } from './components/SearchPalette'
import { ContextMenu } from './components/ContextMenu'
import { CloneDialog } from './dialogs/CloneDialog'
import { NewWorktreeDialog } from './dialogs/NewWorktreeDialog'
import { Launcher } from './screens/Launcher'
import { WorkspaceScreen } from './screens/WorkspaceScreen'
import { SessionScreen } from './screens/SessionScreen'
import { TerminalsScreen } from './screens/TerminalsScreen'
import { BoardScreen } from './screens/BoardScreen'
import { WorktreesScreen } from './screens/WorktreesScreen'
import { CodeScreen } from './screens/CodeScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { SkillsScreen } from './screens/SkillsScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { ConfirmDialog } from './dialogs/ConfirmDialog'
import { UpdateDialog } from './dialogs/UpdateDialog'
import { NewSessionDialog } from './dialogs/NewSessionDialog'
import { NewWorkspaceDialog } from './dialogs/NewWorkspaceDialog'
import { NewBoardDialog } from './dialogs/NewBoardDialog'
import { GenerateCardsDialog } from './dialogs/GenerateCardsDialog'
import { LabelManagerDialog } from './dialogs/LabelManagerDialog'
import { CardDrawer } from './dialogs/CardDrawer'
import { ReviewWindow } from './dialogs/ReviewWindow'
import { ProjectSettingsDialog } from './dialogs/ProjectSettingsDialog'
import { TableBuilder } from './dialogs/TableBuilder'
import { DiagramBuilder } from './dialogs/DiagramBuilder'
import { NameDialog } from './dialogs/NameDialog'
import { SkillEditor } from './dialogs/SkillEditor'
import type { ViewId } from './types'

function MainView({ view }: { view: ViewId }) {
  switch (view) {
    case 'workspace':
      return <WorkspaceScreen />
    case 'session':
      return <SessionScreen />
    case 'terminals':
      return <TerminalsScreen />
    case 'board':
      return <BoardScreen />
    case 'worktrees':
      return <WorktreesScreen />
    case 'code':
      return <CodeScreen />
    case 'history':
      return <HistoryScreen />
    case 'skills':
      return <SkillsScreen />
    case 'settings':
      return <SettingsScreen />
    default:
      return <WorkspaceScreen />
  }
}

export function App() {
  const view = useStore((s) => s.view)
  const accent = useStore((s) => s.accent)
  const setRecents = useStore((s) => s.setRecents)
  const hydrateSettings = useStore((s) => s.hydrateSettings)
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    applyAccent(accent)
  }, [accent])

  // Hydrate persisted global state (accent + recent projects) on boot.
  useEffect(() => {
    let active = true
    window.api?.settings
      .get()
      .then((s) => {
        if (active && s) hydrateSettings({ userName: s.userName, accent: s.accent, defaultProviderId: s.defaultProviderId, defaultModelId: s.defaultModelId, fontSize: s.terminalFontSize })
      })
      .catch(() => {})
    window.api?.recents
      .get()
      .then((rs) => {
        if (active && rs && rs.length) setRecents(rs.map((r) => ({ name: r.name, path: r.path, sessions: r.sessions, branch: r.branch })))
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [hydrateSettings, setRecents])

  useEffect(() => {
    window.api?.window.isMaximized().then(setMaximized).catch(() => {})
    return window.api?.window.onMaximizeChange(setMaximized)
  }, [])

  // Global PTY-exit reaper — end the session/terminal whose process exits,
  // even if its card isn't currently mounted (so it never silently respawns).
  useEffect(() => window.api?.pty.onExit((e) => useStore.getState().handlePtyExit(e.id)), [])

  // Global structured-agent event sink — accumulate events into the store even
  // when the session view isn't mounted (the store is the transcript's truth).
  useEffect(() => window.api?.agent.onEvent((p) => useStore.getState().applyAgentEvent(p.id, p.event)), [])

  // Clicking an OS notification opens the session it concerns.
  useEffect(() => window.api?.notify.onClicked((sessionId) => useStore.getState().openSession(sessionId)), [])

  // Activity-based session status: running while output flows, idle when quiet.
  useEffect(() => window.api?.pty.onData((e) => useStore.getState().noteSessionData(e.id)), [])
  useEffect(() => {
    const t = setInterval(() => useStore.getState().reapIdleSessions(), 3000)
    return () => clearInterval(t)
  }, [])

  // Confirm before quitting while sessions/terminals are open.
  useEffect(
    () =>
      window.api?.window.onCloseRequested(() => {
        const st = useStore.getState()
        const parts = [
          st.sessions.length ? `${st.sessions.length} AI session${st.sessions.length > 1 ? 's' : ''}` : '',
          st.terminals.length ? `${st.terminals.length} terminal${st.terminals.length > 1 ? 's' : ''}` : ''
        ]
          .filter(Boolean)
          .join(' and ')
        st.askConfirm({
          title: 'Quit Valkeon Workbench',
          message: parts ? `You have ${parts} open — they will be terminated. Quit anyway?` : 'Quit Valkeon Workbench?',
          confirmLabel: 'Quit',
          onConfirm: () => void window.api?.window.confirmClose()
        })
      }),
    []
  )

  // OS menu (File) actions.
  useEffect(() => {
    const offAction = window.api?.menu.onAction((action) => {
      const st = useStore.getState()
      if (action === 'new-session' && st.project) st.openNewSession()
      else if (action === 'new-terminal' && st.project) st.newTerminal()
      else if (action === 'close-project' && st.project)
        st.askConfirm({ title: 'Close project', message: 'Go back to the home screen? Running sessions and terminals will be closed.', confirmLabel: 'Close project', onConfirm: st.closeProject })
    })
    const offOpened = window.api?.menu.onOpenedProject((p) => useStore.getState().openProject(p))
    // Open a project passed on the command line (`valkeon <path>`), if any.
    void window.api?.cli?.pendingProject().then((p) => {
      if (p) useStore.getState().openProject(p)
    })
    return () => {
      offAction?.()
      offOpened?.()
    }
  }, [])

  // Keyboard shortcuts (⌘N / new-terminal go through the OS menu accelerators).
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        if (useStore.getState().closeOverlays()) e.preventDefault()
        return
      }
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      const st = useStore.getState()
      if (st.view === 'launcher') return
      const k = e.key.toLowerCase()
      if (k === 'k') {
        e.preventDefault()
        st.paletteOpen ? st.closePalette() : st.openPalette()
      } else if (k === 'l') {
        e.preventDefault()
        st.focusComposer()
      } else if (k === '\\') {
        e.preventDefault()
        const order: ('grid' | 'tabs' | 'split')[] = ['grid', 'tabs', 'split']
        st.setLayout(order[(order.indexOf(st.layout) + 1) % order.length])
      } else if (k === 'tab') {
        // ⌘⇥ is reserved by the OS; Ctrl+Tab cycles sessions here.
        e.preventDefault()
        st.cycleSession()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const isLauncher = view === 'launcher'

  return (
    <div className={maximized ? 'app maximized' : 'app'}>
      <TitleBar />
      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
        {isLauncher ? (
          <Launcher />
        ) : (
          <>
            <Sidebar />
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#08080a' }}>
              <MainView view={view} />
            </main>
          </>
        )}
      </div>

      {/* Overlays — each self-hides when its store flag is off */}
      <SearchPalette />
      <CloneDialog />
      <NewWorktreeDialog />
      <ProjectSettingsDialog />
      <NewSessionDialog />
      <NewWorkspaceDialog />
      <NewBoardDialog />
      <GenerateCardsDialog />
      <CardDrawer />
      <ReviewWindow />
      <LabelManagerDialog />
      <TableBuilder />
      <DiagramBuilder />
      <SkillEditor />
      <NameDialog />
      <ConfirmDialog />
      <UpdateDialog />
      <ContextMenu />
    </div>
  )
}
