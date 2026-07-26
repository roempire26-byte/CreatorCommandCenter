# Creator Command Center — App (Sprint 1)

Desktop application shell built for Sprint 1: navigation, the Cyberpunk Executive
design system, seven route shells, a Mission Control dashboard with mock data, and
a `Ctrl/Cmd + K` command palette. No external integrations, credentials, databases,
or AI calls are wired up yet — see [`docs/Sprint 1.md`](../docs/Sprint%201.md) for scope.

## Tooling

- **Electron** — desktop shell, Windows-first.
- **electron-vite** — build tool that compiles the main, preload, and renderer
  processes with Vite; gives fast HMR in development.
- **React + TypeScript** — renderer UI.
- **react-router-dom** (`HashRouter`) — client-side routing that works from a
  packaged `file://` build, not just a dev server.
- **CSS Modules** — component-scoped styles built on top of design tokens defined
  as CSS custom properties in `src/renderer/src/styles/tokens.css`.

No UI framework, state management library, or icon package was added beyond what's
listed above, to keep the Sprint 1 surface area small.

## Requirements

- Node.js 18 or newer (developed and verified against Node 24).
- Windows 10/11 (primary target for Sprint 1; the app also runs on macOS/Linux
  during development since it's plain Electron + Chromium).

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
app/
├── electron.vite.config.ts   # Build config for main/preload/renderer
├── src/
│   ├── main/                 # Electron main process (window creation only)
│   ├── preload/               # Preload script (no privileged APIs exposed yet)
│   └── renderer/
│       ├── index.html
│       └── src/
│           ├── App.tsx        # HashRouter + route table
│           ├── main.tsx       # React entry point
│           ├── components/    # Shared UI: NavRail, TopContextBar, CommandPalette,
│           │                  # Card, Button, StatusPill, Meter, EmptyState, etc.
│           ├── routes/        # One file per screen (Mission Control, Streaming, …)
│           ├── lib/            # Route table, command palette actions, mock data
│           └── styles/         # Design tokens and global styles
```

## What's real vs. mock in Sprint 1

- All dashboard numbers, session history, tasks, and activity-feed entries in
  `src/renderer/src/lib/mockData.ts` are static sample data, not live state.
- The OBS status pill always reads "offline" — there is no WebSocket connection.
- Command palette actions navigate to the relevant screen; they don't perform any
  real automation, publishing, or external call.
- Nothing is persisted between launches (no database yet — see Sprint 2).
