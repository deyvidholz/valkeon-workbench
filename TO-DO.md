# Valkeon Workbench — build plan

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
- [ ] **Logo: `>` → `V`** ("V_" for Valkeon), keep the square/gradient/glow effect.
- [ ] **Status idle when nothing is happening** — structured: spawn→idle, send→running,
      turn-complete→idle (drop the amber "waiting" for the quiet state). Auto-advance the
      card on a dedicated `turn-complete` event (not on every idle, so spawn doesn't advance).
- [ ] **"Running for" counts only producing time** — accumulate active (running) ms for
      structured sessions; idle/done time doesn't count. Interactive keeps wall-clock.
- [ ] **Skills: Run/Edit buttons fixed to the bottom** of the detail panel.
- [ ] **Run skill actually prompts the agent** — spawn a structured session and send a
      first turn that invokes the skill (today it only opens the dialog).
- [ ] `git init` + add + commit (baseline, original icon preserved in history), then the icon change.

## Phase B — session persistence + resume (foundational)

- [ ] Persist the **session list** + per-session `session_id` (captured from the CLI's
      `system/init` event) to `userData/projects/<hash>/sessions.json`.
- [ ] On reopening the project, **resume** structured sessions with `claude --resume <id>`
      (gated by the existing **"Restore sessions on open"** setting).
- [ ] Interactive sessions: persist enough to relaunch (cwd/branch/worktree); they restart fresh.
- [ ] Capture `session_id` in the adapter (`system/init`) → `{kind:'session-id'}` event → store.

## Phase C — structured commands (rides on resume)

- [ ] Composer: typed `/...` commands. Pass-through for custom/prompt commands.
- [ ] `/model <x>` and `/effort <x>` → relaunch the **same session** via `--resume <id>`
      with the new flag, preserving context. Surface as buttons too (model picker already exists).
- [ ] `/clear` → fresh session (new context); `/compact` → compaction request if supported.

## Phase D — card dialog Save button + Start-task gating

- [ ] Card dialog: replace autosave with an explicit **Save** (fixed footer), like Settings.
- [ ] **"Start task" disabled until the card is saved** (created). Close-without-save discards
      the new draft (reuses the existing draft-discard logic).

## Phase E — Monaco IDE + review (the big one)

Bring in `monaco-editor` (via `@monaco-editor/react`), used for two things:

- [ ] **IDE / file-explorer mode** — a new view to browse the project like VS Code: file tree +
      Monaco editor (read-only first, editable later). **`.valkeon` is hidden** in this view's
      tree and in any git surface it shows.
- [ ] **Review window** (replaces "Review diff" just opening the card) — a real diff view
      (Monaco diff editor) of the card's branch/worktree vs base.
  - [ ] Actions: **Approve**, **Decline**, **Ask for changes**, **AI review** (spawn an agent to review).
  - [ ] **GitHub-style line comments**; on "Ask for changes" the comments are fed back to the
        agent as context for its next turn.
- [ ] IPC: read file tree + file contents + git diff (allowlisted repo, `.valkeon` filtered).

---

## Notes / decisions
- Structured mode uses the **Claude subscription** (same as interactive) — no API/extra cost.
- `git status`-based files-touched is filtered (`.claude/`, `.valkeon/`) + baselined to session start.
- Context meter = per-assistant-message usage (current window), not the inflated result sum.
- Worktree sessions wait for the dir (`waitForDir`) before launching, both modes.
