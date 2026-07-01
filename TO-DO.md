# Valkeon Workbench — build plan

**STATUS: all phases (A, B, B.5, C, D, E) implemented, verified, and committed.**
Two adversarial review rounds applied (mid-session active-time/persist fixes + a final
8-finding pass on Monaco/review/files/commands). Only open item: verify `/effort` live.

Living plan for the in-flight work. Chosen order is foundational → visible. Items
get checked off as they land. (Author: Claude, at the user's direction.)

## Legend
`[ ]` todo · `[~]` in progress · `[x]` done

---

## Phase A — small fixes + housekeeping (this pass)

- [x] **Structured = default** for New session (Interactive stays a toggle).
- [x] Sidebar session **label + time sync** (live status + ticking elapsed).
- [x] Grid **full width when a single** session/terminal.
- [x] **Worktree deletion logged** to history.
- [x] **In Review status syncs**; session id → clickable `#abc123` that opens the session.
- [x] Header **vertical alignment** + composer aligns with `›`.
- [x] **Settings Save button** (fixed footer, live preview, revert-if-unsaved).
- [x] **Logo: `>` → `V`** ("V_" for Valkeon), keep the square/gradient/glow effect.
- [x] **Status idle when nothing is happening** — structured: spawn→idle, send→running,
      turn-complete→idle. Auto-advance the card on the dedicated `turn-complete` event.
- [x] **"Running for" counts only producing time** ("Active for" for structured = accumulated
      running ms). Interactive keeps wall-clock "Running for".
- [x] **Skills: Run/Edit buttons fixed to the bottom** of the detail panel.
- [x] **Run skill actually prompts the agent** — spawns a structured session + invokes the skill.
- [x] `git init` + add + commit (baseline, original icon preserved in history), then the icon change.

## Phase B — session persistence + resume (foundational) ✅

- [x] Persist the **session list** + per-session `session_id` (captured from the CLI's
      `system/init` event) to `userData/projects/<hash>/sessions.json` (debounced).
- [x] On reopening the project, **resume** structured sessions with `claude --resume <id>`
      (gated by the **"Restore sessions on open"** setting). Runs after the workspace settles.
- [x] Interactive sessions: persisted; respawn a fresh PTY when first viewed.
- [x] Capture `session_id` in the adapter (`system/init`) → `{kind:'session-id'}` event → store.

## Phase B.5 — OS notifications ✅

- [x] OS notification when a structured session **completes a turn / needs a decision**
      (detects a trailing "?" → "needs input" vs "finished"), via main-process Electron Notification.
- [x] **Per-session toggle** (bell in the session header), live — doesn't touch the process; persisted.
- [x] Suppressed while you're actively viewing that session (focused). Click → opens the session.

## Phase C — structured commands (rides on resume) ✅

- [x] Composer routes through `submitToAgent`: intercepts client commands, passes everything
      else (custom/prompt commands, `/effort`, `/compact`, …) through to the agent.
- [x] `/model <x>` → relaunches the **same session** via `--resume <id>` with the new model,
      preserving context (falls back to fresh if no context yet). Model picker button still works.
- [x] `/clear` → fresh session (drops context + transcript, no resume).
- [ ] NOTE: `/effort` passes through to the CLI — verify live that the CLI accepts it; if it
      needs a real flag, wire it like `/model` (add `effort` to the spec → adapter flag).

## Phase D — card dialog Save button + Start-task gating ✅

- [x] Card dialog: title + body edited as a local **draft**; explicit **Save card** in a fixed
      footer (with a Saved/Unsaved indicator). No more per-keystroke autosave.
- [x] **"Start task" disabled until the card is saved** (has a real title, no unsaved changes).
      Close-without-save discards an unsaved new card via the existing draft-discard logic.

## Phase E — Monaco IDE + review (the big one)

Bring in `monaco-editor` (via `@monaco-editor/react`), used for two things:

- [x] **IDE / file-explorer mode** — "Explore" view: file tree + read-only Monaco viewer with
      syntax highlighting + app-tuned dark theme. **`.valkeon` hidden** (also `.git`, `node_modules`,
      build dirs). Monaco bundled offline (local loader + editor worker, CSP `worker-src` opened).
- [x] **Review window** (the board "Review diff" now opens it) — Monaco side-by-side diff of the
      card's worktree vs HEAD, with a changed-files list.
  - [x] Actions: **Approve** (→ Done), **Decline** (→ In Progress), **Request changes** (feeds the
        comments to the card's agent as a new turn + → In Progress), **AI review** (spawns a
        structured session that reviews the diff).
  - [x] **Line-anchored comments** — click a line in the diff, add a note (`file:line`); on Request
        changes they're formatted and sent to the agent.
- [x] IPC: `files:tree` + `files:read` + `git:diff` (allowlisted repo, `.valkeon` filtered).

---

## Notes / decisions
- Structured mode uses the **Claude subscription** (same as interactive) — no API/extra cost.
- `git status`-based files-touched is filtered (`.claude/`, `.valkeon/`) + baselined to session start.
- Context meter = per-assistant-message usage (current window), not the inflated result sum.
- Worktree sessions wait for the dir (`waitForDir`) before launching, both modes.
