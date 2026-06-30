# ADR 0001 — Where Valkeon persists data

**Status:** accepted · **Date:** 2026-06-30

## Context

Valkeon opens a repo/project folder and manages workspaces, AI sessions, plain
terminals, a Kanban board, worktrees, and history. The question: what gets
written to disk, and *where* — inside the repo, or somewhere local?

## Decision

Split data by **ownership**, into three tiers:

| Tier | Location | Examples | In git? |
|---|---|---|---|
| **Content** (durable, shareable) | `<repo>/.valkeon/` as text | Board defs, cards (markdown), labels, workspace structure | ✅ committed by the user |
| **Local state** (ephemeral, possibly sensitive) | `userData`, keyed by repo path | Session transcripts, terminal scrollback, live agent flags, card→session bindings, activity timeline | ❌ never |
| **Global user** | `userData/valkeon.json` | Settings (accent, default agent, toggles), recent projects, window bounds | ❌ never |

The **Kanban board content goes in the repo**; everything runtime/sensitive does not.

### Why board-in-repo fits Valkeon specifically

1. **Claude operates on files.** A card is a markdown file, so "Claude moved this
   to In Progress" is just Claude editing a file with its normal tools —
   observable and diffable, not a hidden DB mutation.
2. **Precedent:** Claude Code already uses `.claude/` (committed config). `.valkeon/`
   mirrors that. (We do **not** reuse `.claude/` — that's Claude's namespace.)
3. **Planning travels with the code** and is readable on GitHub without Valkeon.
4. **`git log` is the board's history** for free.

## On-disk layout

```
<repo>/.valkeon/
  .gitignore            # ignores local/ and cache/ so `git add .valkeon` is safe
  workspaces.json       # workspace structure (names, useWorktree, board membership)
  boards/<boardId>/
    board.json          # scope, base branch, columns, label palette
    cards/<code>-<slug>.md   # one file per card: YAML frontmatter + markdown body
```

A card file:

```markdown
---
code: 21
column: in-progress
order: a3            # fractional index key (conflict-free reorders)
labels: [auth, ai]
branch: feat/sso
worktree: ../acme.wt/sso
---

# Add SSO with Google and Okta

Body markdown, ```mermaid blocks, GFM tables, checklists…
```

## The rules that keep it clean

1. **Write to the working tree, never auto-commit.** Valkeon updates `.valkeon/`
   files; the user commits them deliberately. An AI app that changes things
   autonomously must not also write git history on its own.
2. **No binary DB in the repo.** Text (md/JSON) for the committed tier; JSON in
   `userData` for the local tier. (SQLite is unmergeable/undiffable in git.)
3. **Secret-safe.** Terminal/session output can contain tokens — it lives only in
   `userData`, never in `.valkeon/`. The activity timeline is local too.
4. **Mergeable layout.** One file per card (no giant rewritten list) +
   fractional ordering keys, so a reorder touches only the moved card.

## Architecture

Persistence is a **port with swappable adapters**, the same hexagonal shape as
the AI provider layer:

- Port: `BoardStore` (`src/shared/persistence/boardStore.ts`).
- Adapters: `RepoFileBoardStore` (`.valkeon/`) and `LocalBoardStore` (`userData`),
  in `src/main/persistence/`.
- Selected by the `boardStorage: 'repo' | 'local'` setting via
  `createBoardStore(mode, repoPath)` — so "repo vs local" is a config flip, not a
  rewrite.

## Escape hatch

Default is `boardStorage: 'repo'`. Teams that live in Jira/Linear can set it to
`'local'` and nothing lands in the repo. The app works either way, and never
writes into the repo until the first board/card save (opening a project alone
writes nothing).

## Status in code (this milestone)

Implemented now: the ports + both adapters + factory, card frontmatter
serialization, fractional ordering, the `.valkeon/` scaffold, the `GlobalStore`
(settings/recents/window-bounds, with window-bounds restore and recent-project
persistence wired end-to-end), and the IPC surface. The board **UI** that drives
`saveCard`/`saveBoard` is a later milestone. Round-trip behavior is covered by
`npm test` (`test/persistence.test.mts`).
