# Valkeon Workbench

> A desktop command center for AI coding agents — manage AI sessions, terminals, git worktrees, and a planning Kanban across your projects, all in one window.

Valkeon Workbench is a frameless Electron app that gives a single home to everything around AI-assisted development: multiple agent sessions, plain terminals, a planning board, git worktrees, and history — all scoped per **workspace**, so switching projects re-scopes the whole window at once.

It ships with **Claude Code** as the first supported agent, but the agent layer is built on a provider-agnostic ports & adapters design — adding another AI is a new metadata entry plus an adapter, with no UI changes.

---

## Highlights

- **AI sessions** — run agents in either *structured* mode (rich, telemetry-driven status: running / waiting / idle, active-time tracking, OS notifications on turn completion) or *interactive* mode (a raw xterm PTY). Sessions persist and **resume** on reopen.
- **Structured session commands** — `/model`, `/clear`, and other slash commands are routed through the agent; `/model` relaunches the same session with context preserved via resume.
- **Plain terminals** — real PTYs (`node-pty` + xterm.js), kept visually and structurally separate from AI sessions.
- **Planning Kanban** — markdown cards (react-markdown + GFM + mermaid diagrams) with labels, drag-ordering, and a card → "Start task" flow that spins up an agent session.
- **Git worktrees** — optional per session (default from a workspace flag); create, list, and delete worktrees and branches from the UI.
- **Explore (Monaco IDE)** — a file tree + read-only Monaco viewer with an app-tuned dark theme.
- **Review** — side-by-side Monaco diff of a card's worktree vs `HEAD` with line-anchored comments and Approve / Decline / Request-changes / AI-review actions.
- **History** — a per-workspace log of sessions, worktree operations, and other activity.
- **Skills** — author and run reusable agent skills.
- **Frameless, themable UI** — the app draws its own title bar; dark palette with a selectable accent.

---

## Stack

- **Electron** + **React 18** + **TypeScript**, built with **electron-vite**
- **xterm.js** + **node-pty** — terminals and agent PTYs
- **simple-git** — worktree / branch operations
- **@monaco-editor/react** — file viewer and diff review (bundled offline)
- **react-markdown** + **remark-gfm** + **mermaid** — card descriptions
- **zustand** — renderer state
- Local persistence — JSON under the repo's `.valkeon/` and Electron `userData`

---

## Architecture

```
Workspace  (top-level scope — e.g. "Platform", "Billing")
  ├── AI sessions      (agent-driven; structured or interactive)
  ├── Terminals        (plain PTYs)
  ├── Board            (Kanban cards → tasks)
  ├── Worktrees        (optional, per session)
  └── History          (activity log)

Skills & Settings are global (not workspace-scoped).
```

- **`src/main`** — Electron main process: PTY lifecycle, agent manager + adapters, git, file IPC, persistence.
- **`src/preload`** — the context-bridge surface exposed to the renderer.
- **`src/renderer`** — the React UI (screens, dialogs, components, zustand store).
- **`src/shared`** — vendor-neutral contracts shared across processes (agent ports, provider metadata, persistence types).

### Agent providers (ports & adapters)

The AI layer is deliberately provider-agnostic:

- **Port** — `src/shared/agents/port.ts` defines the neutral `AgentProvider` / session-handle contract.
- **Metadata** — `src/shared/agents/providers.ts` holds vendor-neutral provider info (models, icons, capability flags like `--dangerously-skip-permissions`). Safe to import in the renderer, so the UI never hardcodes "Claude".
- **Adapters** — concrete runtimes live in `src/main/agents/<provider>/` (e.g. `claude/ClaudeCodeAdapter.ts`) and register in `src/main/agents/registry.ts`.

Adding another AI = add a metadata entry + an adapter. The UI picks it up automatically.

---

## Installation

Download the installer for your platform from the [**Releases**](../../releases) page.

> Sessions and terminals run **on the machine the app runs on**, and Valkeon looks for the `claude` CLI on that machine's `PATH`. So run it where your dev environment lives — natively on Windows/macOS/Linux, or **inside WSL** if that's where your code, `git`, and `claude` are (see below).

### Windows

Download and run `valkeon-workbench-<version>-setup.exe`. Because the build isn't code-signed yet, SmartScreen may warn — choose **More info → Run anyway**.

### macOS

Download the `.dmg`, open it, and drag **Valkeon Workbench** to Applications. It's unsigned for now, so the first launch needs **right-click → Open** (or *System Settings → Privacy & Security → Open Anyway*).

