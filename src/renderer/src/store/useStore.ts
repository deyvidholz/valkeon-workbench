import { create } from 'zustand'
import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing'
import { DEFAULT_PROVIDER_ID, getProviderMeta } from '@shared/agents/providers'
import type { BoardCard, WorkspaceRecord } from '@shared/persistence/types'
import type { SkillSave } from '@shared/skills'
import type { WorktreeInfo } from '@shared/git'
import type { AgentEvent } from '@shared/agents/types'
import type { ContextSourceId } from '@shared/context'
import type {
  Board,
  BoardScope,
  Card,
  ColumnId,
  ConfirmConfig,
  ContextMenuItem,
  HistoryEntry,
  HistoryKind,
  LayoutMode,
  Project,
  Recent,
  Session,
  SessionMode,
  Skill,
  Terminal,
  ViewId,
  Workspace
} from '../types'
import { DEFAULT_ACCENT } from '../theme/accents'
import { BOARD_COLUMNS, DEFAULT_LABELS, LABEL_PALETTE } from '../data/seed'

const uid = (prefix: string): string => `${prefix}-${crypto.randomUUID()}`
const slugify = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 28) || 'item'
const cap = (s: string): string => (s ? s[0].toUpperCase() + s.slice(1) : s)

/** Per-session last-output timestamp, for the activity-based running/idle status. */
const lastActivity = new Map<string, number>()

let historyTimer: ReturnType<typeof setTimeout> | null = null

interface NewSessionForm {
  name: string
  providerId: string
  modelId: string
  worktree: boolean
  skipPerms: boolean
  mode: SessionMode
}

interface HistoryTarget {
  kind: 'session' | 'board' | 'card'
  id: string
  boardId?: string
}

interface AppState {
  // navigation / chrome
  view: ViewId
  project: Project | null
  activeWorkspaceId: string
  activeSessionId: string | null
  activeBoardId: string | null
  activeWorktreePath: string | null
  selectedSkillId: string | null
  skillEditorId: string | null
  layout: LayoutMode
  accent: string
  userName: string
  fontSize: number
  defaultProviderId: string
  defaultModelId: string

  // menus / overlays
  wsMenuOpen: boolean
  projectMenuOpen: boolean
  boardMenuOpen: boolean
  drawerCardId: string | null
  draftCardId: string | null
  cardTab: 'write' | 'preview'
  labelMenuOpen: boolean
  paletteOpen: boolean
  paletteQuery: string

  // dialogs
  newSessionOpen: boolean
  newWsOpen: boolean
  newBoardOpen: boolean
  genOpen: boolean
  labelMgrOpen: boolean
  tableOpen: boolean
  diagOpen: boolean
  nameDialogOpen: boolean
  cloneOpen: boolean
  newWorktreeOpen: boolean
  confirm: ConfirmConfig | null
  contextMenu: { x: number; y: number; items: ContextMenuItem[] } | null

  // dialog form state
  cloneUrl: string
  cloning: boolean
  cloneError: string | null
  newWorktreeName: string
  worktreesVersion: number
  newSession: NewSessionForm
  newWs: { name: string; useWorktree: boolean }
  newBoard: { name: string; scope: BoardScope }
  genText: string
  newLabel: { name: string; color: string }
  table: { headers: string[]; rows: string[][] }
  diagText: string

  // pty lifecycle
  ptyNonce: Record<string, number>

  // composer to focus (for the ⌘L shortcut)
  focusComposerToken: number

  // data
  workspaces: Workspace[]
  sessions: Session[]
  terminals: Terminal[]
  recents: Recent[]
  boards: Board[]
  skills: Skill[]
  history: HistoryEntry[]
  worktrees: WorktreeInfo[]

  /** Append callback registered by the currently-focused markdown editor (for the Table/Diagram builders). */
  mdAppend: ((md: string) => void) | null

  // ---- actions ----
  go: (view: ViewId) => void
  openProject: (project: Project) => void
  closeProject: () => void
  setProjectIsRepo: (isGitRepo: boolean) => void
  switchWorkspace: (id: string) => void
  toggleWsMenu: (open?: boolean) => void
  toggleProjectMenu: (open?: boolean) => void
  setLayout: (layout: LayoutMode) => void
  openSession: (id: string) => void
  setRecents: (recents: Recent[]) => void
  hydrateSettings: (s: { userName: string; accent: string; defaultProviderId: string; defaultModelId: string; fontSize: number }) => void
  setUserName: (name: string) => void
  openNameDialog: () => void
  closeNameDialog: () => void
  focusComposer: () => void
  closeOverlays: () => boolean
  handlePtyExit: (ptyId: string) => void

  // palette
  openPalette: () => void
  closePalette: () => void
  setPaletteQuery: (q: string) => void

  // sessions
  openNewSession: () => void
  closeNewSession: () => void
  setNewSession: (patch: Partial<NewSessionForm>) => void
  createSession: () => void
  endSession: (id: string) => void
  restartSession: (id: string) => void
  clearInitialPrompt: (id: string) => void
  /** Structured sessions: apply one streamed agent event to the session. */
  applyAgentEvent: (id: string, event: AgentEvent) => void
  /** Structured sessions: send a user turn to the agent. */
  sendToAgent: (id: string, text: string) => void
  /** Structured sessions: toggle a context source for the *next* fresh start. */
  toggleContextSource: (id: string, source: ContextSourceId) => void
  cycleSession: () => void
  reorderSessions: (fromId: string, toId: string) => void
  setActiveSession: (id: string) => void
  setSessionModel: (id: string, modelId: string) => void
  noteSessionData: (ptyId: string) => void
  reapIdleSessions: () => void
  closeAllSessions: () => void

  // terminals
  newTerminal: () => void
  closeTerminal: (id: string) => void
  endTerminal: (id: string) => void
  reorderTerminals: (fromId: string, toId: string) => void
  closeAllTerminals: () => void

  // context menu / clone / worktree dialog
  openContextMenu: (x: number, y: number, items: ContextMenuItem[]) => void
  closeContextMenu: () => void
  openClone: () => void
  closeClone: () => void
  setCloneUrl: (url: string) => void
  doClone: () => void
  openNewWorktree: (suggested: string) => void
  closeNewWorktree: () => void
  setNewWorktreeName: (name: string) => void
  createWorktree: (name: string) => void
  removeWorktree: (dir: string, branch: string) => void
  loadWorktrees: () => void
  reconcileWorktrees: (list: WorktreeInfo[]) => void
  setActiveWorktree: (path: string | null) => void

  // workspaces
  openNewWs: () => void
  closeNewWs: () => void
  setNewWs: (patch: Partial<{ name: string; useWorktree: boolean }>) => void
  createWorkspace: () => void

  // boards
  toggleBoardMenu: (open?: boolean) => void
  selectBoard: (id: string) => void
  openNewBoard: () => void
  closeNewBoard: () => void
  setNewBoard: (patch: Partial<{ name: string; scope: BoardScope }>) => void
  createBoard: () => void
  addCardTo: (col: ColumnId) => void
  openCard: (id: string) => void
  closeDrawer: () => void
  setCardTab: (tab: 'write' | 'preview') => void
  updateCard: (id: string, patch: Partial<Card>) => void
  appendToCardBody: (md: string) => void
  deleteCard: (id: string) => void
  moveCard: (id: string, col: ColumnId) => void
  moveCardTo: (id: string, col: ColumnId, beforeCardId: string | null) => void
  reorderColumns: (fromId: string, toId: string) => void
  startTask: (id: string) => void
  toggleLabelMenu: (open?: boolean) => void
  toggleCardLabel: (labelId: string) => void

