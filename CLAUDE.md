# Valkeon Workbench — project guide for Claude Code

Desktop (Electron) command center for managing Claude Code sessions across a project. One window the developer rarely leaves: AI sessions, plain terminals, a planning Kanban, git worktrees, and history — all scoped per **workspace**.

## Design source of truth
- Full spec: `design_handoff_valkeon_workbench/README.md`.
- Interactive reference: `design_handoff_valkeon_workbench/design_reference/Valkeon Workbench.dc.html` (open in a browser). It's a **design reference, not production code** — recreate it, don't port the `.dc.html`/`support.js` runtime.

## Stack
Electron + React + TypeScript + Vite · xterm.js + node-pty (terminals & sessions) · simple-git (worktrees/branches) · react-markdown + remark-gfm + mermaid (card descriptions) · local persistence (better-sqlite3 or JSON).

## Architecture rules
- **Custom frameless window** — the app draws its own title bar (drag region + min/max/close).
- Everything except **Skills** and **Settings** is **workspace-scoped** (sessions, terminals, boards, worktrees, history). Switching workspace re-scopes all of it.
- **Sessions** (Claude Code AI) and **Terminals** (plain PTYs) are kept visually and structurally separate.
- **Worktrees are optional**, chosen per session (default from the workspace flag).
- All destructive actions go through one reusable **confirm dialog**.
- New sessions support the `--dangerously-skip-permissions` flag (off by default).

## Visual system
Fonts: Geist (UI), Geist Mono (code/paths/chips), Material Symbols Rounded (icons). Dark palette + a selectable **accent** exposed as CSS variables (`--accent`, `--accent-hi`, `--accent-soft`, `--accent-line`). Status colors: running green `#5cc98a`, waiting amber `#e0b15e`, idle gray, done blue. Exact tokens in the README.

## Working style
Match the hifi visuals closely. Build incrementally (shell → launcher → workspace → board → the rest) and pause for review at milestones. Ask before adding UI not present in the design.