### Linux

Install the `.deb` (Debian/Ubuntu) or run the portable `.AppImage`:

```bash
sudo apt install ./valkeon-workbench-<version>.deb   # adds a `valkeon-workbench` command
# or:
chmod +x valkeon-workbench-<version>.AppImage && ./valkeon-workbench-<version>.AppImage
```

### WSL Ubuntu (run inside WSL from Windows)

If your code, `git`, and the `claude` CLI live in WSL, run Valkeon **inside WSL** so its terminals are `bash`, git operates on the Linux checkout, and `claude` resolves there. On **Windows 11** (or a recent Windows 10 with WSLg) the window renders on your Windows desktop automatically — no X-server setup.

One-line install (downloads the latest `.deb`, installs it, and adds the `valkeon` CLI):

```bash
curl -fsSL https://raw.githubusercontent.com/deyvidholz/valkeon-workbench/main/scripts/install-wsl.sh | bash
```

Notes for WSL:
- The `valkeon` wrapper adds `--no-sandbox` automatically (the Chromium sandbox can't initialize under WSL).
- If nothing appears, update WSL (`wsl --update` in Windows PowerShell) so WSLg is present.

### The `valkeon` CLI

Once installed on Linux/WSL, launch the app and open projects straight from the shell — each call opens **its own window**, so you can work on several directories at once:

```bash
valkeon              # open the workbench (home screen)
valkeon .            # open the current directory as a project
valkeon ~/work/api   # open a specific project
```

---

## Development

### Prerequisites

- **Node.js 20+**
- The **Claude Code CLI** (`claude`) on your `PATH` to run Claude sessions
- A C/C++ toolchain (native modules `node-pty` and `better-sqlite3`-style deps are rebuilt for Electron)

### Install & run

```bash
npm install          # installs deps and rebuilds native modules for Electron
npm run dev          # launch in development (hot reload)
```

### Other scripts

```bash
npm run build        # production build (electron-vite)
npm run preview      # preview a production build
npm run typecheck    # typecheck node + web configs
npm test             # persistence tests
npm run rebuild      # rebuild node-pty for Electron (if native modules break)
```

---

## Persistence

- **Repo-local** — board content and other project artifacts live under `.valkeon/` in the workspace repo, so they travel with the project. `.valkeon/` (and `.git`, `node_modules`, build dirs) are hidden from the Explore view.
- **User-local** — session lists, resume ids, and app settings live under Electron `userData`.

---

## Releases & distribution

Installers are built with [electron-builder](https://www.electron.build/) and published to **GitHub Releases** by a CI pipeline (`.github/workflows/release.yml`). Each supported OS is built on its own native runner:

| OS | Installer(s) |
|---|---|
| Windows | `.exe` (NSIS installer) |
| macOS | `.dmg` + `.zip` |
| Linux | `.AppImage` + `.deb` |

### Cutting a release

1. Bump `version` in `package.json`.
2. Tag it and push — the tag must match the version:
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```
3. The `Release` workflow fans out across Windows, macOS, and Linux runners, builds each installer, and attaches them to a **draft GitHub Release** for the tag.
4. Open the draft in the repo's **Releases** tab, review it, and hit **Publish**.

### Building installers locally

```bash
npm run build:mac      # or build:win / build:linux — outputs to dist/
npm run build:unpack   # unpacked app dir only (no installer) — quick smoke test
```

> **Notes**
> - Builds are currently **unsigned**, so users see an "unidentified developer" (macOS) / SmartScreen (Windows) warning. Add an Apple Developer certificate and a Windows code-signing certificate later to remove it — no other changes required.
> - The app uses the **default Electron icon** until branded icons are added. Drop `icon.png` (≥512×512), `icon.icns` (macOS), and `icon.ico` (Windows) into a `build/` folder and electron-builder picks them up automatically.

---

## Design reference

The high-fidelity design is the source of truth for the UI. See:

- **[`design_reference/DESIGN_HANDOFF.md`](design_reference/DESIGN_HANDOFF.md)** — the full spec (concepts, layout, design tokens).
- **`design_reference/*.dc.html`** — interactive prototypes. Open in a browser to *see and click* the design. They are a **design reference, not production code** — recreate them, don't port the `.dc.html` / `support.js` runtime.

See also **[`CLAUDE.md`](CLAUDE.md)** for the condensed project guide used when working with Claude Code.

---

## License

MIT
