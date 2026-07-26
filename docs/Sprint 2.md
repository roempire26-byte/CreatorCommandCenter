# Sprint 2 — Local Data and OBS Awareness

## Objective

Give the app a real local memory and a real (but read-only) view of OBS. Replace the
Sprint 1 mock data with SQLite-backed persistence for stream sessions, goals, content
items, and an activity log, and add a live OBS WebSocket connection that reports status
and basic scene/stream diagnostics without controlling anything.

## Scope

- SQLite database created and migrated automatically on first launch, stored in the
  app's user-data directory (never inside the repo).
- A local data-access layer in `backend/` that owns all database reads/writes; the
  renderer never talks to SQLite directly, only through a typed IPC contract exposed by
  the preload script (per `docs/Architecture.md`'s integration approach).
- Persistence for: `StreamSession`, `Goal`, `ContentItem`, `ActivityLog` (the
  `MetricSnapshot` and `AutomationRun` tables are created now, per the Architecture data
  model, but stay unused until Sprint 3/5 write to them).
- Mission Control, and any other Sprint 1 screen currently reading `lib/mockData.ts`,
  switches to reading real (initially empty) data from the database over IPC.
- A one-time seed path is explicitly out of scope — empty state is the real state until
  the user creates something.
- OBS adapter using OBS WebSocket 5.x (`obs-websocket-js`) that attempts a local
  connection (default `ws://127.0.0.1:4455`), reports `offline` / `connecting` /
  `connected` / `auth-required` / `errored`, and exposes read-only diagnostics when
  connected: current scene name, streaming/recording active flags, stream start time.
  `auth-required` is a distinct status from `errored` — OBS 28+ enables its WebSocket
  server with a password by default, and that rejection is a categorically different,
  common situation from OBS being unreachable, so it gets its own honest status rather
  than a generic error.
- OBS connection settings (host, port, optional password) live in Settings and are
  stored via the OS credential store or an encrypted local file — never in the SQLite
  database or in plain text next to the repo.
- Every genuine OBS state transition (offline → connecting → connected/auth-required,
  connected → offline, etc.) is written to the activity log via the same adapter
  contract described in `docs/Architecture.md`. Transient `connecting` hops and retries
  that settle back on the same status they started from are not individually logged —
  OBS staying closed for hours of reconnect attempts must not spam the log or force a
  full database rewrite on every retry.
- Manual "Add session" / "Add goal" / "Add content item" forms so the database has a
  way to receive real data even before Sprint 3 automates any of it.

## Explicitly excluded

- Any OBS control action (start/stop stream, scene switching, source toggling). This
  sprint reports what OBS is doing; it does not tell OBS to do anything. Control
  arrives in Sprint 3 with confirmation and audit logging.
- Platform analytics adapters (Twitch/YouTube/TikTok APIs) — still manual entry only,
  and manual entry UI for metrics is Sprint 3/4, not this sprint.
- Automation runner and AI provider adapters — untouched.
- Cloud sync, multi-device, or multi-user data — SQLite file is single-machine, single
  user, exactly as scoped in the Project Charter.
- Packaging/installer work — the app still runs via `npm run dev`.

## Acceptance criteria

- Deleting the app's SQLite file and relaunching produces a clean, empty-state app with
  no errors — first-run migration must be idempotent and automatic.
- Mission Control, with an empty database, shows the same honest empty states Sprint 1
  already established for Streaming/Analytics/etc., not placeholder mock numbers.
- Creating a session, goal, or content item through the new manual forms persists
  across an app restart.
- With OBS not running, the app shows "OBS offline" exactly as it did in Sprint 1 — no
  crash, no hang, no unhandled connection error surfaced to the user.
- With OBS running locally (WebSocket server enabled, no password), the status pill
  updates to "OBS connected" within a few seconds and shows the current scene name.
- With OBS running locally but its WebSocket server password not yet configured in
  Settings, the status pill reads a distinct "OBS needs a password" state — not a
  generic offline or error state.
- No credentials, tokens, or the OBS WebSocket password are ever written to the SQLite
  database, logged in the activity log, or committed to source control.
- `npm run typecheck` and `npm run build` stay clean.

## Recommended implementation sequence

1. Add the database layer: choose and wire up the SQLite driver, write the schema and
   an idempotent migration runner, add a thin repository module per entity.
2. Define the IPC contract (preload `contextBridge` API + main-process handlers) that
   the renderer will use for all reads/writes — no direct database access from
   `src/renderer`.
3. Swap Mission Control and the other Sprint 1 screens from `lib/mockData.ts` to the
   new IPC-backed data, keeping the exact same visual states (empty/warning/success/etc.)
   now driven by real (initially empty) data.
4. Build the manual "Add session / goal / content item" forms so there's a way to
   populate the database without automation.
5. Add the OBS WebSocket adapter in `backend/`, wire its status into the existing
   OBS status pill and the Streaming screen's integration-status card.
6. Add OBS connection settings to the Settings screen (host/port/password), backed by
   the OS credential store.
7. Wire every persistence write and every OBS state change into the `ActivityLog`
   table, and show real activity-log rows on Mission Control instead of mock ones.
8. Verify the acceptance criteria above, including the "OBS not running" and "delete
   the database file" paths specifically.

## Deliverables

- `database/` contains the schema definition and migration runner (or equivalent),
  matching the data model in `docs/Architecture.md`.
- `backend/` contains the data-access repositories and the OBS adapter, following the
  `connect` / `getStatus` / `fetchMetrics` / `performAction` / `disconnect` adapter
  contract (only `connect`, `getStatus`, `disconnect` are meaningfully used this
  sprint).
- Updated `app/` renderer code reading real data over IPC, plus the new manual-entry
  forms and OBS settings UI.
- Updated `app/README.md` explaining the new IPC contract, where the SQLite file lives,
  and how to install/run a local OBS WebSocket server for testing.
- This document updated with any scope decisions made during implementation, per the
  project's working agreement.

## Definition of done

The product owner can close and reopen the app without losing a session, goal, or
content item they created; can see at a glance whether OBS is actually reachable right
now; and can confirm no secrets or OBS credentials show up in the SQLite file, the
activity log, or a `git status` diff.

## Handoff prompt for an implementation assistant

> Read `README.md` and all files in `docs/`, especially `Architecture.md` and
> `Sprint 2.md`. Implement only Sprint 2: add local SQLite persistence for stream
> sessions, goals, content items, and the activity log behind a typed IPC boundary (no
> direct database access from the renderer), replace Sprint 1's mock data with it, and
> add a read-only OBS WebSocket status adapter with connection settings in Settings. Do
> not add OBS control actions, platform analytics adapters, automation execution, AI
> calls, or any cloud/multi-device sync. Keep credentials out of the database and out of
> source control. Update this document with any scope decisions made along the way.
