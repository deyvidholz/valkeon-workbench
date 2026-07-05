# Valkeon Workbench — Enhancements Plan (2026‑07)

A carefully-scoped plan covering a batch of bug fixes and feature requests. It is written to be
implemented incrementally, milestone by milestone, matching the project's working style
("shell → launcher → workspace → board → the rest, pause for review at milestones").

Nothing here has been implemented yet — this document is the design/agreement step. Items marked
**[open question]** need a decision from the user before or during that milestone.

---

## 0. Codebase facts this plan builds on

Verified by reading the current source. These anchor every design decision below.

- **Processes:** `src/main` (privileged: fs, git via `simple-git`, PTYs, agent CLI), `src/preload`
  (thin typed `window.api` bridge), `src/renderer/src` (React 18 + one zustand store), `src/shared`
  (types + `IpcChannels`).
- **IPC pattern:** channel string constants in `src/shared/ipc.ts` → `ipcMain.handle(...)` in a
  `register*Ipc` per domain → wrapped as a typed method in `src/preload/index.ts` → called from the
  store as `window.api.<group>.<method>(...)`. Push events use `webContents.send` + a preload
  `on*(cb)` returning an unsubscribe, subscribed in `App.tsx`.
- **State:** a single store `src/renderer/src/store/useStore.ts` (~1900 lines). No router — `store.view`
  is a `ViewId` union (`src/renderer/src/types.ts`) switched in `App.tsx`'s `MainView`.
- **Reusable primitives already present:**
  - `src/renderer/src/ui/Modal.tsx` — base modal (backdrop + panel).
  - `src/renderer/src/dialogs/ConfirmDialog.tsx` — the one confirm dialog, driven by
    `askConfirm({title,message,confirmLabel,onConfirm})`.
  - `src/renderer/src/components/ContextMenu.tsx` — global right-click menu, driven by
    `openContextMenu(x,y,items: ContextMenuItem[])`; item = `{label,icon,danger?,onClick}`.
  - `src/renderer/src/dialogs/parts.tsx` — `DialogHeader`, `DialogActions`, `inputStyle`, `eyebrow`,
    `segStyle(active)` (segmented control — reuse for tabs).
  - `src/renderer/src/ui/Hover.tsx` — hover helper; already forwards `onContextMenu`.
- **Styling:** inline `style={{}}` objects + one global stylesheet `styles/global.css`. Accent is CSS
  vars (`--accent`, `--accent-hi`, `--accent-soft`, `--accent-line`, `--accent-glow`) recomputed in
  `theme/applyAccent.ts`. Status colors are mostly inline hex.
- **Persistence split:** in-repo `.valkeon/` (boards, workspaces, project `config.json`) vs machine-local
  `userData/projects/<sha256(repoPath).slice(0,16)>/` (sessions, `history.json`, global settings). Board
  persistence is a port (`BoardStore`) with `repo`/`local` adapters. Everything is keyed by `repoPath`
  and guarded by `assertAllowedRepo`.
- **Agent layer (AI‑agnostic):** port `AgentProvider` (`src/shared/agents/port.ts`) →
  `ClaudeCodeAdapter` (`src/main/agents/claude/ClaudeCodeAdapter.ts`) spawns the `claude` CLI in
  **streaming stream‑json** mode only. **There is no one‑shot "prompt → JSON" facility today.** Adding one
  is a shared foundation for items #1 and #10.
- **No list virtualization** anywhere; no windowing dependency in `package.json`.

---

## Table of contents

- **Phase A — shared foundations** (unblocks the rest)
  - A1. One‑shot AI completion on the agent port
  - A2. In‑app notification center (store + persistence + sidebar bell)
  - A3. Virtualized list utility
  - A4. Context‑menu submenu support + resizable split‑pane primitive
  - A5. `ensureLocalExcludes` (`.git/info/exclude`) utility
- **Phase B — quick bug fixes**
  - #7b. New Session worktree default should come from the workspace
  - #7a. Workspace "use worktrees" should enable the `vw-worktrees` skill
  - #2. Move "Start task" into the card dialog footer
  - #6. Auto‑exclude `.valkeon/` locally via `.git/info/exclude`
- **Phase C — Board**
  - #1. Real AI "Generate cards"
  - #3. Card right‑click context menu (+ context‑menu audit)
- **Phase D — Explore**
  - #5. Resizable sidebars + file‑title‑bar actions + "Open in VS Code"
- **Phase E — Worktrees**
  - #4. Worktree details dialog + richer view
  - #10. Worktrees‑cleanup skill + decide dialog + AI analysis
- **Phase F — Settings / Sidebar / Skills**
  - #8. Settings view with tabs (Application / Workspace)
  - #9. Sidebar caps Sessions & Terminals at 4 + "View all" pages
  - #12. Skills view: manageable `vw-` section vs read‑only project skills
- **Appendix — the `.git/info/exclude` question, answered**

---

# Phase A — Shared foundations

These are built first because several requested features depend on them. Each is small and independently
shippable.

## A1. One‑shot AI completion on the agent port

**Why:** #1 (generate cards) and #10 (worktree cleanup analysis) both need "send one prompt, get one
structured JSON answer back," which the current streaming, multi‑turn interface doesn't offer cleanly.
Building it once, on the vendor‑neutral port, keeps the AI‑agnostic architecture intact.

