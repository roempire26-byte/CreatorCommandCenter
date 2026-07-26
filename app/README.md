# Creator Command Center — App (Sprint 5)

Desktop application with navigation, the Cyberpunk Executive design system, seven
routes, a Mission Control dashboard, a `Ctrl/Cmd + K` command palette (Sprint 1), local
SQLite persistence, a read-only OBS WebSocket status adapter (Sprint 2), a pre-stream
checklist, session start/end tracking, confirmed OBS start/stop stream actions, a
post-stream briefing with manual metrics entry (Sprint 3), a real Analytics screen —
session timeline, platform summaries, goal progress, a date-range filter, and honest
trend callouts (Sprint 4) — and a real Content queue plus a genuine (dry-run, read-only)
automation runner with one example workflow (Sprint 5). No platform accounts or AI calls
are wired up yet — see [`docs/Sprint 5.md`](../docs/Sprint%205.md) for scope.

## Tooling

- **Electron** — desktop shell, Windows-first.
- **electron-vite** — build tool that compiles the main, preload, and renderer
  processes with Vite; gives fast HMR in development.
- **React + TypeScript** — renderer UI.
- **react-router-dom** (`HashRouter`) — client-side routing that works from a
  packaged `file://` build, not just a dev server.
- **CSS Modules** — component-scoped styles built on top of design tokens defined
  as CSS custom properties in `src/renderer/src/styles/tokens.css`.
- **sql.js** — WASM SQLite, used instead of a native driver like `better-sqlite3`
  because this project has no C++ build toolchain configured and Electron's bundled
  Node (20.x) predates `node:sqlite`. Runs entirely in the main process; the renderer
  never touches it directly.
- **obs-websocket-js** — OBS WebSocket 5.x client, main-process only.
- **zod** — validates every IPC input at the `ipcMain.handle` boundary before it
  reaches the database.
- Electron's built-in **`safeStorage`** (not `keytar`, for the same native-module
  reason as sql.js) encrypts the OBS WebSocket password at rest.

## Requirements

- Node.js 18 or newer (developed and verified against Node 24).
- Windows 10/11 (primary target; the app also runs on macOS/Linux during development
  since it's plain Electron + Chromium).

## Scripts

Run these from inside `app/`:

| Command | What it does |
| --- | --- |
| `npm install` | Install dependencies. |
| `npm run dev` | Start the Vite dev server and launch the Electron app with hot reload. |
| `npm run build` | Type-check and build production bundles into `out/`. |
| `npm run preview` | Run the built app from `out/` without rebuilding. |
| `npm run typecheck` | Run TypeScript checks for both the renderer and the main/preload processes. |

## Project structure

```text
CreatorCommandCenter/
├── database/                  # Schema, migrations, sql.js helpers, per-entity repositories
├── backend/                   # Activity-log entry point, OBS adapter, automation runner — no `electron` imports
├── automation/                 # Pure workflow definitions (e.g. workflows/content-review-check.ts) — no DB, no IPC
└── app/
    ├── electron.vite.config.ts   # Build config; @shared/@database/@backend/@automation aliases
    ├── src/
    │   ├── main/                 # Electron main process: window, DB bootstrap, IPC handlers, OBS settings
    │   ├── preload/               # contextBridge API: window.commandCenter.db.* / obs.* / automation.*
    │   ├── shared/                 # IPC channel names + Zod schemas, used by main/preload/renderer
    │   └── renderer/
    │       ├── index.html
    │       └── src/
    │           ├── App.tsx        # HashRouter + route table
    │           ├── main.tsx       # React entry point
    │           ├── components/    # Shared UI, incl. forms/ (manual add-session/goal/content-item)
    │           ├── routes/        # One file per screen (Mission Control, Streaming, …)
    │           ├── lib/            # Route table, command palette actions, format/status helpers
    │           └── styles/         # Design tokens and global styles
```

`database/`, `backend/`, and `automation/` live outside `app/` per `docs/Architecture.md`'s
layout, but are plain TypeScript imported directly by `app/src/main` (no separate process
yet) — see `docs/Sprint 2.md` for why, and the constraint that keeps that option open
later (no `electron` imports inside those folders). `automation/` specifically holds only
pure workflow logic (inputs in, a result out, no side effects) — `backend/automation-runner.ts`
is the orchestration layer that actually persists runs and logs activity.

## Local data

- SQLite file: `%APPDATA%/creator-command-center/creator-command-center.sqlite3`
  (Windows). Delete it and relaunch to confirm a clean first-run migration.
- OBS settings (host/port + encrypted password): `%APPDATA%/creator-command-center/obs-settings.json`.
- Nothing here is committed to source control or synced anywhere.

## Testing the OBS connection locally

1. In OBS Studio: **Tools → WebSocket Server Settings**, enable the server.
2. If a password is set (OBS 28+ defaults to one), enter host/port/password in this
   app's Settings screen. The status pill should move from "OBS offline" through
   "OBS needs a password" (if you haven't entered it yet) to "OBS connected".
3. With OBS's server disabled or OBS closed entirely, the app should just read "OBS
   offline" — no crash, no error dialog, no console noise from repeated reconnect
   attempts.
4. With OBS connected, "Start stream" / "End stream" on the Streaming screen show a
   confirmation dialog before actually calling OBS's `StartStream`/`StopStream`. Without
   a connection, those buttons just track the session locally — no confirmation, since
   there's no external action to approve.

## What's real vs. mock in Sprint 5

- Stream sessions, goals, content items, checklist items, metric snapshots, automation
  runs, and the activity log are all real, persisted in SQLite. There is no seed data —
  an empty database is the honest starting state.
- OBS status, scene name, and streaming/recording flags are live when OBS's WebSocket
  server is reachable. Starting/ending a session on the Streaming screen calls OBS's real
  `StartStream`/`StopStream` requests when connected (behind a confirmation dialog); it
  never does anything beyond that (no scene switching, no source/recording control).
- Analytics is entirely real-data-driven — see the Sprint 4 notes below.
- Content is a complete loop: items created there or from Mission Control persist
  identically, and moving an item between statuses (including straight to "published",
  to reflect posting it elsewhere) is real and logged.
- The "Content review check" automation is real and genuinely runs — it reads
  `ContentItem` rows, flags anything sitting in `ready-for-review` for 3+ days, and logs
  a run every time, including an honest "nothing to flag" result. It never writes
  anything back to a content item, never touches OBS, and never posts, deletes, or
  spends money — there is no confirmation dialog for it because it does nothing that
  needs one.
- Command palette actions still just navigate; they don't trigger real automation.
- Real platform API adapters (Twitch/YouTube/TikTok), scheduling/n8n integration, and AI
  features remain untouched — see `docs/Roadmap.md`, `docs/Sprint 4.md`, and
  `docs/Sprint 5.md` for the specific scope decisions behind each exclusion.

### Sprint 4 notes (still accurate)

The session timeline, platform summaries, and trend callouts are all computed from
stored `StreamSession`/`MetricSnapshot` rows — nothing estimated or invented. Trend
callouts explicitly refuse to compare against a prior period the recorded history
doesn't actually cover, showing a plain "not enough history yet" message instead of a
misleading number. The post-stream briefing shown after ending a session reads real
goals and real content items — it does not compute a "change caused by this session,"
since nothing in the data model ties a goal's progress to a specific session yet.
