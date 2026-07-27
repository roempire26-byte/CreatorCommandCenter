# Architecture

## Architectural intent

Use a desktop-first, local-first architecture that keeps integrations modular. The UI must remain useful when a platform, AI provider, or automation connector is unavailable.

## Proposed stack

| Layer | Initial choice | Why |
| --- | --- | --- |
| Desktop shell | Electron + TypeScript | Mature desktop integrations and strong Windows support. |
| UI | React + TypeScript | Reusable components and fast iteration. |
| Local service | Node.js + TypeScript | Integration boundary for OBS, analytics, and AI providers. |
| Database | SQLite | Private, low-cost local persistence. |
| OBS integration | OBS WebSocket | Local control and status reporting. |
| Automation | Local workflow runner initially; n8n-compatible adapters later | Keeps the first release simple while preserving expansion options. |
| AI | Provider adapter interface | Allows OpenAI, Anthropic, Gemini, or local models without coupling UI to one vendor. |

## High-level layout

```text
Desktop UI (Electron + React)
        │
        ├── local IPC / authenticated local API
        ▼
Local orchestration service
  ├── OBS adapter
  ├── platform analytics adapters
  ├── automation runner
  ├── AI provider adapters
  └── audit logger
        │
        ▼
SQLite database + local encrypted credential store
```

## Component responsibilities

### App (`app/`)

Renders screens, manages user interaction, displays integration state, asks for approval, and never owns provider secrets.

### Backend (`backend/`)

Contains integration adapters, orchestration rules, input validation, action approval enforcement, and structured activity logging.

### Automation (`automation/`)

Holds workflow definitions, templates, and safe action contracts. Workflows should be idempotent where possible and support dry runs.

### Database (`database/`)

Owns schemas and migrations for sessions, metrics snapshots, goals, content items, automation runs, and activity logs.

## Initial data model

| Entity | Key fields |
| --- | --- |
| StreamSession | id, platform(s), startedAt, endedAt, duration, title, notes, status |
| MetricSnapshot | id, platform, capturedAt, metricName, value, sessionId? |
| Goal | id, metric, target, period, currentValue |
| ContentItem | id, sourceSessionId?, type, status, title, draft, dueAt |
| AutomationRun | id, workflow, status, initiatedBy, startedAt, completedAt, result |
| ActivityLog | id, timestamp, category, action, status, detail, correlationId |

## Security and privacy rules

- Store API keys and tokens in the operating system credential store or an encrypted local secret store.
- Do not commit `.env` files, credential exports, analytics exports, or recordings.
- Require explicit user approval before public posts, stream changes, deletions, purchases, or account-permission changes.
- Log the action type and outcome, never secret values.
- Default to least-privilege integration scopes.

## Integration approach

Every external connection implements an adapter contract: `connect`, `getStatus`, `fetchMetrics`, `performAction`, and `disconnect` as applicable. UI code speaks only to the internal service contract, not directly to Twitch, YouTube, TikTok, OBS, or an AI vendor.

## Scheduled execution model

Decided in [Sprint 6.5](Sprint%206.5.md), task C2, ahead of Content Intelligence needing it for scheduled clip posting. This is the first feature to require a time-based trigger rather than a synchronous, in-the-moment user action — every write action built so far (OBS start/stop) fires immediately when clicked, gated by a confirmation dialog at that instant. Scheduling breaks that pattern: the approval happens once, up front, and the action fires later, possibly with nobody watching.

**Scheduled actions only run while the app is open. There is no background service.**

- **How it's checked:** a `setInterval` in the Electron main process, on a coarse interval (e.g. every 60 seconds — exact value is an implementation detail, not an architectural one), scans for due scheduled items and hands each one to the relevant adapter. This is the same primitive already used for `ObsAdapter`'s reconnect loop (`backend/obs/adapter.ts`) — a new purpose, not a new mechanism.
- **If the app is closed at the scheduled time:** nothing happens. The timer lives inside the Electron process; when the app quits, it stops, exactly like the OBS reconnect loop already does on `before-quit`. No detection or action occurs at the moment itself — closed means closed.
- **Missed tasks:** handled on next launch, not silently. The same check runs once immediately at startup (not waiting for the first interval tick). Anything found past its scheduled time moves to a distinct `missed` state and is surfaced visibly in the UI, requiring the same explicit confirmation (`ConfirmDialog`) as an on-time post would — it does **not** fire automatically just because the app reopened.
- **Why skip-and-flag, not fire-on-launch:** the approval given when a post was scheduled was implicitly bound to "post around this time," not "post whenever the app next happens to open, regardless of how much later." Auto-firing on relaunch — possibly hours or days after intended, with no one aware it's about to happen — is a materially different action than what was approved, and would be the one place in this app that acts on the world without the user noticing. Every other integration here surfaces problems instead of hiding them (OBS's `auth-required`/`errored` states stay visible rather than retrying silently forever; an invalid Twitch refresh token surfaces a "reconnect" prompt rather than failing quietly) — a missed post silently going out unattended would break that pattern, and posting stale content automatically is a real reputational risk for a creator's channel that a brief "this was due 6 hours ago, review it" notice isn't.

**Why this fits a personal desktop application:** there is one user, and the app is expected to be open during normal usage (streaming, content review), not running unattended 24/7 the way a SaaS scheduler serving many users across time zones would need to. No server infrastructure exists or is planned anywhere in this project — introducing one now (a Windows service, a tray-resident always-on process, an external scheduler) would be a disproportionate amount of new infrastructure and a new failure domain, just to cover the edge case of "the app happened to be closed at the exact right second." A `setInterval` plus one additional status value is trivial by comparison, stays entirely inside the existing single-process Electron architecture, and keeps the same person who approves a post also being the one who reviews anything that slipped.

## Phased delivery

1. Local UI with mock data and navigation.
2. SQLite persistence and OBS status/control.
3. Session logging, goals, and manual analytics entry/import.
4. Automation log and safe workflow runner.
5. Platform adapters and optional AI providers.