**Design:**
- Extend the port `AgentProvider` (`src/shared/agents/port.ts`) with an optional:
  ```ts
  complete?(spec: AgentCompleteSpec): Promise<AgentCompleteResult>
  ```
  where `AgentCompleteSpec = { providerId, modelId, cwd, prompt, system?, timeoutMs? }` and
  `AgentCompleteResult = { text: string }` (new types in `src/shared/agents/types.ts`).
- `ClaudeCodeAdapter.complete` spawns the CLI in **single‑shot** mode:
  `claude --print --output-format json --model <id> [--append-system-prompt <system>]`, feeds `prompt`
  on stdin, reads the single JSON object, returns its `result`/text. No persistent handle — process exits.
- New IPC channel `agent:complete` → `manager.complete(spec)` → `getProvider(id).complete(spec)`.
  Preload `window.api.agent.complete(spec)`.
- Renderer helper in the store: `aiComplete(prompt, {system?}): Promise<string>` plus a small
  `aiCompleteJson<T>(prompt, schemaHint): Promise<T>` that strips code fences / prose and `JSON.parse`s,
  throwing a typed error the callers can surface.

**Files:** `src/shared/agents/{port,types}.ts`, `src/main/agents/claude/ClaudeCodeAdapter.ts`,
`src/main/agents/{manager,ipc}.ts`, `src/shared/ipc.ts`, `src/preload/index.ts`, `useStore.ts`.

**Edge cases:** CLI missing / not authenticated → `isAvailable()` already exists; surface a friendly
"Claude CLI unavailable" toast/inline error rather than throwing raw. Timeout (default 60s). Model choice
uses the workspace/global default model.

## A2. In‑app notification center (item #11 foundation)

**Why:** notifications are now more than "a session finished" (worktree cleanup, and future kinds). The
app currently fires **OS notifications only** and stores **no records**. We add a persisted, per‑project
notification log surfaced by a sidebar bell.

**Data model** (`src/shared/persistence/types.ts`):
```ts
type NotificationKind = 'session' | 'worktree-cleanup' | 'system'
interface NotificationRecord {
  id: string
  wsId: string | null          // workspace scope; null = project-wide
  kind: NotificationKind
  title: string
  body: string                 // short line shown in the list
  createdAt: number            // epoch ms
  viewed: boolean
  action?: { type: 'open-session'; sessionId: string }
          | { type: 'open-worktree-cleanup'; runId: string }
          | { type: 'none' }
}
```

**Persistence:** new machine‑local `src/main/persistence/notificationsStore.ts` →
`userData/projects/<hash>/notifications.json`, capped (e.g. 500, newest wins) exactly like `historyStore`.
IPC: `notifications:load | :add | :markViewed | :markAllViewed | :clear`. Preload `window.api.notifications.*`.

**Store:** `notifications: NotificationRecord[]`, derived `unviewedCount` (scoped to active workspace + null).
Actions `pushNotification(rec)`, `markNotificationViewed(id)`, `markAllNotificationsViewed()`,
`clearNotifications()`. Loaded in `openProject`.

**Wiring the existing OS notification:** the current `turn-complete` handler (useStore.ts ~1085) that calls
`window.api.notify.show` **also** calls `pushNotification({kind:'session', action:{type:'open-session',...}})`.
OS notification and in‑app record stay in sync.

**Sidebar bell** (`src/renderer/src/components/sidebar/AccountRow.tsx`): add a `notifications` icon button
to the **left** of the settings gear. Badge shows `unviewedCount`, rendered `9+` when `> 9`, hidden at 0.
Click → opens `NotificationsDialog`.

**`NotificationsDialog`** (new, `src/renderer/src/dialogs/NotificationsDialog.tsx`): `Modal` containing a
**virtualized** list (A3) of records newest‑first, each row: kind icon, title, body, relative time, unviewed
dot. Header action **"Mark all as viewed."** Clicking a row runs its `action` (e.g. `openSession`, or open
the cleanup decide dialog) and marks it viewed. Empty state when none.

## A3. Virtualized list utility

**Why:** #11 explicitly asks that Notifications and History (and other growing lists) mount/unmount rows on
scroll to stay smooth.

**Options / recommendation:**
- **Recommended:** add `@tanstack/react-virtual` (tiny, headless, well‑maintained) and wrap it in a small
  `src/renderer/src/ui/VirtualList.tsx` (`items`, `rowHeight | estimateSize`, `renderRow`, `overscan`).
  Reused by Notifications, History, and the "View all" pages (#9). *(Adds one dependency — flagged because
  the project has been conservative about deps; the alternative below avoids it.)*
- **Alternative (no dep):** a ~60‑line custom `useWindowedList` hook (fixed/estimated row height, absolute
  positioning, `overscan`). Cheaper on dependencies, a bit more code to own.

