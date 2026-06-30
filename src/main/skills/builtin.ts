/**
 * Valkeon's own skills (`vw-` prefix), installed into a project's
 * `.claude/skills/` so the agent CLI actually loads them. They teach the agent
 * how to work *inside* Valkeon — parallel sessions, the board, worktrees — so
 * the human can orchestrate real work from one window. Each has a precise
 * "when to use" description so it only enters context when relevant, and they
 * reference each other so the agent can chain them.
 */
/**
 * Bump when the built-in skill *content* changes. `ensureBuiltinSkills` refreshes
 * the on-disk `vw-*` files when a project's installed version is behind this, so
 * improvements ship to already-initialized projects. User-authored (non-`vw-`)
 * skills are never touched.
 */
export const BUILTIN_VERSION = 2

export const BUILTIN_SKILLS: { id: string; content: string }[] = [
  {
    id: 'vw-overview',
    content: `---
name: Valkeon overview
description: Use at the start of a session in a Valkeon Workbench project to understand how work is organized here (sessions, board, worktrees).
trigger: auto
---

This repo is managed by **Valkeon Workbench** — a command center where one
developer runs several agent sessions in parallel and tracks them on a Kanban
board. Work the way the tool expects:

- **You are one of possibly several sessions.** Other sessions may be editing
  other branches/worktrees right now. Stay within your own task, branch, and (if
  present) worktree. Don't touch another session's branch.
- **The board is the source of truth for what to do.** Tasks are cards under
  \`.valkeon/boards/\`. See the **vw-board** skill to read/update them and the
  **vw-task** skill to take a card from start to finish.
- **Worktrees isolate parallel work.** If your working directory is a \`*.wt/…\`
  folder, see the **vw-worktrees** skill.
- **Never auto-commit.** Make changes in the working tree; the human commits via
  Valkeon. Keep diffs small and reviewable.
`
  },
  {
    id: 'vw-task',
    content: `---
name: Valkeon task workflow
description: Use when asked to work on a board task/card from start to finish (e.g. via "Start task"). Drives the card through the columns as you progress.
trigger: auto
---

Taking a Valkeon board card from start to done:

1. **Read the card.** It's a markdown file under
   \`.valkeon/boards/<boardId>/cards/<code>-<slug>.md\` — frontmatter
   (\`code\`, \`column\`, \`labels\`, \`branch\`, \`worktree\`) + an \`# H1\` title + body.
   The title and body are the requirements.
2. **Work on the card's branch.** It's \`feat/<slug>\`; if a \`worktree\` is set you're
   already in it (see **vw-worktrees**). Don't switch branches.
3. **Keep the board honest.** Edit only this card's \`column\` frontmatter as you
   progress — set \`column: in-review\` when the work is ready for review. Don't
   move other cards. (See **vw-board** for the exact format.)
4. **Summarize** what you changed and how to verify it, then stop. **Do not
   commit** — the human reviews and commits in Valkeon.
`
  },
  {
    id: 'vw-board',
    content: `---
name: Valkeon board
description: Use to read the Kanban board or update a card's status/content. Cards are markdown files under .valkeon/boards/.
trigger: auto
---

The Valkeon board is plain files in the repo — edit them directly, never
auto-commit:

- **Cards:** \`.valkeon/boards/<boardId>/cards/<code>-<slug>.md\`
  \`\`\`
  ---
  id: c21
  code: 21
  column: in-progress      # backlog | todo | in-progress | in-review | done
  order: a3                # ordering key — leave it alone
  labels: [auth, ai]
  branch: feat/sso
  worktree: ../acme.wt/sso
  ---
  # Card title
  Body in markdown…
  \`\`\`
- **Board definition:** \`.valkeon/boards/<boardId>/board.json\` (columns, labels).

To move a card, change its \`column\` value. To update a task, edit its body.
Touch one card per change; don't rewrite the \`order\` or other cards. This is how
your progress shows up on the human's board in real time.
`
  },
  {
    id: 'vw-worktrees',
    content: `---
name: Valkeon worktrees
description: Use ONLY when this session runs inside a git worktree created by Valkeon (its cwd is a "*.wt/…" directory). Keeps changes scoped to the worktree's own branch.
trigger: auto
---

This session runs in a Valkeon **git worktree** — an isolated checkout on its
own branch, created so parallel sessions don't collide on the same files.

- Stay on this worktree's branch. Do NOT \`git checkout\` / \`git switch\` here.
- Commit work here normally (when the human asks); it lands on this branch only.
- The repository's main checkout — and other sessions' worktrees — are separate
  directories. Don't modify them from this session.
- When the task is done, leave the branch ready for review (see **vw-task**).
  Valkeon manages removing the worktree afterwards.
`
  }
]
