# Handoff: Valkeon Workbench

A desktop (Electron) command center for managing Claude Code sessions across a project. The goal: a single window a developer rarely needs to leave — multiple AI sessions, plain terminals, a planning Kanban, git worktrees, and history, all scoped per workspace.

---

## About the design files

The files in `design_reference/` are **design references created in HTML** — interactive prototypes that show the intended look, layout, and behavior. **They are not production code to copy.** Your task is to **recreate these designs in a real Electron app**, using a proper component architecture and real process/git integration.

The prototype is built as a "Design Component" (a custom streaming-HTML format) — **ignore the format**. Open the files in a browser to *see and click* the design; read this README for *what to build*. Do not try to reuse the `.dc.html` runtime or `support.js` — they are prototype scaffolding.

Recommended target stack (pick what fits you; this is what the design assumes):
- **Electron** + **React** + **TypeScript** + **Vite**
- **xterm.js** for real terminals/PTYs (via `node-pty`)
- **simple-git** (or shelling out to `git`) for worktree/branch operations
- The Claude Code CLI driven as a child process per session
- A markdown renderer (e.g. `react-markdown` + `remark-gfm`) and **mermaid** for diagrams
- Local persistence (SQLite via `better-sqlite3`, or JSON files) for workspaces/boards/cards/history

## Fidelity

**High-fidelity.** Colors, typography, spacing, and interactions are final. Recreate the UI pixel-closely, then wire it to real backends. Exact tokens are in the "Design tokens" section.

---

## Core concepts & hierarchy

```
Workspace  (top-level scope — e.g. "Platform", "Billing")
├── Sessions    (Claude Code AI sessions; each may use a git worktree)
├── Terminals   (plain shells — NOT AI; kept separate)
├── Boards      (Kanban; a workspace can have several)
│   └── Cards   (markdown tasks Claude can move between columns)
├── Worktrees   (optional git worktrees; linked to sessions)
└── History     (past sessions)

Global (NOT workspace-scoped): Skills, Settings
```

- A **workspace** groups its own sessions, terminals, boards, worktrees, and history. Switching workspace swaps all of those. This keeps things organized when a user has many terminals/sessions.
- **Worktrees are optional.** A workspace has a "use worktrees by default" flag. When creating a session the user chooses per-session whether to spin up an isolated worktree, so parallel sessions don't collide on the same checkout.
- **Boards are workspace-scoped.** Each board is also tagged with a scope (Feature / Epic / Release / Chore).
- The app is a **custom frameless window** — the app draws its own title bar with min/max/close controls (`-webkit-app-region: drag` on the bar, `no-drag` on the buttons).

---

## Screens / views

The left sidebar is persistent once a project is open. Top of sidebar = **workspace switcher**. Below it = nav (Board, Sessions, Terminals, Worktrees, History, Skills, Settings), then the live **Sessions** and **Terminals** lists for the current workspace, then a user/account row that opens Settings.

### 1. Launcher / Open project
- Centered column. Small uppercase **VALKEON WORKBENCH** wordmark (accent color, letter-spacing 0.18em) above an `Open a project` H1 (29px/600) and subtitle "Every Claude Code session for your repo, in one window."
- Two buttons: **Open project folder** (accent fill) and **Clone from Git** (dark outline).
- **Recent projects** list: folder icon, name, monospace path, "N sessions", branch chip, chevron. Row hover lightens background.

### 2. Workspace (main multi-terminal view) — nav label "Board/Sessions"
- Header: workspace name + "N sessions active" + a **worktree chip** ("N worktrees", purple) shown only when any session in the workspace uses a worktree (click → Worktrees view). Right side: layout segmented control (**Grid / Tabs / Split**) and **New session** button.
- **Grid layout**: 2×2 grid of terminal cards (see TerminalCard component).
- **Tabs layout**: one big terminal with a tab strip of sessions on top; a rich composer at the bottom (textarea, model chip, attach, Send).
- **Split layout**: two terminal panes with a **draggable vertical divider** (drag to resize, clamped ~28–72%).
- Empty state (fresh workspace, no sessions): centered icon + "No sessions in {workspace}" + New session button.

### 3. Single session (focused)
- Header: back arrow, status dot, session name, model chip, branch chip, Stop / Restart / more.
- Main: scrolling terminal transcript (monospace, color-coded lines) + a large composer (textarea, model chip, attach, Send). Enter sends, Shift+Enter newline.
- Right rail (300px): **Details** (Status, Model, Branch, **Worktree**, Running for), **Context** token usage bar, **Files touched** with +/- diff counts.

### 4. Terminals — plain shells, separate from AI
- Header: "Terminals · Plain shells — separate from AI sessions" + New terminal.
- 2-column grid of terminal cards with a `$` prompt, status dot (running/idle), cwd chip, close (✕ with confirm).
- These are normal PTYs (xterm.js), not Claude sessions. Sidebar lists them in their own **TERMINALS** group, separate from **SESSIONS**.

