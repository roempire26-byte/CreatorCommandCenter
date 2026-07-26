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

## Phased delivery

1. Local UI with mock data and navigation.
2. SQLite persistence and OBS status/control.
3. Session logging, goals, and manual analytics entry/import.
4. Automation log and safe workflow runner.
5. Platform adapters and optional AI providers.
