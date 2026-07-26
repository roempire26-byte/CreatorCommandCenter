# Roadmap

This roadmap is intentionally outcome-based. Dates will be assigned only after Sprint 1 is tested.

## Foundation — complete

- Product charter, requirements, architecture, design system, and initial sprint scope.
- Repository layout and project-memory documents.

## Sprint 1 — Desktop foundation

**Outcome:** A usable local shell that establishes the daily workspace and visual language.

- Mission Control dashboard with mock data.
- Core navigation, command palette, state patterns, and route shells.

## Sprint 2 — Local data and OBS awareness

**Outcome:** The app starts becoming personally useful without relying on cloud services.

- SQLite schema and migrations.
- Stream sessions, goals, content items, and activity-log persistence.
- OBS WebSocket connection status and safe, read-only diagnostics first.

## Sprint 3 — Stream workflow

**Outcome:** A structured pre-stream and post-stream routine.

- Pre-stream checklist and session start/end tracking.
- OBS control actions with confirmation and audit logging.
- Post-stream briefing and manual metrics entry.

## Sprint 4 — Analytics hub

**Outcome:** One place to understand streaming effort and growth.

- Session timeline, platform summaries, goals, and date filters.
- Import/adapters for available analytics sources.
- Trend callouts based only on reliable collected data.

## Sprint 5 — Content pipeline and safe automations

**Outcome:** Post-stream content work is organized and reviewable.

- Content queue, draft states, task creation, and review flow.
- Dry-run automation runner and detailed execution log.
- Optional n8n-compatible workflow integration.

## Sprint 6 — Live platform metrics

**Outcome:** Follower counts and other basic metrics are pulled automatically from
platforms the user has connected, instead of typed in by hand every time.

- Real OAuth connection flow per platform (user logs in and grants access — the app
  never asks for or stores a password, only tokens the user's own login produces).
- Twitch first: follower count via the Helix API, auto-captured at session start/end
  to compute a real "followers gained" delta, feeding the existing `MetricSnapshot`
  flow from Sprint 3 instead of replacing it.
- TikTok deliberately deferred to its own follow-up slice — it requires TikTok's app
  review approval for the scope that exposes follower count, which is a real external
  wait outside this project's control, not a technical blocker to solve around.

## Sprint 7 — Optional AI workspace

**Outcome:** AI helps with drafting and synthesis while staying controllable and cost-aware.

- Provider-neutral AI adapter, starting with Anthropic (Claude).
- Draft ideas, titles, descriptions, and post-stream summaries.
- Budget/usage visibility and approval rules.

## Later opportunities

- Content calendar and scheduling integrations.
- Clips/recording ingestion and highlight suggestions.
- Revenue and sponsorship tracking.
- Advanced trend insights after sufficient historical data.
- Focus modes and multi-creator support.

## Release rule

No sprint begins until the previous one has been tested by the product owner and its documentation is updated with decisions or changes.