  // generate
  openGen: () => void
  closeGen: () => void
  setGenText: (t: string) => void
  generateCards: () => void

  // labels
  openLabelMgr: () => void
  closeLabelMgr: () => void
  setNewLabel: (patch: Partial<{ name: string; color: string }>) => void
  addBoardLabel: () => void
  deleteBoardLabel: (labelId: string) => void
  cycleLabelColor: (labelId: string) => void

  // table / diagram builders
  openTable: () => void
  closeTable: () => void
  setTable: (table: { headers: string[]; rows: string[][] }) => void
  insertTable: () => void
  openDiag: () => void
  closeDiag: () => void
  setDiagText: (t: string) => void
  insertDiagram: () => void
  setMdAppend: (fn: ((md: string) => void) | null) => void

  // skills
  selectSkill: (id: string) => void
  toggleSkill: (id: string) => void
  runSkill: (id: string) => void
  newSkill: () => void
  openSkillEditor: (id: string) => void
  closeSkillEditor: () => void
  saveSkill: (save: SkillSave) => void
  reloadSkills: () => void

  // settings
  setAccent: (accent: string) => void
  setFontSize: (n: number) => void
  setDefaultModel: (id: string) => void

  // confirm
  askConfirm: (config: ConfirmConfig) => void
  closeConfirm: () => void
}

const firstSessionId = (sessions: Session[], wsId: string): string | null =>
  sessions.find((s) => s.wsId === wsId)?.id ?? null
const firstBoardId = (boards: Board[], wsId: string): string | null =>
  boards.find((b) => b.wsId === wsId)?.id ?? null

const newCardCode = (boards: Board[]): number =>
  boards.flatMap((b) => b.cards).reduce((max, c) => Math.max(max, c.code), 0) + 1

const lastOrderInColumn = (board: Board, col: ColumnId): string | null => {
  const orders = board.cards.filter((c) => c.column === col).map((c) => c.order).sort()
  return orders.length ? orders[orders.length - 1] : null
}

const toShared = (c: Card): BoardCard => ({
  id: c.id,
  code: c.code,
  column: c.column,
  order: c.order,
  title: c.title,
  body: c.body,
  labels: c.labels,
  link: c.link,
  attachments: c.attachments
})