### 5. Board (Kanban)
- Board selector (dropdown listing this workspace's boards + "New board"), scope badge, "N cards · base <branch>".
- Header actions: **Labels** (manager), **Generate cards** (AI drafts cards from a description into Backlog), **New card**.
- Columns: **Backlog → To Do → In Progress → In Review → Done**. Each column: dot + name + count + add button; cards stack vertically.
- **Card** (in column): label chips, attachment icon+count (if any), code (#21), title, 2-line excerpt, linked branch/worktree chips, a green pulsing "Claude is working · session" row when the AI is active on it, and a contextual action button:
  - Backlog/To Do → **Start task** (accent) — creates branch + worktree, sets `col=In Progress`, attaches a session, logs activity.
  - In Progress (with session) → **Open session**.
  - In Review → **Review diff**.
- Claude autonomously moves cards and appends to each card's **activity log** ("Claude moved this to In Progress", "Created worktree on …").

### 6. Card dialog (centered modal, ~720px)
- Header: code, column badge, **delete** (with confirm), close.
- Editable **title** input.
- **Labels** row: chips with × to remove; a **+ Label** button (same height as chips) opens a popover to toggle the board's labels on/off, plus "Manage labels".
- **Linked work** panel: branch, worktree, session (click → open session). If unlinked, a **Start task** button (creates branch + worktree, hands to Claude).
- **Description** (markdown): **Write / Preview** toggle. Write mode has a **toolbar**: H1/H2/H3, bold, italic, strikethrough, link, inline code, bulleted/numbered/checklist, quote, code block, **Table builder**, **Diagram builder**. Preview renders markdown incl. GFM tables, checkboxes, and **mermaid** diagrams.
- **Attachments**: "Add attachment" (file picker) → list with size + remove (confirm). Cards with attachments show an icon on the board.
- **Activity** log: icon + text + relative time.

### 7. Table builder (modal)
- Grid of inputs: editable header row + body cells. Add/remove columns, add/remove rows. **Insert table** appends GFM markdown to the card body (so the raw markdown is still editable afterward).

### 8. Diagram builder (modal, ~760px)
- Template chips (Flowchart / Sequence / Class / Mindmap). Split pane: **Mermaid source** textarea (left) + **live preview** (right, rendered with mermaid). **Insert diagram** appends a ```mermaid fenced block to the card body.

### 9. Worktrees (optional)
- Header: "Worktrees · optional · N active" + New worktree.
- **main checkout** row (home icon, path, branch, clean status), then **LINKED WORKTREES**: branch (mono), path, linked session (click → open) or "no active session", status (clean/dirty/ahead, color-coded), age, open-folder, **delete** (confirm — keeps branch, removes working copy).

### 10. Skills (global)
- ".claude/skills · N enabled" + New skill. 2-column cards: icon, enable toggle, name, description, type tag (bash/git/db/react/docs/lint), trigger (auto/manual), run count.
- Right detail rail: large icon, name, description, enabled toggle, trigger/runs/type, "touches" path chips, instructions (monospace block), Run now / Edit.

### 11. Settings (global)
- **Appearance**: accent color swatches; terminal font-size slider (11–15px).
- **General**: toggles — Restore sessions on open, Confirm before closing a running session, Launch at login.
- **Models**: default model segmented control (Opus/Sonnet/Haiku).
- **Keyboard**: shortcut list (⌘N new session, ⌘K palette, ⌘⇥ cycle, ⌘\ toggle layout, ⌘L focus composer).

---

## Key dialogs & flows

- **New session**: name, model (Opus/Sonnet/Haiku), **Use a git worktree** toggle (pre-set from workspace default), **Skip permission prompts** toggle (amber, labeled `--dangerously-skip-permissions`, off by default — destructive). On submit: create session, optionally create worktree + branch `feat/<slug>`, start the Claude Code process; if skip-perms on, launch the CLI with that flag.
- **New workspace**: name + "use worktrees by default" toggle.
- **New board**: name + scope (Feature/Epic/Release/Chore).
- **Generate cards**: free-text spec → AI drafts cards into Backlog (label `ai`, activity "Drafted by Claude").
- **Confirm dialog**: ALL destructive actions route through one reusable confirm modal (delete card, delete label, remove worktree, close terminal, remove attachment). Amber warning icon, red confirm button.

---

## Interactions & behavior

- Enter sends in composers/terminals; Shift+Enter = newline.
- Layout segmented control swaps Grid/Tabs/Split instantly; Split divider is mouse-drag with min/max clamp.
- Markdown toolbar buttons wrap/insert at the cursor selection; Table/Diagram buttons open builder modals instead of inserting raw syntax.
- Mermaid renders on entering Preview and inside the diagram builder (debounced on source change).
- Status dot states: **running** (green, pulsing), **waiting** (amber), **idle** (gray), **done** (blue).
- Switching workspace resets active session/board to that workspace's first, and re-scopes sidebar lists.
- Navigating via nav closes any open card drawer/menus.

## State management

Per **workspace**: sessions[], terminals[], boards[] (each with columns[] + cards[]), worktrees[], board labels, history. Global: skills[], settings (accent, terminal font size, default model, toggles), list of workspaces, active workspace id.

Card shape: `{ id, code, col, title, body(markdown), labels[], attachments[{name,size}], linked{branch,worktree,sessionId}, agent(bool), activity[{icon,text,time}] }`.
Session shape: `{ id, wsId, name, status, model, branch, worktree, duration, task, tokens{used,limit}, files[{path,change}], lines[{type,text}] }`.
Terminal shape: `{ id, wsId, name, cwd, running, lines[{type,text}] }`.

Real backends to wire: PTY per terminal & session (node-pty/xterm), Claude Code CLI child process per session (stream stdout → transcript lines; parse tool/edit/file events for the Files-touched + activity), git for branch/worktree create/list/remove/status, persistence for all workspace data.

---

## Design tokens

**Fonts**: `Geist` (UI), `Geist Mono` (code/paths/chips/terminal), `Material Symbols Rounded` (icons). Load from Google Fonts.

**Color palette (dark):**
| Role | Hex |
|---|---|
| App background (radial) | `#131319` → `#050507` |
| Window surface | `#0b0b0d` |
| Panel / sidebar | `#0a0a0c` |
| Card / elevated | `#0c0c0f`, `#0e0e12`, `#0d0d11` |
| Terminal background | `#0a0a0c` |
| Borders | `#16161a`, `#1b1b21`, `#1c1c22`, `#232329` |
| Text primary | `#ededf0` / `#e4e4ea` |
| Text secondary | `#9a9aa3` / `#8a8a93` |
| Text muted | `#6b6b74` / `#56565e` |
| Accent (default) | `#5b9dd9` (selectable: `#d97757`, `#7dd99a`, `#b89cf0`, `#e0b15e`) |
| Accent hi (derived) | lighten accent ~26% |
| Status running | `#5cc98a` · waiting `#e0b15e` · idle `#6b6b74` · done `#5b9dd9` |
| Worktree purple | `#b89cf0` |
| Danger (confirm) | `#e0574d` · skip-perms amber `#e0a05b` |

Accent is used as a CSS variable (`--accent`, `--accent-hi`, `--accent-soft` = 13% alpha, `--accent-line` = ~34% alpha). Derive soft/line via alpha of the chosen accent.

**Label colors** (13): `#5b9dd9 #e07a6e #b89cf0 #7dd99a #e0b15e #5fb4ad #9b8cf0 #d98cc0 #6cc0e0 #e8a15b #8ad0a0 #c98ce0 #e07a9e`.

**Radii**: window 14px; modals 13–14px; cards/panels 10–12px; chips/buttons 7–9px; small chips 5–6px.
**Type scale**: H1 29 / titles 18–20 / section 15 / body 13–14 / small 11.5–12.5 / chips & labels 9.5–11 (mono). Section eyebrows: 11px, weight 600, letter-spacing 0.08em, muted, UPPERCASE.
**Spacing**: 8px base rhythm; panel padding 16–24px; card padding 11–14px.
**Shadows**: window `0 40px 120px rgba(0,0,0,.6)`; modals `0 30px 80px rgba(0,0,0,.6)`; popovers `0 18px 50px rgba(0,0,0,.55)`.
**Animations**: `fadein` (opacity+6px translate, ~.2s) for modals/cards; status `pulse` 2s; terminal caret `blink` 1s steps.

**Icons** (Material Symbols Rounded): terminal, grid_view, view_kanban, account_tree, history, auto_awesome, tune, workspaces, add, rocket_launch, open_in_full, difference, attach_file, schema, table_chart, fork_right, settings, gpp_maybe, warning, folder_open.

## Assets

No bitmap assets. The logo is a rounded-square gradient tile with a `terminal` glyph. Icons via Material Symbols Rounded (web font). Fonts via Google Fonts. Mermaid via the `mermaid` npm package.

## Files

- `design_reference/Valkeon Workbench.dc.html` — the full app (all screens, dialogs, logic). Open in a browser to interact.
- `design_reference/TerminalCard.dc.html` — the reusable terminal pane (header, transcript, inline composer) used in Grid/Split/Terminals.
- `design_reference/support.js` — prototype runtime only; **do not port**.
- `PROMPT.md` — paste into Claude Code to kick off the build.
- `CLAUDE.md` — drop at repo root; persistent project guidance for Claude Code.