**Retrofit targets:** `HistoryScreen.tsx` (currently `items.map`), `NotificationsDialog`, `AllSessionsScreen`/
`AllTerminalsScreen` (#9). **[open question]** dependency vs. hand‑rolled.

## A4. Context‑menu submenu support + resizable split‑pane primitive

**Context menu:** extend `ContextMenuItem` with `submenu?: ContextMenuItem[]` and `divider?: true`, and teach
`ContextMenu.tsx` to render a nested flyout on hover. Needed so card menus can offer **Move to → (column
list)** without a giant flat menu. Backward compatible (existing flat items untouched).

**Resizable split‑pane:** new `src/renderer/src/ui/ResizeHandle.tsx` — a 4–6px drag strip that reports
`onResize(deltaPx)`, with `min`/`max` clamps and a hover/drag affordance matching the accent line. Used by
both the app sidebar and the Explore file‑tree (#5). Pane widths persist:
- App sidebar width → global setting (`settings.sidebarWidth`, default 264).
- Explore tree width → global setting (`settings.exploreTreeWidth`, default 264).
Both clamped (e.g. 200–480). Double‑click handle → reset to default.

## A5. `ensureLocalExcludes` — write `.git/info/exclude`

Shared main‑process utility used by #6 (and a good place to consolidate the skills ignore, see appendix).
```ts
// src/main/git/localExclude.ts
export async function ensureLocalExcludes(repoPath: string, patterns: string[]): Promise<void>
```
Reads `<repoPath>/.git/info/exclude`, and idempotently appends any missing `patterns` inside a marked block:
```
# >>> Valkeon (local, not committed) >>>
.valkeon/
# <<< Valkeon <<<
```
No‑ops if not a git repo, if `.git` is a worktree gitdir file (resolve real gitdir first), or if a pattern is
already effectively ignored. Never edits the committed `.gitignore`.

---

# Phase B — Quick bug fixes

Low‑risk, high‑value. Ship together after Phase A basics land.

## #7b. New Session "Use a git worktree" default should follow the workspace

**Bug (confirmed):** `openNewSession` (useStore.ts ~988) sets
`worktree: st.projectConfig.taskStrategy === 'worktree'` — it reads the **repo‑level** project config, never
the **active workspace's** `useWorktree`. So a workspace created with "use worktrees = true" opens the New
Session dialog with the box unchecked.

**Fix:** default from the active workspace, falling back to project config:
```ts
const ws = st.workspaces.find(w => w.id === st.activeWorkspaceId)
worktree: (ws?.useWorktree ?? (st.projectConfig.taskStrategy === 'worktree')) && !!project.isGitRepo
```
**Files:** `useStore.ts`. Tiny, isolated.

## #7a. Workspace "use worktrees" should enable the `vw-worktrees` skill

**Bug (confirmed):** `Workspace.useWorktree` is written to `.valkeon/workspaces.json` but is **never linked**
to the `vw-worktrees` builtin skill, whose enabled/disabled state is purely a filesystem fact
(`.claude/skills/vw-worktrees` vs `.valkeon/skills-disabled/vw-worktrees`).

**Design tension to acknowledge:** skill enablement is **per‑repo**, while `useWorktree` is **per‑workspace**.
We cannot make a per‑workspace flag flip a per‑repo skill cleanly for every workspace. Recommendation:

- On `createWorkspace` (and when switching to a workspace) **with `useWorktree === true`**, ensure the
  `vw-worktrees` skill is **enabled** for the repo (`window.api.skills.setEnabled(path,'vw-worktrees',true)`),
  and refresh the skills list. Do **not** auto‑disable it when switching to a non‑worktree workspace (avoid
  thrashing a shared, repo‑global resource — disabling stays a manual, explicit action in the Skills view).
- Surface a one‑line note in the Skills view / workspace settings explaining that `vw-*` skills are
  repo‑global by design.

**[open question]** Confirm the "enable on opt‑in, never auto‑disable" policy. Alternative (larger) design:
make skill enablement per‑workspace — out of scope for this batch unless requested.

**Files:** `useStore.ts` (`createWorkspace`, workspace‑switch action), reuse existing `skills.setEnabled`.

## #2. Move "Start task" into the card dialog footer

**Current:** in `CardDrawer.tsx`, "Start task" sits inline in the body under "LINKED WORK" (~176‑183); the
footer (~230‑239) holds a status label + right‑aligned **Close** and **Save card**.

**Change:** footer becomes `justify-content: space-between`:
- **Left:** the primary action — **Start task** (when no task yet, gated on `saved` exactly as today) or
  **Open session** (once a task exists, replacing the inline behavior). Aligned all the way left.
- **Right:** unchanged — status label + **Close** + **Save card**.
- Remove the inline Start‑task block from the body; keep the "LINKED WORK" **summary** (branch/worktree/
  session) in the body for started cards.

**Files:** `CardDrawer.tsx` only. Purely presentational; no store changes.

## #6. Auto‑exclude `.valkeon/` locally on repo open

Use **A5** `ensureLocalExcludes`. Call it from `openProject` and from `initGit` (right after a repo becomes
a git repo) with patterns `['.valkeon/']` (plus any other machine‑local Valkeon artifacts). See the appendix
for why this is the right mechanism and how it relates to the current nested‑`.gitignore` approach.

**Files:** `src/main/git/localExclude.ts` (A5), called from the git/init and project‑open IPC handlers.

---

# Phase C — Board

## #1. Real AI "Generate cards"

**Bug (confirmed):** `generateCards` (useStore.ts ~1738‑1772) makes **no AI call**. It splits the textarea on
`/[\n.;]+/`, takes up to 6 lines, and creates one card per line titled with the line, tagged `ai`, with a
fake "Drafted by AI" activity. If there are no separators you get a single card whose title is the whole
typed text — exactly the reported symptom.

**Design (real generation using A1):**
1. `GenerateCardsDialog.tsx` gains: the intent textarea, an optional **target column** (default Backlog), an
   optional **count** hint, and a **Generate** button that enters a loading state (spinner + disable).
2. On confirm, `generateCards` calls `aiCompleteJson` (A1) with a prompt like: *"You are planning a kanban
   board for this project. Given the request below, produce a JSON array (max N) of cards. Each: `{title`
   (short, imperative), `body` (markdown, a few bullet points of scope/acceptance), `labels` (subset of the
   board's existing label ids)`}`. Return only JSON."* The prompt includes the board's existing label ids and
   (optionally) light repo context via the existing `contextBuild`.
3. Parse → validate against the board's labels → for each item run the existing create pipeline
   (`addCardTo`/`updateCard`/`persistCard`) so cards are real, persisted, ordered cards. Attach an honest
   "Generated by AI" activity entry.
4. **Errors:** CLI unavailable / bad JSON / timeout → keep the dialog open, show an inline error, offer
   Retry. **[open question]** keep a "split my text literally" fallback button, or remove the old behavior
   entirely? (Recommend: remove the fake path; offer Retry instead.)

**Files:** `GenerateCardsDialog.tsx`, `useStore.ts` (`generateCards` rewrite), A1 plumbing.

## #3. Card right‑click context menu (+ audit)

A generic context‑menu system already exists and is used in `SessionList`, `TerminalList`, `CodeScreen`,
`FileTree` — but **not on board cards**.

**Card menu** (attach `onContextMenu` to each card in `BoardScreen.tsx`, calling `openContextMenu`):
- **Open card** (drawer)
- **Start task** / **Open session** / **Review diff** — whichever matches the card's state (reuse
  `cardAction` logic already in `BoardScreen`)
- **Move to →** submenu (columns) — uses A4 submenu support; calls `moveCard`
- **Labels →** submenu (toggle) — optional, or leave in drawer
- **Duplicate card** (new small store action — clone title/body/labels into Backlog)
- divider
- **Delete card** (danger) — routes through `deleteCard` → confirm dialog

**Audit for other "relevant elements"** to add menus to (reusing the same primitive), in priority order:
board **column headers** (rename / clear / add card), **board tabs** in the switcher (rename / delete /
duplicate), **worktree rows** (#4 gives them a full menu), **workspace switcher** entries (rename / delete).
**[open question]** confirm which of these to include in this batch vs. later.

**Files:** `BoardScreen.tsx`, `useStore.ts` (duplicateCard), A4.

---

# Phase D — Explore (#5)

Four sub‑parts. `CodeScreen.tsx` today: flex row, **file‑tree sidebar first** (`width:264, flexShrink:0`,
`borderRight`), **editor pane second** (`flex:1`); title bar (34px) currently shows only the file path with
room on the right; `.valkeon` is hidden in the **main** process (`HIDDEN_DIRS`).

1. **Resizable Explore file‑tree sidebar** — replace the fixed `264` with a stored, drag‑resizable width
   using the A4 `ResizeHandle`; persist `settings.exploreTreeWidth`; clamp 200–480; double‑click resets.
2. **Resizable app sidebar** — same treatment for `Sidebar.tsx` (`width:264`), persisting
   `settings.sidebarWidth`.
3. **File‑title‑bar actions** — add a `flex:1` spacer then a right‑aligned action cluster in the 34px bar:
   - **Open in VS Code** (conditional — see below)
   - **Reveal in file manager** (`window.api.shell.showItemInFolder` / existing `shell.openPath`)
   - **Copy path**
   - **Close file** (deselect)
4. **"Open in VS Code" detection** — new main IPC:
   - `system:has-vscode` → true if the `code` CLI resolves (`which code` / `where code`) or the app is
     installed at a known path (mac `/Applications/Visual Studio Code.app`, Windows/Linux equivalents).
     Cache the result.
   - `system:open-in-vscode(path)` → spawn `code <path>` (or open the .app with the path arg).
   Renderer checks `has-vscode` once (store flag `hasVsCode`); the button renders only when true.

**[open question re: "editor comes before the sidebar":** the current DOM order is **sidebar‑left,
editor‑right**, which is the conventional IDE layout. Please confirm the intended arrangement — if you want
the tree on a specific side or the order swapped, I'll set the flex order accordingly. The resizable/actions
work above is independent of that decision.]

**Files:** `CodeScreen.tsx`, `Sidebar.tsx`, new `src/main/system/ipc.ts` (or extend an existing domain),
`ipc.ts`, `preload/index.ts`, `useStore.ts`, A4.

---

# Phase E — Worktrees

## #4. Worktree details dialog + richer view

**Current:** `WorktreesScreen.tsx` rows have **no click handler** (only inline merge/folder/delete icons);
the view is a flat list + "other branches". It deserves depth.

**Richer view:**
- Header stats chips: total / clean / dirty / ahead‑behind / **dead** (from #10's analysis when available).
- Per‑row: status badge (clean/dirty/ahead/behind with counts), linked session dot, last‑commit relative
  time (real, replacing the hardcoded `'—'`), and a **right‑click context menu** (open details, open in
  Explore, open terminal here, open folder, merge, delete, copy path).
- Toolbar: search/filter (branch/path), sort (name / recent / status), refresh.
- Row click → **WorktreeDetailsDialog**.

**WorktreeDetailsDialog** (new): `Modal` showing for one worktree:
- Branch, absolute path (copyable), HEAD short‑sha + subject.
- Status: dirty file count + list (from `git status --porcelain`), ahead/behind vs base branch.
- Recent commits (last ~10, `git log --oneline`).
- Linked session (if any) with a jump‑to button.
- Actions: Open in Explore · Open terminal here · Open folder · Merge into base · Pull/Fetch **[open
  question]** · Delete (danger, confirm) · Run cleanup analysis on just this one (#10).

**Main additions** (`src/main/git/worktrees.ts`): a `worktreeDetails(path, baseBranch)` that returns
`{head, subject, dirtyFiles[], ahead, behind, recentCommits[]}` via `simple-git`. New IPC
`git:worktree-details`.

**Files:** `WorktreesScreen.tsx`, new `WorktreeDetailsDialog.tsx`, `src/main/git/{worktrees,ipc}.ts`,
`shared/ipc.ts`, `shared/git.ts` (new types), `preload/index.ts`, `useStore.ts`.

## #10. Worktrees‑cleanup skill + decide dialog + AI analysis

**New builtin skill** `vw-worktrees-cleanup` added to `src/main/skills/builtin.ts`; bump `BUILTIN_VERSION`
(2 → 3) so `ensureBuiltinSkills` installs it. Its `SKILL.md` instructs the agent to inspect all worktrees and
classify each as **dead / review / keep**.

**"Dead" heuristics** (documented in the skill + used by analysis): no uncommitted changes **and** branch
fully merged into base; or no linked session and stale (no commits in N days); or branch already deleted;
or empty/no unique commits. "review" = ambiguous; "keep" = active/dirty/linked.

**Run + result flow:**
1. User triggers cleanup from the **Worktrees view** ("Analyze & clean up" button) or the **Skills view**.
2. The run produces **structured JSON** per worktree:
   ```ts
   interface WorktreeVerdict {
     path: string; branch: string
     verdict: 'dead' | 'review' | 'keep'
     oneLine: string        // AI one-line summary, shown in the decide dialog
     analysis: string       // full markdown analysis, shown in the per-row detail dialog
     changes: number; ahead: number; behind: number; merged: boolean
   }
   interface CleanupRun { id: string; wsId: string; createdAt: number; verdicts: WorktreeVerdict[] }
   ```
   Two viable engines (**[open question]** which):
   - **(a)** the A1 one‑shot `complete` with a JSON schema prompt, fed a compact digest of each worktree's
     git facts (fast, deterministic to parse); or
   - **(b)** run the skill as a normal structured session that writes `CleanupRun` JSON to
     `.valkeon/tmp/worktree-cleanup/<runId>.json`, which the app reads on completion.
   Recommendation: **(a)** for reliability, with the skill's `SKILL.md` documenting the same rules so a manual
   `/vw-worktrees-cleanup` run behaves consistently.
3. On completion → **push an in‑app notification** (A2), `kind:'worktree-cleanup'`,
   `action:{type:'open-worktree-cleanup', runId}`, plus the existing OS notification. The run is persisted
   (reuse notifications store payload or a small `cleanupRuns.json`).

**WorktreeCleanupDialog** (the "decide what to do" dialog):
- A table of worktrees: **checkbox**, verdict badge, branch, **one‑line AI summary**, change/ahead/behind
  chips, and a per‑row **detail** icon → opens a sub‑dialog with the **full AI analysis** for that worktree.
- **Select all** checkbox in the header; multi‑select supported.
- Per‑row action dropdown: **Keep** · **Delete worktree** · **Delete worktree + branch** · **Merge then
  delete** · **Archive** (optional).
- **Bulk action bar** when ≥1 selected: "Apply to selected → [action]" (with a single confirm summarizing
  N worktrees). Executes via existing `removeWorktree` / `deleteBranch` / `mergeBranchToBase`, then refreshes
  the worktrees view (`worktreesVersion`).
- Virtualized (A3) if the list is large.

**Files:** `src/main/skills/builtin.ts` (+version bump), new `WorktreeCleanupDialog.tsx` +
`WorktreeAnalysisDialog.tsx`, `useStore.ts` (run/apply actions), A1, A2, A3, existing git actions.

---

# Phase F — Settings / Sidebar / Skills

## #8. Settings view with tabs

**Current:** `SettingsScreen.tsx` is a single scroll of global sections (Appearance, General, Models,
Keyboard) with a sticky save bar; all settings are **global**. Repo/workspace settings live separately in
`ProjectSettingsDialog.tsx` (`.valkeon/config.json`: baseBranch, taskStrategy).

**Change:** introduce a tab strip at the top (reuse `segStyle` from `parts.tsx`):
- **Tab 1 — Application** (unchanged content): Appearance, General, Models, Keyboard (all global).
- **Tab 2 — Workspace**: settings for the currently‑selected workspace/project, grouped:
  - **Project (repo‑wide):** base branch, task strategy (worktree/branch/none) — i.e. the current
    `ProjectSettingsDialog` content, moved/mirrored here. Board storage mode could live here too.
  - **Active workspace:** name, **use worktrees by default** (`useWorktree`) — editing this drives #7a/#7b.
  - A note that `vw-*` skills are repo‑global.

`ProjectSettingsDialog` can either be retired in favor of the tab, or kept as a shortcut that deep‑links to
Tab 2. **[open question]** retire the dialog or keep both.

**Files:** `SettingsScreen.tsx`, wiring to `projectConfig` + workspace update actions in `useStore.ts`.

## #9. Sidebar caps Sessions & Terminals at 4 + "View all" pages

**Current:** `SessionList` and `TerminalList` render **all** items (`scoped.map`) with no cap.

**Change:**
- Show at most **4** rows each (by user‑defined order; see reorder below). If more than 4 exist, render a 5th
  **"View all (N)"** row that navigates to a dedicated page.
- New views `ViewId`s `'sessions-all'` and `'terminals-all'` → `AllSessionsScreen` / `AllTerminalsScreen`
  (could share one parameterized component). These render a **non‑interactive list** (not live session/
  terminal panes) — a table with per‑row actions:
  - **Open** (focus the session/terminal view), **Stop/Close**, **Rename**, **Reorder** (drag), optional
    **Duplicate**. Reordering updates the shared order and **reflects in the sidebar's top‑4**.
  - Virtualized (A3) for large counts.
- **Ordering model:** sessions/terminals currently rely on insertion order. Add an explicit `order` (or a
  fractional index like cards already use via `fractional-indexing`) so reorder is persistent and the sidebar
  can show the top 4 deterministically. Persist alongside sessions.

**[open question]** which 4 to show — strictly the user's order (recommended), or bias running/active items
to the top?

**Files:** `SessionList.tsx`, `TerminalList.tsx`, new `AllSessionsScreen.tsx`/`AllTerminalsScreen.tsx`,
`App.tsx` (routes), `types.ts` (ViewId), `useStore.ts` (order + reorder actions + persistence), A3.

## #12. Skills view: manageable `vw-` section vs read‑only project skills

**Current:** `SkillsScreen.tsx` lets you toggle/edit **any** skill; it already knows `builtin`
(`name.startsWith('vw-')`).

**Change:** split into two sections:
- **Valkeon skills (`vw-*`)** — full management: enable/disable, edit (`SkillEditor`), the existing controls.
- **Project skills (everything else)** — **read‑only**: list them, allow **viewing** `SKILL.md` (no toggle,
  no edit). A clear "managed outside Valkeon" caption.

This also makes #7a coherent (the worktrees skill it toggles is a `vw-` skill in the managed section).

**Files:** `SkillsScreen.tsx` (section split + gate controls on `builtin`), no persistence changes.

---

# Phase G — Theming (light mode + system default)

**Scope reality:** the app styles with **inline `style={{}}` objects using hardcoded hex** (e.g. `#16161a`
lines, `#8a8a93` muted text, `#e07a6e` danger, `#7dd99a` green) in nearly every component. Only the **accent**
is already a CSS variable. A real light theme therefore requires **tokenizing all colors into CSS variables**
first — this is the bulk of the effort and it touches almost every renderer file. There is no shortcut.

## G1. Color token system

Define a semantic token set as CSS variables in `styles/global.css` `:root` (dark = default values), alongside
the existing accent vars. Proposed groups:
- **Surfaces:** `--bg` (app base), `--panel`, `--elevated`, `--hover`, `--overlay` (modal scrim).
- **Text:** `--text` (primary), `--text-dim` (secondary), `--text-muted`, `--text-inverse`.
- **Lines:** `--line` (borders/dividers), `--line-soft`.
- **Status:** `--ok` (running green `#5cc98a`), `--warn` (waiting amber `#e0b15e`), `--idle` (gray),
  `--info`/`--done` (blue), `--danger` (`#e07a6e`).
- Accent vars stay as they are.

## G2. Light palette

Add an override block `:root[data-theme='light'] { … }` with a light palette (light surfaces, dark text,
softened accents so the accent stays legible on light backgrounds). **I'll propose concrete light values for
review** before the sweep, since the hifi design is dark‑only and this is new visual territory (authorized by
the explicit request).

## G3. Theme selection + system default

- Store: `themePref: 'system' | 'dark' | 'light'` (persisted in global settings). Resolved theme applied by a
  new `theme/applyTheme.ts` that sets `document.documentElement.dataset.theme` (mirrors `applyAccent.ts`).
- **System detection (Electron main):** `nativeTheme.shouldUseDarkColors` for the initial value and a
  `nativeTheme.on('updated', …)` push so `'system'` mode live‑updates when the OS flips. New IPC
  `system:theme` (get) + a `system:theme-changed` push event; preload `window.api.system.theme()` /
  `onThemeChanged(cb)`; subscribed in `App.tsx`.
- **Settings control:** a segmented control (System / Dark / Light) in the **Application** tab (#8), default
  **System**.

## G4. Migration sweep (the bulk)

Replace hardcoded hex with `var(--token)` across all components + `global.css`. Special cases that need their
own theme wiring (not plain CSS vars):
- **Monaco** (`CodeViewer.tsx`, review diff): switch the editor `theme` prop `vs-dark` ↔ `vs` (light) on the
  resolved theme.
- **xterm.js** (`XTerm.tsx`): xterm takes a JS `theme` object of colors — provide dark/light variants and set
  on theme change (may require re‑applying to live terminals).
- **mermaid** (card descriptions): `mermaid.initialize({ theme: 'dark' | 'default' })` per resolved theme.
- Status/semantic inline hex → the `--ok/--warn/--danger/…` tokens.

**Files:** `styles/global.css`, `theme/applyTheme.ts` (new), `theme/accents.ts` area, `main/index.ts` +
new `system` IPC, `preload/index.ts`, `App.tsx`, `SettingsScreen.tsx`, and a broad sweep of
`components/**`, `screens/**`, `dialogs/**`, `ui/**`, `CodeViewer.tsx`, `XTerm.tsx`.

---

# Phase H — Internationalization (pt‑BR, es‑AR, en fallback)

**Scope reality:** UI strings are hardcoded English literals in JSX throughout the renderer. Full translation
requires extracting every user‑facing string into catalogs and routing it through a `t()` function — another
touch‑almost‑every‑file sweep, comparable in size to Phase G.

## H1. i18n infrastructure

- Catalogs: `src/renderer/src/i18n/{en,pt-BR,es-AR}.ts` — typed nested key objects (`en` is the shape source
  and the **fallback** for any missing key).
- **Library: `react-i18next`** (decided). Setup: `i18next` + `react-i18next` + `i18next-browser-languagedetector`
  (or feed the OS locale from main directly). Resources = the three catalogs; `en` set as `fallbackLng`.
  Components use the `useTranslation()` hook / `t('key', {vars})`; ICU‑style interpolation & plurals come for
  free. `<Trans>` for strings with embedded markup.
- Locale lives in the store and is pushed into `i18next.changeLanguage(...)` so switching language updates the
  whole app live.

## H2. Locale preference + system default

- Store: `localePref: 'system' | 'en' | 'pt-BR' | 'es-AR'` (persisted globally); resolved `locale` derived
  from it.
- **System default:** main exposes the OS locale (`app.getLocale()`), mapped to the nearest supported
  (`pt*`→`pt-BR`, `es*`→`es-AR`, else `en`). New IPC `system:locale`; preload `window.api.system.locale()`.
- **Settings control:** a language selector in the **Application** tab (#8), default **System**.

## H3. String‑extraction sweep

- Replace hardcoded UI strings with `t(...)` across `components/**`, `screens/**`, `dialogs/**`, `ui/**`,
  nav labels, confirm dialogs, empty states, tooltips, button labels, status labels, etc.
- **Locale‑aware formatting:** relative times ("2m ago", the live session timers) via
  `Intl.RelativeTimeFormat`; numbers/tokens via `Intl.NumberFormat`; dates via `Intl.DateTimeFormat` — all
  keyed to the resolved locale.
- **Do NOT translate:** code, file paths, branch names, model ids, skill ids, git output.
- I will author the **pt‑BR** and **es‑AR** (Rioplatense — natural *voseo* where verbs appear) copy myself;
  `en` is extracted from the existing literals.

## H4. AI output language (consideration)

The app's own AI features (**#1 generate cards**, **#10 cleanup summaries**) should respond in the user's
selected language. Plan: pass the resolved locale into those prompts ("Respond in Brazilian Portuguese"). The
user's own chat with Claude sessions is out of scope (they drive that directly).

**Files:** new `src/renderer/src/i18n/*`, `useStore.ts` (locale state + actions), `main/index.ts` + `system`
IPC, `preload/index.ts`, `SettingsScreen.tsx`, and a broad sweep of every renderer view/component/dialog.

---

## Sequencing note for Phases G & H — **decided: do them FIRST**

Both are "touch almost every file" sweeps that edit the **same** files, so they run **before** the feature
phases, as one clean pass over today's app:
- **M1 does the theming sweep**, **M2 does the i18n sweep** (they can even be merged into a single per‑file
  pass — tokenize colors **and** wrap strings in one visit per file — which is cheapest).
- Every feature built afterward (Phases A–F work) is then authored **theme‑tokenized and translated from the
  start**, so no cleanup debt accrues.
- **Caveat:** the theme/language **Settings controls** are added to the *current* (untabbed) `SettingsScreen`
  in M1/M2, and later **relocated into the Application tab** when the Settings‑tabs refactor (#8) lands.

---

# Suggested milestone order & review points

**Theming & i18n go first** (decided), as one clean sweep over today's app; features follow.

1. **M1 — Theming (Phase G, full):** G1 tokens → **G2 light palette (propose for review first)** → G3 switch
   + `nativeTheme` system detection → G4 sweep (tokenize all components; Monaco/xterm/mermaid theme wiring).
   Theme control added to the current `SettingsScreen`. *Review — starting with the proposed light palette.*
2. **M2 — i18n (Phase H, full):** `react-i18next` setup, H2 locale detection (OS default → nearest of
   pt‑BR/es‑AR/en), H3 extract **all** current strings + author pt‑BR/es‑AR + locale‑aware `Intl` formatting,
   H4 AI output language. Language control added to the current `SettingsScreen`. *Review.*
   *(M1+M2 may be merged into a single per‑file pass — tokenize colors and wrap strings in one visit.)*
3. **M3 — Foundations:** A1 (one‑shot AI), A2+A3 (notification store + virtual list), A4 (submenu + resize
   primitive), A5 (local excludes). *Review.*
4. **M4 — Quick wins:** #7b, #7a, #2, #6. *Review.*
5. **M5 — Board:** #1 (real generate), #3 (card menu). *Review.*
6. **M6 — Explore:** #5 (resizable sidebars, title‑bar actions, VS Code). *Review.*
7. **M7 — Notifications UI:** sidebar bell + `NotificationsDialog` (on A2/A3); retrofit History to virtual list. *Review.*
8. **M8 — Worktrees:** #4 (details/richer), then #10 (cleanup skill + dialogs). *Review.*
9. **M9 — Settings/Sidebar/Skills:** #8 (tabs — relocates the theme/language controls into the Application
   tab), #9, #12. *Review.*

Every component authored in M3–M9 is theme‑tokenized and `t()`‑wrapped from the start (new strings translated
into pt‑BR/es‑AR as they're written). Each milestone runs `npm run typecheck` (node + web) and, where touched,
the persistence test, before the review pause.

---

# Decisions locked (2026‑07)

- **A3 virtualization:** ✅ add `@tanstack/react-virtual`, wrapped in `ui/VirtualList.tsx`.
- **#1 generate cards:** ✅ real AI only — on failure show inline error + **Retry**, no literal‑split fallback.
- **#5 Explore layout:** ✅ keep **tree‑left, editor‑right**; only add the resize handle + title‑bar actions.
- **#10 cleanup engine:** ✅ **A1 one‑shot AI + git facts** (feed each worktree's git status to a single
  JSON‑returning call).
- **Phase H i18n library:** ✅ **`react-i18next`** (with `en` as `fallbackLng`).
- **Phases G+H rollout:** ✅ **do theming + i18n FIRST**, before the feature phases (one clean sweep over
  today's app; Settings controls relocate into the Application tab later when #8 lands).

# Consolidated open questions (still to decide)

1. **#3 context menus:** which extra elements this round (column headers, board tabs, workspace entries)?
2. **#7a worktrees skill:** confirm "enable on opt‑in, never auto‑disable"; per‑workspace skills is out of scope?
3. **#8 settings:** retire `ProjectSettingsDialog` in favor of the Workspace tab, or keep both?
4. **#9 sidebar top‑4:** strict user order, or float running/active items to the top? Include Duplicate?
5. **#10 cleanup:** which "dead" heuristics matter most to you (unmerged+clean, stale, no linked session)?
6. **Phase G light palette:** any brand/reference for the light theme, or should I propose one for review?

---

# Appendix — the `.git/info/exclude` question, answered

**Yes, it's real, and there are two distinct mechanisms — pick by whether the file is tracked:**

### 1. Untracked files/dirs → `.git/info/exclude`
`.git/info/exclude` is a per‑clone ignore file with the **exact same syntax as `.gitignore`**, but it lives
inside `.git/` so it is **never committed and never shared**. Anything matched is ignored locally only. This
is the correct tool for `.valkeon/` (and any other Valkeon‑generated, untracked artifacts): each teammate's
checkout ignores them without a shared `.gitignore` change and without touching the repo's history.

```
# .git/info/exclude   (local to this clone, not committed)
.valkeon/
```

### 2. Already‑tracked files → skip‑worktree / assume‑unchanged
`.gitignore` and `.git/info/exclude` only affect **untracked** paths. If a file is already tracked, use:
- `git update-index --skip-worktree <path>` — "I have local changes I don't want to commit; leave it alone."
  (The intended flag for config‑style files.)
- `git update-index --assume-unchanged <path>` — a performance hint, weaker guarantee; less appropriate here.

For Valkeon this is only relevant if a `.valkeon/` file was committed before being excluded.

### How this maps to the app (item #6)
- Today Valkeon writes **nested `.gitignore` files** *inside* `.claude/skills/` and
  `.valkeon/skills-disabled/` (`ensureSkillGitignores` in `src/main/skills/reader.ts`) to keep skill state
  machine‑local. That works but scatters ignore rules and (for `.claude/skills`) commits an extra file.
- The cleaner, centralized approach the user is describing is **`.git/info/exclude`**. Plan:
  1. Add `ensureLocalExcludes(repoPath, patterns)` (A5) that appends a marked block to `.git/info/exclude`.
  2. On repo open / init, ensure `.valkeon/` is excluded (and optionally consolidate the skills patterns
     there, deprecating the nested `.gitignore` writes over time).
  3. Idempotent, marker‑delimited, resilient to `.git` being a gitdir‑pointer file (worktrees/submodules).
- **Caveat:** `.git/info/exclude` is strictly local — it does **not** propagate to teammates. That's exactly
  what we want for machine‑local Valkeon artifacts. If we ever want a shared ignore, that must be the
  committed `.gitignore` instead. The two are complementary.
