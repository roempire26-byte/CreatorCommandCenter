# Creator Command Center

Creator Command Center is a private, desktop-first workspace for running a streaming and social-content workflow from one place. It brings together stream controls, cross-platform analytics, creator tasks, automation, and AI-assisted planning—without trying to replace the platforms themselves.

## Project status

**Stage:** Sprint 6 in progress — the Twitch OAuth connect/disconnect flow is implemented (loopback authorization flow, encrypted token storage, Settings UI); the follower-count adapter and automatic metric capture (Sprint 6 slices 2–3) are not yet built. Sprint 6.5 (stabilization) is running alongside it — see [`docs/Sprint 6.5.md`](docs/Sprint%206.5.md)  
**Next milestone:** Finish Sprint 6 (Twitch follower count), then Sprint 7 — optional AI workspace  
**Primary user:** The project owner (with room to support other creators later)

## What version 1 will do

- Provide a focused Mission Control home screen.
- Show a single view of stream sessions, growth, goals, and creator tasks.
- Control and report OBS status through a local connection.
- Record stream sessions and consolidate platform analytics over time.
- Prepare content ideas, clips, titles, descriptions, and social drafts for review.
- Run safe, logged automations with explicit approval for public actions.

## What version 1 will not do

- Build or manage Roblox games.
- Replace a full video editor.
- Post publicly or spend money without approval.
- Depend on paid AI services for the core app to work.

## Repository map

```text
CreatorCommandCenter/
├── docs/                 # Product, design, architecture, and sprint documents
├── assets/               # Visual references and future brand assets
│   ├── mockups/
│   ├── logos/
│   ├── icons/
│   └── inspiration/
├── app/                  # Desktop application source (Sprint 1+)
├── backend/              # Activity log, OBS adapter, automation runner — imported by app/src/main (Sprint 2+)
├── automation/           # Pure workflow definitions, e.g. the content review check (Sprint 5+)
├── database/             # Schema, migrations, and repositories (Sprint 2+)
└── README.md
```

## Getting started

Read these files in order before implementing further work:

1. [Project Charter](docs/Project%20Charter.md)
2. [PRD](docs/PRD.md)
3. [Architecture](docs/Architecture.md)
4. [Design System](docs/Design%20System.md)
5. [Sprint 1](docs/Sprint%201.md)
6. [Sprint 2](docs/Sprint%202.md)
7. [Sprint 3](docs/Sprint%203.md)
8. [Sprint 4](docs/Sprint%204.md)
9. [Sprint 5](docs/Sprint%205.md)

### Run the app locally

Requires Node.js 18+ (verified on Node 24) and npm.

```bash
cd app
npm install
npm run dev
```

This starts the Vite dev server and launches the Electron window with hot reload.
`Ctrl/Cmd + K` opens the command palette from anywhere in the app. No accounts,
API keys, or external services are required — see [`app/README.md`](app/README.md)
for scripts, project structure, and what's mock vs. real in this sprint.

## Working agreement

Use the documentation as the project memory. Before changing scope, update the relevant document. Every feature should save time, improve a decision, or reduce context switching.

## License

Private project — all rights reserved unless the owner chooses otherwise.