const arrayMove = <T extends { id: string }>(list: T[], fromId: string, toId: string): T[] => {
  const from = list.findIndex((x) => x.id === fromId)
  const to = list.findIndex((x) => x.id === toId)
  if (from < 0 || to < 0 || from === to) return list
  const next = [...list]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export const useStore = create<AppState>((set, get) => {
  const updateActiveBoard = (mut: (board: Board) => Board): void => {
    const st = get()
    const boardId = st.activeBoardId ?? firstBoardId(st.boards, st.activeWorkspaceId)
    if (!boardId) return
    set({ boards: st.boards.map((b) => (b.id === boardId ? mut(b) : b)) })
  }

  const realPath = (): string | null => {
    const path = get().project?.path
    return path && path.startsWith('/') ? path : null
  }
  const persistCard = (boardId: string, card: Card): void => {
    const path = realPath()
    if (path) void window.api?.boards.saveCard(path, boardId, toShared(card)).catch(() => {})
  }
  const persistDeleteCard = (boardId: string, cardId: string): void => {
    const path = realPath()
    if (path) void window.api?.boards.deleteCard(path, boardId, cardId).catch(() => {})
  }
  const persistWorkspaces = (): void => {
    const path = realPath()
    if (!path) return
    const st = get()
    const records: WorkspaceRecord[] = st.workspaces.map((w) => ({
      id: w.id,
      name: w.name,
      useWorktree: w.useWorktree,
      boardIds: st.boards.filter((b) => b.wsId === w.id).map((b) => b.id)
    }))
    void window.api?.boards.saveWorkspaces(path, records).catch(() => {})
  }

  const currentBoard = (st: AppState): Board | undefined => {
    const id = st.activeBoardId ?? firstBoardId(st.boards, st.activeWorkspaceId)
    return st.boards.find((b) => b.id === id)
  }

  /**
   * Move a Start-task card to "In Review" once its structured agent finishes a
   * turn. Only advances from `in-progress`, so it fires once and never fights a
   * column the human moved by hand.
   */
  const advanceTaskCard = (boardId: string, cardId: string): void => {
    const st = get()
    const board = st.boards.find((b) => b.id === boardId)
    const card = board?.cards.find((c) => c.id === cardId)
    if (!board || !card || card.column !== 'in-progress') return
    const colName = board.columns.find((c) => c.id === 'in-review')?.name ?? 'In Review'
    const updated: Card = {
      ...card,
      column: 'in-review',
      activity: [{ icon: 'rate_review', text: `Agent finished — moved to ${colName}`, time: 'now', color: '#e0b15e' }, ...card.activity]
    }
    set((s) => ({
      boards: s.boards.map((b) => (b.id === boardId ? { ...b, cards: b.cards.map((c) => (c.id === cardId ? updated : c)) } : b))
    }))
    persistCard(boardId, updated)
    log({ kind: 'card', icon: 'east', color: '#e0b15e', label: `Moved card #${card.code} to ${colName}`, detail: board.name, target: { kind: 'card', id: cardId, boardId } })
  }

  /** Drop a just-created card if the drawer closes while it's still an empty default. */
  const maybeDiscardDraft = (): void => {
    const st = get()
    if (!st.draftCardId || st.drawerCardId !== st.draftCardId) return
    const board = currentBoard(st)
    const card = board?.cards.find((c) => c.id === st.draftCardId)
    if (
      board &&
      card &&
      (card.title.trim() === '' || card.title.trim() === 'New card') &&
      !card.body.trim() &&
      !card.labels.length &&
      !card.link.branch &&
      !card.link.worktree &&
      !card.attachments.length
    ) {
      updateActiveBoard((b) => ({ ...b, cards: b.cards.filter((c) => c.id !== card.id) }))
      persistDeleteCard(board.id, card.id)
    }
  }

  const log = (entry: {
    kind: HistoryKind
    icon: string
    color?: string
    label: string
    detail: string
    target?: HistoryTarget
  }): void => {
    const st = get()
    const item: HistoryEntry = {
      id: uid('h'),
      wsId: st.activeWorkspaceId,
      ts: Date.now(),
      ...entry
    }
    set((s) => ({ history: [item, ...s.history].slice(0, 300) }))
    // Persist (debounced) so history survives reopening the project.
    const path = realPath()
    if (path) {
      if (historyTimer) clearTimeout(historyTimer)
      historyTimer = setTimeout(() => void window.api?.history.save(path, get().history).catch(() => {}), 800)
    }
  }

  const orderForDrop = (board: Board, col: ColumnId, movingId: string, beforeCardId: string | null): string => {
    const colCards = board.cards
      .filter((c) => c.column === col && c.id !== movingId)
      .sort((a, b) => (a.order < b.order ? -1 : 1))
    if (!beforeCardId) {
      return generateKeyBetween(colCards.length ? colCards[colCards.length - 1].order : null, null)
    }
    const idx = colCards.findIndex((c) => c.id === beforeCardId)
    if (idx < 0) return generateKeyBetween(colCards.length ? colCards[colCards.length - 1].order : null, null)
    const before = idx > 0 ? colCards[idx - 1].order : null
    const after = colCards[idx].order
    return generateKeyBetween(before, after)
  }

  const killPty = (id: string): void => window.api?.pty.kill(id)

  const spawnSession = (form: NewSessionForm): void => {
    const st = get()
    const name = form.name.trim() || 'new-session'
    const slug = slugify(name)
    const id = uid('s')
    const meta = getProviderMeta(form.providerId)
    const model = meta?.models.find((m) => m.id === form.modelId)
    const branch = `feat/${slug}`
    const project = st.project
    let worktree: string | null = st.activeWorktreePath
    let cwd = st.activeWorktreePath ?? project?.path
    let cwdReady: Promise<unknown> | undefined

    if (form.worktree && project?.path && project.path.startsWith('/')) {
      const parent = project.path.replace(/\/[^/]+$/, '')
      worktree = `${parent}/${project.name}.wt/${slug}`
      cwd = worktree
      cwdReady = window.api?.git.addWorktree(project.path, branch, worktree).catch(() => {})
    }

    const session: Session = {
      id,
      wsId: st.activeWorkspaceId,
      name,
      providerId: form.providerId,
      modelId: form.modelId,
      model: model?.label ?? form.modelId,
      status: 'running',
      branch,
      worktree,
      duration: '0m',
      task: 'Starting…',
      tokens: { used: 0, limit: 200 },
      files: [],
      lines: [],
      live: true,
      cwd: cwd ?? undefined,
      skipPermissions: form.skipPerms,
      startedAt: Date.now(),
      mode: form.mode,
      // Structured sessions start with no context sources — zero added cost until
      // the user opts one in. (Start-task seeds the card source itself.)
      contextSources: form.mode === 'structured' ? [] : undefined
    }
    set({ sessions: [...st.sessions, session], newSessionOpen: false, view: 'session', activeSessionId: id })
    if (form.mode === 'structured') startStructured(session, undefined, cwdReady)
    log({ kind: 'session', icon: 'add_circle', color: '#7cb3e6', label: `Started session ${name}`, detail: branch, target: { kind: 'session', id } })
  }

  /**
   * Boot a structured session's stream-json process. Waits for any worktree to
   * finish being created (so the agent's cwd actually exists and it doesn't
   * silently fall back to $HOME), builds the context preamble from the session's
   * enabled sources, then starts the agent and optionally sends an opening turn.
   */
  const startStructured = (session: Session, firstTurn?: string, cwdReady?: Promise<unknown>): void => {
    const repoPath = realPath()
    const launch = (preamble: string): void => {
      void window.api?.agent
        .start({
          id: session.id,
          providerId: session.providerId,
          modelId: session.modelId,
          cwd: session.cwd ?? repoPath ?? '~',
          skipPermissions: session.skipPermissions,
          contextPreamble: preamble
        })
        .then((res) => {
          if (res && !res.ok) {
            get().applyAgentEvent(session.id, { kind: 'line', line: { type: 'err', text: res.error ?? 'Failed to start the agent.' } })
            get().applyAgentEvent(session.id, { kind: 'status', status: 'idle' })
            return
          }
          if (res?.spawned && firstTurn?.trim()) get().sendToAgent(session.id, firstTurn.trim())
        })
        .catch(() => {})
    }
    const proceed = (): void => {
      const sources = session.contextSources ?? []
      if (sources.length && repoPath) {
        void window.api?.context
          .build({ repoPath, sources, boardId: session.boardId, cardId: session.cardId, branch: session.branch, worktree: session.worktree })
          .then((r) => launch(r.preamble))
          .catch(() => launch(''))
      } else {
        launch('')
      }
    }
    if (cwdReady) void Promise.resolve(cwdReady).then(proceed, proceed)
    else proceed()
  }

  return {
    view: 'launcher',
    project: null,
    activeWorkspaceId: '',
    activeSessionId: null,
    activeBoardId: null,
    activeWorktreePath: null,
    selectedSkillId: null,
    skillEditorId: null,
    layout: 'grid',
    accent: DEFAULT_ACCENT,
    userName: '',
    fontSize: 12,
    defaultProviderId: DEFAULT_PROVIDER_ID,
    defaultModelId: getProviderMeta(DEFAULT_PROVIDER_ID)?.defaultModelId ?? 'sonnet',

    wsMenuOpen: false,
    projectMenuOpen: false,
    boardMenuOpen: false,
    drawerCardId: null,
    draftCardId: null,
    cardTab: 'write',
    labelMenuOpen: false,
    paletteOpen: false,
    paletteQuery: '',

    newSessionOpen: false,
    newWsOpen: false,
    newBoardOpen: false,
    genOpen: false,
    labelMgrOpen: false,
    tableOpen: false,
    diagOpen: false,
    nameDialogOpen: false,
    cloneOpen: false,
    newWorktreeOpen: false,
    confirm: null,
    contextMenu: null,

    cloneUrl: '',
    cloning: false,
    cloneError: null,
    newWorktreeName: '',
    worktreesVersion: 0,

    newSession: { name: '', providerId: DEFAULT_PROVIDER_ID, modelId: 'sonnet', worktree: false, skipPerms: false, mode: 'structured' },
    newWs: { name: '', useWorktree: false },
    newBoard: { name: '', scope: 'feature' },
    genText: '',
    newLabel: { name: '', color: LABEL_PALETTE[0] },
    table: { headers: ['Column 1', 'Column 2'], rows: [['', ''], ['', '']] },
    diagText: 'flowchart TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[Do it]\n  B -->|No| D[Skip]',

    ptyNonce: {},
    focusComposerToken: 0,

    workspaces: [],
    sessions: [],
    terminals: [],
    recents: [],
    boards: [],
    skills: [],
    history: [],
    worktrees: [],
    mdAppend: null,

    go: (view) => set({ view, wsMenuOpen: false, boardMenuOpen: false, projectMenuOpen: false, drawerCardId: null }),

    openProject: (project) => {
      const wsId = 'ws-default'
      set({
        project,
        view: 'workspace',
        wsMenuOpen: false,
        projectMenuOpen: false,
        workspaces: [{ id: wsId, name: project.name, useWorktree: !!project.isGitRepo }],
        activeWorkspaceId: wsId,
        sessions: [],
        terminals: [],
        boards: [],
        skills: [],
        history: [],
        worktrees: [],
        activeWorktreePath: null,
        activeSessionId: null,
        activeBoardId: null
      })
      if (project.path && project.path.startsWith('/')) {
        void window.api?.history.load(project.path).then((h) => set({ history: h as HistoryEntry[] })).catch(() => {})
        get().loadWorktrees()
        void window.api?.boards
          .load(project.path)
          .then((data) => {
            if (!data?.boards?.length) return
            const records = data.workspaces ?? []
            const wsForBoard = (boardId: string): string =>
              records.find((r) => r.boardIds.includes(boardId))?.id ?? wsId
            const loaded: Board[] = data.boards.map((b) => ({
              ...b,
              wsId: wsForBoard(b.id),
              cards: b.cards.map((c) => ({ ...c, sessionId: null, agent: false, activity: [] }))
            }))
            set((st) => ({
              workspaces: records.length
                ? records.map((r) => ({ id: r.id, name: r.name, useWorktree: r.useWorktree }))
                : st.workspaces,
              boards: loaded,
              activeBoardId: loaded[0].id,
              activeWorkspaceId: loaded[0].wsId
            }))
          })
          .catch(() => {})
        void window.api?.skills
          .list(project.path)
          .then((skills) => set({ skills, selectedSkillId: skills[0]?.id ?? null }))
          .catch(() => {})
      }
    },

    closeProject: () => {
      const st = get()
      st.sessions.forEach((s) =>
        s.mode === 'structured' ? window.api?.agent.dispose(s.id) : killPty(`${s.id}:${st.ptyNonce[s.id] ?? 0}`)
      )
      st.terminals.forEach((t) => killPty(t.id))
      lastActivity.clear()
      set({
        view: 'launcher',
        project: null,
        projectMenuOpen: false,
        wsMenuOpen: false,
        workspaces: [],
        sessions: [],
        terminals: [],
        boards: [],
        skills: [],
        history: [],
        worktrees: [],
        activeWorktreePath: null,
        activeWorkspaceId: '',
        activeSessionId: null,
        activeBoardId: null,
        drawerCardId: null
      })
      // Refresh recents so the project we just left shows on the launcher.
      void window.api?.recents
        .get()
        .then((rs) => set({ recents: rs.map((r) => ({ name: r.name, path: r.path, sessions: r.sessions, branch: r.branch })) }))
        .catch(() => {})
    },

    setProjectIsRepo: (isGitRepo) =>
      set((st) => ({ project: st.project ? { ...st.project, isGitRepo } : st.project })),

    switchWorkspace: (id) =>
      set((st) => ({
        activeWorkspaceId: id,
        wsMenuOpen: false,
        view: st.view === 'launcher' ? 'workspace' : st.view,
        activeSessionId: firstSessionId(st.sessions, id),
        activeBoardId: firstBoardId(st.boards, id),
        drawerCardId: null
      })),
    toggleWsMenu: (open) => set((st) => ({ wsMenuOpen: open ?? !st.wsMenuOpen })),
    toggleProjectMenu: (open) => set((st) => ({ projectMenuOpen: open ?? !st.projectMenuOpen })),
    setLayout: (layout) => set({ layout }),
    openSession: (id) => set({ activeSessionId: id, view: 'session', wsMenuOpen: false, paletteOpen: false }),
    setRecents: (recents) => set({ recents }),
    hydrateSettings: (s) => set({ userName: s.userName, accent: s.accent, defaultProviderId: s.defaultProviderId, defaultModelId: s.defaultModelId, fontSize: s.fontSize, nameDialogOpen: !s.userName }),
    setUserName: (name) => {
      const trimmed = name.trim()
      set({ userName: trimmed, nameDialogOpen: false })
      void window.api?.settings.set({ userName: trimmed }).catch(() => {})
    },
    openNameDialog: () => set({ nameDialogOpen: true }),
    closeNameDialog: () => set({ nameDialogOpen: false }),
    focusComposer: () => set((st) => ({ focusComposerToken: st.focusComposerToken + 1 })),

    closeOverlays: () => {
      // Close the top-most overlay first (matches z-index stacking).
      const st = get()
      if (st.contextMenu) {
        set({ contextMenu: null })
        return true
      }
      if (st.confirm) {
        set({ confirm: null })
        return true
      }
      if (st.paletteOpen) {
        set({ paletteOpen: false })
        return true
      }
      if (st.cloneOpen) {
        set({ cloneOpen: false })
        return true
      }
      if (st.newWorktreeOpen) {
        set({ newWorktreeOpen: false })
        return true
      }
      if (st.tableOpen) {
        set({ tableOpen: false })
        return true
      }
      if (st.diagOpen) {
        set({ diagOpen: false })
        return true
      }
      if (st.skillEditorId) {
        set({ skillEditorId: null })
        return true
      }
      if (st.nameDialogOpen) {
        set({ nameDialogOpen: false })
        return true
      }
      if (st.labelMgrOpen) {
        set({ labelMgrOpen: false })
        return true
      }
      if (st.newSessionOpen || st.newWsOpen || st.newBoardOpen || st.genOpen) {
        set({ newSessionOpen: false, newWsOpen: false, newBoardOpen: false, genOpen: false })
        return true
      }
      if (st.drawerCardId) {
        maybeDiscardDraft()
        set({ drawerCardId: null, labelMenuOpen: false, draftCardId: null })
        return true
      }
      if (st.wsMenuOpen || st.projectMenuOpen || st.boardMenuOpen || st.labelMenuOpen) {
        set({ wsMenuOpen: false, projectMenuOpen: false, boardMenuOpen: false, labelMenuOpen: false })
        return true
      }
      return false
    },
    handlePtyExit: (ptyId) => {
      const colon = ptyId.lastIndexOf(':')
      if (colon > 0) {
        const sessionId = ptyId.slice(0, colon)
        const nonce = parseInt(ptyId.slice(colon + 1), 10)
        const st = get()
        if (st.sessions.some((s) => s.id === sessionId) && (st.ptyNonce[sessionId] ?? 0) === nonce) get().endSession(sessionId)
      } else if (get().terminals.some((t) => t.id === ptyId)) {
        get().endTerminal(ptyId)
      }
    },

    openPalette: () => set({ paletteOpen: true, paletteQuery: '' }),
    closePalette: () => set({ paletteOpen: false }),
    setPaletteQuery: (q) => set({ paletteQuery: q }),

    openNewSession: () =>
      set((st) => ({
        newSessionOpen: true,
        newSession: {
          name: '',
          providerId: st.defaultProviderId,
          modelId: st.defaultModelId,
          worktree: !!st.workspaces.find((w) => w.id === st.activeWorkspaceId)?.useWorktree,
          skipPerms: false,
          mode: 'structured'
        }
      })),
    closeNewSession: () => set({ newSessionOpen: false }),
    setNewSession: (patch) => set((st) => ({ newSession: { ...st.newSession, ...patch } })),
    createSession: () => spawnSession(get().newSession),
    endSession: (id) => {
      const st = get()
      const session = st.sessions.find((s) => s.id === id)
      if (session?.mode === 'structured') window.api?.agent.dispose(id)
      else killPty(`${id}:${st.ptyNonce[id] ?? 0}`)
      lastActivity.delete(id)
      set((s) => ({
        sessions: s.sessions.filter((x) => x.id !== id),
        activeSessionId: s.activeSessionId === id ? null : s.activeSessionId,
        view: s.view === 'session' && s.activeSessionId === id ? 'workspace' : s.view
      }))
      if (session) log({ kind: 'session', icon: 'stop_circle', color: '#9a9aa3', label: `Ended session ${session.name}`, detail: session.branch })
    },
    restartSession: (id) => {
      const st = get()
      const session = st.sessions.find((s) => s.id === id)
      // Reset the activity clock so a freshly-spawned process gets its full grace
      // period before the idle reaper can flip it back to gray.
      lastActivity.set(id, Date.now())
      if (session?.mode === 'structured') {
        window.api?.agent.dispose(id)
        // Clear the transcript/telemetry and spin a fresh process for the same id.
        const fresh: Session = { ...session, status: 'running', live: true, startedAt: Date.now(), lines: [], files: [], tokens: { ...session.tokens, used: 0 }, costUsd: undefined, activeMs: 0, runStartedAt: undefined }
        set((s) => ({ sessions: s.sessions.map((x) => (x.id === id ? fresh : x)) }))
        // The old process dies asynchronously; give it a tick before respawn.
        // Guard the respawn so ending/closing the session in that window doesn't
        // leave an orphan agent the renderer no longer tracks.
        setTimeout(() => {
          if (get().sessions.some((s) => s.id === id && s.mode === 'structured')) startStructured(fresh)
        }, 300)
      } else {
        const n = st.ptyNonce[id] ?? 0
        killPty(`${id}:${n}`)
        set((s) => ({
          ptyNonce: { ...s.ptyNonce, [id]: n + 1 },
          sessions: s.sessions.map((x) => (x.id === id ? { ...x, status: 'running', live: true, startedAt: Date.now() } : x))
        }))
      }
      if (session) log({ kind: 'session', icon: 'restart_alt', color: '#7cb3e6', label: `Restarted session ${session.name}`, detail: session.branch, target: { kind: 'session', id } })
    },
    // Called once the start-task prompt has actually been typed into the PTY, so
    // a later restart spawns a clean agent instead of re-submitting the task.
    clearInitialPrompt: (id) =>
      set((st) => ({ sessions: st.sessions.map((s) => (s.id === id ? { ...s, initialPrompt: undefined } : s)) })),
    applyAgentEvent: (id, event) => {
      if (event.kind === 'exit') {
        // The agent process ended — mark done; the user closes it explicitly.
        set((st) => ({ sessions: st.sessions.map((s) => (s.id === id ? { ...s, status: 'done', live: false } : s)) }))
        return
      }
      lastActivity.set(id, Date.now())
      // When a Start-task session completes a turn, auto-advance its card to In
      // Review (the agent's work is ready for the human to look at).
      if (event.kind === 'turn-complete') {
        const s = get().sessions.find((x) => x.id === id)
        if (s?.cardId && s.boardId) advanceTaskCard(s.boardId, s.cardId)
      }
      set((st) => ({
        sessions: st.sessions.map((s) => {
          if (s.id !== id) return s
          switch (event.kind) {
            case 'line':
              return { ...s, lines: [...s.lines, event.line] }
            case 'status': {
              // Accumulate producing time: running starts the clock; leaving
              // running banks the elapsed slice into activeMs.
              const now = Date.now()
              if (event.status === 'running' && s.status !== 'running') {
                return { ...s, status: event.status, runStartedAt: now }
              }
              if (event.status !== 'running' && s.runStartedAt != null) {
                return { ...s, status: event.status, activeMs: (s.activeMs ?? 0) + (now - s.runStartedAt), runStartedAt: undefined }
              }
              return { ...s, status: event.status }
            }
            case 'file': {
              const has = s.files.some((f) => f.p === event.file.p)
              return {
                ...s,
                files: has ? s.files.map((f) => (f.p === event.file.p ? event.file : f)) : [...s.files, event.file]
              }
            }
            case 'files':
              return { ...s, files: event.files }
            case 'usage':
              return {
                ...s,
                tokens: event.contextTokens != null ? { used: Math.round(event.contextTokens / 100) / 10, limit: s.tokens.limit || 200 } : s.tokens,
                costUsd: event.costUsd ?? s.costUsd
              }
            default:
              return s // 'model' — structured sessions keep the launch-time label
          }
        })
      }))
    },
    sendToAgent: (id, text) => {
      const trimmed = text.trim()
      if (!trimmed) return
      window.api?.agent.send(id, trimmed)
    },
    toggleContextSource: (id, source) =>
      set((st) => ({
        sessions: st.sessions.map((s) => {
          if (s.id !== id) return s
          const cur = s.contextSources ?? []
          return { ...s, contextSources: cur.includes(source) ? cur.filter((x) => x !== source) : [...cur, source] }
        })
      })),
    cycleSession: () => {
      const st = get()
      const scoped = st.sessions.filter((s) => s.wsId === st.activeWorkspaceId)
      if (scoped.length < 2) return
      const i = scoped.findIndex((s) => s.id === st.activeSessionId)
      const next = scoped[(i + 1) % scoped.length]
      set({ activeSessionId: next.id })
    },
    reorderSessions: (fromId, toId) => set((st) => ({ sessions: arrayMove(st.sessions, fromId, toId) })),
    setActiveSession: (id) => set({ activeSessionId: id }),
    setSessionModel: (id, modelId) =>
      set((st) => ({
        sessions: st.sessions.map((s) =>
          s.id === id ? { ...s, modelId, model: getProviderMeta(s.providerId)?.models.find((m) => m.id === modelId)?.label ?? modelId } : s
        )
      })),
    noteSessionData: (ptyId) => {
      const colon = ptyId.lastIndexOf(':')
      if (colon < 0) return
      const id = ptyId.slice(0, colon)
      lastActivity.set(id, Date.now())
      const st = get()
      const s = st.sessions.find((x) => x.id === id)
      if (s && s.status !== 'running') set({ sessions: st.sessions.map((x) => (x.id === id ? { ...x, status: 'running' } : x)) })
    },
    reapIdleSessions: () => {
      const now = Date.now()
      const st = get()
      let changed = false
      const sessions = st.sessions.map((s) => {
        // Structured sessions have an authoritative event-driven status — never
        // override it here. For interactive sessions the dot is a presentation
        // hint only (the "active" counters key off `live`), with a generous
        // window before dimming.
        if (s.mode !== 'structured' && s.status === 'running' && now - (lastActivity.get(s.id) ?? s.startedAt) > 20000) {
          changed = true
          return { ...s, status: 'idle' as const }
        }
        return s
      })
      if (changed) set({ sessions })
    },
    closeAllSessions: () => {
      const st = get()
      const scoped = st.sessions.filter((s) => s.wsId === st.activeWorkspaceId)
      if (!scoped.length) return
      st.askConfirm({
        title: 'Close all sessions',
        message: `Close all ${scoped.length} session${scoped.length > 1 ? 's' : ''} in this workspace? Their agent processes are terminated.`,
        confirmLabel: 'Close all',
        onConfirm: () => scoped.forEach((s) => get().endSession(s.id))
      })
    },

    newTerminal: () => {
      const st = get()
      const n = st.terminals.filter((t) => t.wsId === st.activeWorkspaceId).length + 1
      const id = uid('t')
      const name = `terminal ${n}`
      const term: Terminal = { id, wsId: st.activeWorkspaceId, name, cwd: st.activeWorktreePath ?? st.project?.path ?? '~', running: true }
      set({ terminals: [...st.terminals, term], view: 'terminals' })
      log({ kind: 'terminal', icon: 'terminal', color: '#5cc98a', label: `Opened ${name}`, detail: term.cwd })
    },
    closeTerminal: (id) => {
      const t = get().terminals.find((x) => x.id === id)
      get().askConfirm({
        title: 'Close terminal',
        message: `Close “${t?.name ?? 'terminal'}”? Any running process is terminated.`,
        confirmLabel: 'Close terminal',
        onConfirm: () => get().endTerminal(id)
      })
    },
    endTerminal: (id) => {
      const t = get().terminals.find((x) => x.id === id)
      killPty(id)
      set((st) => ({ terminals: st.terminals.filter((x) => x.id !== id) }))
      if (t) log({ kind: 'terminal', icon: 'terminal', color: '#9a9aa3', label: `Closed ${t.name}`, detail: t.cwd })
    },
    reorderTerminals: (fromId, toId) => set((st) => ({ terminals: arrayMove(st.terminals, fromId, toId) })),
    closeAllTerminals: () => {
      const st = get()
      const scoped = st.terminals.filter((t) => t.wsId === st.activeWorkspaceId)
      if (!scoped.length) return
      st.askConfirm({
        title: 'Close all terminals',
        message: `Close all ${scoped.length} terminal${scoped.length > 1 ? 's' : ''}? Any running processes are terminated.`,
        confirmLabel: 'Close all',
        onConfirm: () => scoped.forEach((t) => get().endTerminal(t.id))
      })
    },

    openContextMenu: (x, y, items) => set({ contextMenu: { x, y, items } }),
    closeContextMenu: () => set({ contextMenu: null }),
    openClone: () => set({ cloneOpen: true, cloneUrl: '', cloneError: null }),
    closeClone: () => set({ cloneOpen: false }),
    setCloneUrl: (url) => set({ cloneUrl: url, cloneError: null }),
    doClone: () => {
      const url = get().cloneUrl.trim()
      if (!url) return
      set({ cloning: true, cloneError: null })
      void window.api?.git
        .clone(url)
        .then((res) => {
          set({ cloning: false })
          if (res?.ok) {
            set({ cloneOpen: false })
            get().openProject(res.project)
          } else if (res && 'canceled' in res) {
            // User dismissed the destination picker — not an error.
          } else {
            set({ cloneError: res?.error ?? 'Could not clone — check the URL and try again.' })
          }
        })
        .catch(() => set({ cloning: false, cloneError: 'Clone failed.' }))
    },
    openNewWorktree: (suggested) => set({ newWorktreeOpen: true, newWorktreeName: suggested }),
    closeNewWorktree: () => set({ newWorktreeOpen: false }),
    setNewWorktreeName: (name) => set({ newWorktreeName: name }),
    createWorktree: (name) => {
      const st = get()
      const project = st.project
      const branch = name.trim() || 'feature'
      set({ newWorktreeOpen: false })
      if (!project?.path || !project.path.startsWith('/')) return
      const slug = slugify(branch.replace(/\//g, '-'))
      const parent = project.path.replace(/\/[^/]+$/, '')
      const dir = `${parent}/${project.name}.wt/${slug}`
      void window.api?.git
        .addWorktree(project.path, branch, dir)
        .then((w) => {
          get().reconcileWorktrees(w)
          set((s) => ({ worktreesVersion: s.worktreesVersion + 1 }))
        })
        .catch(() => {})
      log({ kind: 'worktree', icon: 'account_tree', color: '#b89cf0', label: `Created worktree ${branch}`, detail: dir })
    },
    loadWorktrees: () => {
      const path = realPath()
      if (!path) {
        set({ worktrees: [] })
        return
      }
      void window.api?.git.worktrees(path).then((w) => get().reconcileWorktrees(w)).catch(() => set({ worktrees: [] }))
    },
    // Replace the worktree list (e.g. after add/remove) and drop the active
    // selection back to the main checkout if its worktree no longer exists.
    reconcileWorktrees: (list) =>
      set((st) => ({
        worktrees: list,
        activeWorktreePath:
          st.activeWorktreePath && list.some((w) => w.path === st.activeWorktreePath) ? st.activeWorktreePath : null
      })),
    removeWorktree: (dir, branch) => {
      const path = realPath()
      if (!path) return
      void window.api?.git
        .removeWorktree(path, dir)
        .then((list) => {
          get().reconcileWorktrees(list)
          set((s) => ({ worktreesVersion: s.worktreesVersion + 1 }))
        })
        .catch(() => {})
      log({ kind: 'worktree', icon: 'delete_outline', color: '#e07a6e', label: `Removed worktree ${branch}`, detail: dir })
    },
    setActiveWorktree: (path) => {
      if (get().activeWorktreePath === path) return
      set({ activeWorktreePath: path })
      const wts = get().worktrees
      const label = path ? wts.find((w) => w.path === path)?.branch ?? path : wts.find((w) => w.isMain)?.branch ?? 'main'
      log({ kind: 'worktree', icon: 'account_tree', color: '#b89cf0', label: `Switched to worktree ${label}`, detail: 'New sessions & terminals open here' })
    },

    openNewWs: () => set({ newWsOpen: true, newWs: { name: '', useWorktree: false }, wsMenuOpen: false }),
    closeNewWs: () => set({ newWsOpen: false }),
    setNewWs: (patch) => set((st) => ({ newWs: { ...st.newWs, ...patch } })),
    createWorkspace: () => {
      const st = get()
      const name = st.newWs.name.trim()
      if (!name) return
      const id = uid('ws')
      set({
        workspaces: [...st.workspaces, { id, name, useWorktree: st.newWs.useWorktree }],
        activeWorkspaceId: id,
        activeSessionId: null,
        activeBoardId: null,
        view: 'workspace',
        newWsOpen: false
      })
      log({ kind: 'board', icon: 'workspaces', color: '#7cb3e6', label: `Created workspace ${name}`, detail: '' })
      persistWorkspaces()
    },

    toggleBoardMenu: (open) => set((st) => ({ boardMenuOpen: open ?? !st.boardMenuOpen })),
    selectBoard: (id) => set({ activeBoardId: id, boardMenuOpen: false, drawerCardId: null }),
    openNewBoard: () => set({ newBoardOpen: true, newBoard: { name: '', scope: 'feature' }, boardMenuOpen: false }),
    closeNewBoard: () => set({ newBoardOpen: false }),
    setNewBoard: (patch) => set((st) => ({ newBoard: { ...st.newBoard, ...patch } })),
    createBoard: () => {
      const st = get()
      const name = st.newBoard.name.trim()
      if (!name) return
      const id = uid('b')
      const board: Board = {
        id,
        wsId: st.activeWorkspaceId,
        name,
        scope: st.newBoard.scope,
        baseBranch: st.project?.branch ?? 'main',
        columns: BOARD_COLUMNS,
        labels: DEFAULT_LABELS,
        cards: []
      }
      set({ boards: [...st.boards, board], activeBoardId: id, newBoardOpen: false, view: 'board' })
      const path = realPath()
      if (path) {
        const { cards: _c, wsId: _w, ...meta } = board
        void window.api?.boards.saveBoard(path, { ...meta, cards: [] }).catch(() => {})
      }
      persistWorkspaces()
      log({ kind: 'board', icon: 'view_kanban', color: '#7cb3e6', label: `Created board ${name}`, detail: st.newBoard.scope, target: { kind: 'board', id } })
    },
    addCardTo: (col) => {
      const st = get()
      const board = currentBoard(st)
      if (!board) return
      const code = newCardCode(st.boards)
      const order = generateKeyBetween(lastOrderInColumn(board, col), null)
      const cardId = `c${code}`
      const newCard: Card = {
        id: cardId,
        code,
        column: col,
        order,
        title: 'New card',
        body: '',
        labels: [],
        link: { branch: null, worktree: null },
        attachments: [],
        sessionId: null,
        agent: false,
        activity: [{ icon: 'add', text: 'Card created', time: 'now', color: '#5f5f68' }]
      }
      updateActiveBoard((b) => ({ ...b, cards: [...b.cards, newCard] }))
      // Draft: not persisted or logged until it has real content (see updateCard / closeDrawer).
      set({ drawerCardId: cardId, draftCardId: cardId, cardTab: 'write' })
    },
    openCard: (id) => set({ drawerCardId: id, cardTab: 'write', labelMenuOpen: false }),
    closeDrawer: () => {
      maybeDiscardDraft()
      set({ drawerCardId: null, labelMenuOpen: false, draftCardId: null })
    },
    setCardTab: (tab) => set({ cardTab: tab }),
    updateCard: (id, patch) => {
      const board = currentBoard(get())
      if (!board) return
      let updated: Card | undefined
      updateActiveBoard((b) => ({
        ...b,
        cards: b.cards.map((c) => {
          if (c.id !== id) return c
          updated = { ...c, ...patch }
          return updated
        })
      }))
      if (updated) persistCard(board.id, updated)
      // The first meaningful edit commits a draft card (persist + log it once).
      if (updated && get().draftCardId === id) {
        const c = updated
        const meaningful = (c.title.trim() !== '' && c.title.trim() !== 'New card') || c.body.trim() !== '' || c.labels.length > 0
        if (meaningful) {
          set({ draftCardId: null })
          log({ kind: 'card', icon: 'add', color: '#5f5f68', label: `Added card #${c.code}`, detail: board.name, target: { kind: 'card', id, boardId: board.id } })
        }
      }
    },
    appendToCardBody: (md) => {
      const id = get().drawerCardId
      if (!id) return
      const board = currentBoard(get())
      const card = board?.cards.find((c) => c.id === id)
      if (!card) return
      get().updateCard(id, { body: card.body ? `${card.body}\n\n${md}` : md })
    },
    deleteCard: (id) => {
      const board = currentBoard(get())
      if (!board) return
      const card = board.cards.find((c) => c.id === id)
      get().askConfirm({
        title: 'Delete card',
        message: 'Delete this card? This cannot be undone.',
        confirmLabel: 'Delete card',
        onConfirm: () => {
          updateActiveBoard((b) => ({ ...b, cards: b.cards.filter((c) => c.id !== id) }))
          set({ drawerCardId: null })
          persistDeleteCard(board.id, id)
          if (card) log({ kind: 'card', icon: 'delete_outline', color: '#e07a6e', label: `Deleted card #${card.code}`, detail: board.name })
        }
      })
    },
    moveCard: (id, col) => {
      const st = get()
      const board = currentBoard(st)
      if (!board) return
      const order = generateKeyBetween(lastOrderInColumn(board, col), null)
      get().updateCard(id, { column: col, order })
      const card = board.cards.find((c) => c.id === id)
      const colName = board.columns.find((c) => c.id === col)?.name ?? col
      if (card) log({ kind: 'card', icon: 'east', color: '#9a9aa3', label: `Moved card #${card.code} to ${colName}`, detail: board.name, target: { kind: 'card', id, boardId: board.id } })
    },
    moveCardTo: (id, col, beforeCardId) => {
      const st = get()
      const board = currentBoard(st)
      if (!board) return
      const prev = board.cards.find((c) => c.id === id)
      const order = orderForDrop(board, col, id, beforeCardId)
      get().updateCard(id, { column: col, order })
      if (prev && prev.column !== col) {
        const colName = board.columns.find((c) => c.id === col)?.name ?? col
        log({ kind: 'card', icon: 'east', color: '#9a9aa3', label: `Moved card #${prev.code} to ${colName}`, detail: board.name, target: { kind: 'card', id, boardId: board.id } })
      }
    },
    reorderColumns: (fromId, toId) =>
      updateActiveBoard((b) => ({ ...b, columns: arrayMove(b.columns.map((c) => ({ ...c })), fromId, toId) })),
    startTask: (id) => {
      const st = get()
      const board = currentBoard(st)
      const card = board?.cards.find((c) => c.id === id)
      if (!board || !card) return
      const slug = slugify(card.title)
      const branch = `feat/${slug}`
      const sessionId = uid('s')
      const project = st.project
      let worktree: string | null = null
      let cwd = project?.path
      let cwdReady: Promise<unknown> | undefined
      if (project?.path && project.path.startsWith('/')) {
        const parent = project.path.replace(/\/[^/]+$/, '')
        worktree = `${parent}/${project.name}.wt/${slug}`
        cwd = worktree
        cwdReady = window.api?.git.addWorktree(project.path, branch, worktree).catch(() => {})
      }
      // Start-task runs structured so the card is auto-injected and the work is
      // driven with live telemetry. The card body arrives via the context
      // preamble, so the opening turn is just the marching orders — kept
      // self-contained (no skill dependency) and not assuming the board files are
      // reachable from a worktree checkout.
      const firstTurn =
        "Please complete the task described in the context above. Stay on this branch and don't commit — I'll review and move the card on the board. Summarize what you changed when you're done."
      const session: Session = {
        id: sessionId,
        wsId: st.activeWorkspaceId,
        name: slug,
        providerId: st.defaultProviderId,
        modelId: st.defaultModelId,
        model: getProviderMeta(st.defaultProviderId)?.models.find((m) => m.id === st.defaultModelId)?.label ?? st.defaultModelId,
        status: 'running',
        branch,
        worktree,
        duration: '0m',
        task: card.title,
        tokens: { used: 0, limit: 200 },
        files: [],
        lines: [],
        live: true,
        cwd: cwd ?? undefined,
        startedAt: Date.now(),
        mode: 'structured',
        contextSources: ['card', 'worktree'],
        cardId: id,
        boardId: board.id
      }
      set({ sessions: [...st.sessions, session], activeSessionId: sessionId, view: 'session' })
      startStructured(session, firstTurn, cwdReady)
      get().updateCard(id, {
        column: 'in-progress',
        agent: true,
        sessionId,
        link: { branch, worktree },
        activity: [
          { icon: 'rocket_launch', text: 'Started task', time: 'now', color: '#7cb3e6' },
          ...(worktree ? [{ icon: 'account_tree', text: `Created worktree on ${branch}`, time: 'now', color: '#b89cf0' }] : []),
          { icon: 'east', text: 'Moved to In Progress', time: 'now', color: '#9a9aa3' },
          ...card.activity
        ]
      })
      log({ kind: 'card', icon: 'rocket_launch', color: '#7cb3e6', label: `Started task on #${card.code}`, detail: branch, target: { kind: 'session', id: sessionId } })
    },
    toggleLabelMenu: (open) => set((st) => ({ labelMenuOpen: open ?? !st.labelMenuOpen })),
    toggleCardLabel: (labelId) => {
      const id = get().drawerCardId
      const board = currentBoard(get())
      const card = board?.cards.find((c) => c.id === id)
      if (!id || !card) return
      const labels = card.labels.includes(labelId)
        ? card.labels.filter((l) => l !== labelId)
        : [...card.labels, labelId]
      get().updateCard(id, { labels })
    },

    openGen: () => set({ genOpen: true, genText: '', boardMenuOpen: false }),
    closeGen: () => set({ genOpen: false }),
    setGenText: (t) => set({ genText: t }),
    generateCards: () => {
      const st = get()
      const board = currentBoard(st)
      if (!board) return
      const items = st.genText
        .split(/[\n.;]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 6)
        .slice(0, 6)
      if (!items.length) {
        set({ genOpen: false, genText: '' })
        return
      }
      const code = newCardCode(st.boards)
      const aiLabel = board.labels.find((l) => l.id === 'ai') ? 'ai' : board.labels[0]?.id
      const orders = generateNKeysBetween(lastOrderInColumn(board, 'backlog'), null, items.length)
      const created: Card[] = items.map((line, i) => ({
        id: `c${code + i}`,
        code: code + i,
        column: 'backlog',
        order: orders[i],
        title: cap(line),
        body: '',
        labels: aiLabel ? [aiLabel] : [],
        link: { branch: null, worktree: null },
        attachments: [],
        sessionId: null,
        agent: false,
        activity: [{ icon: 'auto_awesome', text: 'Drafted by AI', time: 'now', color: '#7cb3e6' }]
      }))
      updateActiveBoard((b) => ({ ...b, cards: [...b.cards, ...created] }))
      created.forEach((c) => persistCard(board.id, c))
      set({ genOpen: false, genText: '', view: 'board' })
      log({ kind: 'card', icon: 'auto_awesome', color: '#7cb3e6', label: `Generated ${created.length} cards`, detail: board.name, target: { kind: 'board', id: board.id } })
    },

    openLabelMgr: () => set({ labelMgrOpen: true, labelMenuOpen: false, newLabel: { name: '', color: LABEL_PALETTE[0] } }),
    closeLabelMgr: () => set({ labelMgrOpen: false }),
    setNewLabel: (patch) => set((st) => ({ newLabel: { ...st.newLabel, ...patch } })),
    addBoardLabel: () => {
      const st = get()
      const name = st.newLabel.name.trim()
      if (!name) return
      const id = slugify(name)
      updateActiveBoard((b) =>
        b.labels.some((l) => l.id === id) ? b : { ...b, labels: [...b.labels, { id, name, color: st.newLabel.color }] }
      )
      set({ newLabel: { name: '', color: LABEL_PALETTE[0] } })
      log({ kind: 'label', icon: 'label', color: st.newLabel.color, label: `Added label ${name}`, detail: '' })
    },
    deleteBoardLabel: (labelId) => {
      get().askConfirm({
        title: 'Delete label',
        message: 'Delete this label? It will be removed from all cards.',
        confirmLabel: 'Delete label',
        onConfirm: () =>
          updateActiveBoard((b) => ({
            ...b,
            labels: b.labels.filter((l) => l.id !== labelId),
            cards: b.cards.map((c) => ({ ...c, labels: c.labels.filter((l) => l !== labelId) }))
          }))
      })
    },
    cycleLabelColor: (labelId) =>
      updateActiveBoard((b) => ({
        ...b,
        labels: b.labels.map((l) => {
          if (l.id !== labelId) return l
          const i = LABEL_PALETTE.indexOf(l.color)
          return { ...l, color: LABEL_PALETTE[(i + 1) % LABEL_PALETTE.length] }
        })
      })),

    openTable: () => set({ tableOpen: true, table: { headers: ['Column 1', 'Column 2'], rows: [['', ''], ['', '']] } }),
    closeTable: () => set({ tableOpen: false }),
    setTable: (table) => set({ table }),
    insertTable: () => {
      const { headers, rows } = get().table
      const head = `| ${headers.join(' | ')} |`
      const sep = `| ${headers.map(() => '---').join(' | ')} |`
      const body = rows.map((r) => `| ${headers.map((_, i) => r[i] ?? '').join(' | ')} |`).join('\n')
      get().mdAppend?.(`${head}\n${sep}\n${body}`)
      set({ tableOpen: false })
    },
    openDiag: () => set({ diagOpen: true }),
    closeDiag: () => set({ diagOpen: false }),
    setDiagText: (t) => set({ diagText: t }),
    insertDiagram: () => {
      get().mdAppend?.(`\`\`\`mermaid\n${get().diagText}\n\`\`\``)
      set({ diagOpen: false })
    },
    setMdAppend: (fn) => set({ mdAppend: fn }),

    selectSkill: (id) => set({ selectedSkillId: id }),
    newSkill: () => set({ skillEditorId: '__new__' }),
    toggleSkill: (id) =>
      set((st) => ({ skills: st.skills.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)) })),
    runSkill: (id) => {
      const st = get()
      const sk = st.skills.find((s) => s.id === id)
      if (!sk) return
      set((s2) => ({ skills: s2.skills.map((s) => (s.id === id ? { ...s, invocations: s.invocations + 1 } : s)) }))
      // Spawn a structured session and actually invoke the skill (don't just open
      // the dialog) so "Run now" does something.
      const sid = uid('s')
      const cwd = st.activeWorktreePath ?? st.project?.path
      const session: Session = {
        id: sid,
        wsId: st.activeWorkspaceId,
        name: sk.id.replace(/^vw-/, ''),
        providerId: st.defaultProviderId,
        modelId: st.defaultModelId,
        model: getProviderMeta(st.defaultProviderId)?.models.find((m) => m.id === st.defaultModelId)?.label ?? st.defaultModelId,
        status: 'running',
        branch: st.project?.branch ?? 'main',
        worktree: st.activeWorktreePath,
        duration: '0m',
        task: `Skill: ${sk.name}`,
        tokens: { used: 0, limit: 200 },
        files: [],
        lines: [],
        live: true,
        cwd: cwd ?? undefined,
        startedAt: Date.now(),
        mode: 'structured'
      }
      set((s2) => ({ sessions: [...s2.sessions, session], activeSessionId: sid, view: 'session' }))
      startStructured(session, `Please run the "${sk.name}" skill (${sk.id}).`)
      log({ kind: 'skill', icon: 'play_circle', color: '#7cb3e6', label: `Run skill ${sk.name}`, detail: 'in a new session' })
    },
    openSkillEditor: (id) => set({ skillEditorId: id }),
    closeSkillEditor: () => set({ skillEditorId: null }),
    saveSkill: (save) => {
      const path = realPath()
      if (path) {
        void window.api?.skills
          .save(path, save)
          .then((skills) => set({ skills, skillEditorId: null }))
          .catch(() => set({ skillEditorId: null }))
      } else {
        set({ skillEditorId: null })
      }
      log({ kind: 'skill', icon: 'auto_awesome', color: '#7cb3e6', label: `Saved skill ${save.name}`, detail: '' })
    },
    reloadSkills: () => {
      const path = realPath()
      if (path) {
        void window.api?.skills
          .list(path)
          .then((skills) =>
            set((st) => ({ skills, selectedSkillId: st.selectedSkillId && skills.some((s) => s.id === st.selectedSkillId) ? st.selectedSkillId : skills[0]?.id ?? null }))
          )
          .catch(() => {})
      }
    },

    // Live preview only — the Settings screen persists on its explicit Save.
    setAccent: (accent) => set({ accent }),
    setFontSize: (n) => set({ fontSize: n }),
    setDefaultModel: (id) => set({ defaultModelId: id }),

    askConfirm: (config) => set({ confirm: config }),
    closeConfirm: () => set({ confirm: null })
  }
})
