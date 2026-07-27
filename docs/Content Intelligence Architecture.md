# Content Intelligence — Future Architecture

This document describes the intended architecture for the Content
Intelligence module: turning stream VODs into a reviewable queue of clip
suggestions, with the user approving anything before it becomes public. It
describes the target shape only — no schema, adapters, or UI exist yet, and
none should be built from this document alone. Each piece below gets
implemented in its own future sprint, sliced the same incremental way as
every prior sprint, once [Sprint 6.5](Sprint%206.5.md)'s stabilization work
is done.

## Goals

- Analyze a stream VOD and surface candidate clips automatically, replacing
  manual scrubbing for highlight-finding.
- Let the user approve, reject, or edit each candidate before anything is
  scheduled — the app never posts on its own judgment.
- Let an approved clip be scheduled and posted automatically at a chosen
  time, without the user needing to be present when it fires.
- Do all of this as an extension of the existing local-first, modular
  architecture — not a rewrite. Reuse `StreamSession`, the activity log, the
  automation-runner/pure-workflow split, and the adapter and status-hook
  conventions already established by OBS and Twitch.
- Keep the AI and posting layers provider-neutral and off by default, the
  same posture already taken for Sprint 7's AI workspace.

## Data flow

```text
Stream Session (existing)
        │
        ▼
VOD located/ingested  ──────────────►  Vod record (pending)
        │
        ▼
AI analysis adapter (transcript + highlight detection)
        │
        ▼
Clip recommendation (pure scoring/ranking logic)
        │
        ▼
Clip review queue  ◄── user approves / edits / rejects ──┐
        │                                                 │
        ▼ (approved)                                      │
Scheduled post  ── user sets/confirms time ────────────────┘
        │
        ▼ (at scheduled time, app running)
Posting adapter (per platform) ──► platform API
        │
        ▼
Activity log entry + ScheduledPost status update
```

Every arrow that crosses into "this becomes visible outside the app" (the
posting adapter call) is the one place `ConfirmDialog`-gated approval and
audit logging are non-negotiable — everything upstream of it is local
analysis and review, no different in kind from the existing Content queue.

## Major components

**VOD source adapter.** Locates or receives the VOD for a completed
`StreamSession` — initially most likely a local recording path (OBS already
writes recordings; the app already knows session start/end times), with
platform-hosted VOD APIs as a possible later source. Follows the adapter
convention documented in [Architecture.md](Architecture.md#component-responsibilities)
(read-only here — this adapter never writes anything).

**AI analysis adapter.** Sends the VOD's audio/transcript to an analysis
backend to produce a transcript and candidate highlight segments (start/end
timestamps, a confidence or interest score, a draft title/caption). Decided
in [Sprint 1](Content%20Intelligence%20Sprint%201.md): this is a single
concrete Anthropic (Claude)-calling module for now, not a provider-neutral
interface reused from a separate AI workspace sprint — see
[Sprint 1 decisions](#sprint-1-decisions) below.

**Clip recommendation logic.** A pure, side-effect-free scoring/ranking
layer that turns raw analysis output into an ordered list of clip
candidates — the same "pure workflow, zero DB/IPC" discipline already used
for `automation/workflows/content-review-check.ts`. This is the natural
place for a `content-intelligence/` sibling directory (alongside `app/`,
`backend/`, `automation/`, `database/`), keeping the pure logic cheaply
testable and free of Electron/native dependencies, matching this project's
existing verification pattern for pure functions.

**Clip review UI.** A new screen or a new section of the existing Content
route, reusing the status-transition list pattern already proven there
(idea → captured → drafting → ready-for-review → approved → published) —
clip candidates get an equivalent status lifecycle (see entities below)
rather than a new UI paradigm.

**Scheduling engine.** Checks for approved clips whose scheduled time has
arrived and hands them to the appropriate posting adapter. Its execution
model (in-app timer vs. anything else, and behavior on a missed time) is a
prerequisite decision owned by Sprint 6.5 (task C2), not re-decided here.

**Posting adapter(s).** One per platform, write-capable, following the same
adapter convention as `ObsAdapter` and the Twitch OAuth/adapter pair —
`connect`/`getStatus`/`performAction`/`disconnect` shape, its own encrypted
token storage via `safeStorage` (same pattern as OBS and Twitch), and every
call gated by `ConfirmDialog` at the point of approval, with outcomes going
through the existing `logActivity` — never the token, only the action and
result. Built one platform at a time, the same way Twitch was chosen first
over TikTok in Sprint 6 based on which API is actually reachable without an
external approval process.

## Database entities we expect to need

These are anticipated shapes, not a schema to implement now — the real
migration gets written when Content Intelligence's first slice actually
needs it, the same way `status_changed_at` was added mid-Sprint-5 rather
than pre-built.

| Entity | Key fields | Notes |
| --- | --- | --- |
| `Vod` | id, sourceSessionId, location (path/URL), durationSeconds, status (pending/processing/analyzed/failed), capturedAt | Links back to the existing `StreamSession`. |
| `ClipCandidate` | id, vodId, startSeconds, endSeconds, draftTitle, draftCaption, score, status (recommended/approved/rejected/scheduled/posted/failed), reason? | Its own entity, not folded into `ContentItem` — it's tied to a time range inside a VOD and carries analysis metadata `ContentItem` has no reason to have. |
| `ScheduledPost` | id, clipCandidateId, platform, scheduledAt, status (pending/posted/failed/skipped), postedAt, resultDetail | One row per platform per clip, since the same clip could be scheduled to more than one platform independently. |

Existing entities reused as-is, no changes anticipated: `StreamSession`,
`ActivityLog`. `AutomationRun` may be reused for the analysis step if it's
modeled as a workflow run, or may not apply — a call to make when that slice
is actually scoped.

## How it integrates with the existing Electron architecture

No new process model, no new IPC pattern — this is additive within the
architecture Sprint 1-6 already established:

- New adapters live in `backend/` (e.g. `backend/vod/`, `backend/posting/`),
  imported by the main process exactly like `ObsAdapter` and the Twitch
  OAuth module are today, via the existing `@backend` path alias.
- New pure logic lives in a `content-intelligence/` sibling to `automation/`,
  or inside `automation/` itself if it ends up shaped like a workflow —
  decided when that slice starts, not here.
- New schema and repositories live in `database/`, following the existing
  migration-file + repository-per-entity pattern.
- New IPC channels get added to `shared/ipc-channels.ts`, with Zod schemas
  in `shared/schemas.ts` — the same single-source-of-truth-for-types pattern
  every existing handler in `main/ipc.ts` already follows. Every handler
  that accepts input keeps parsing it through its Zod schema before it
  touches the database or an adapter.
- New renderer screens follow the existing route + `lib/` hook +
  `components/` structure, and reuse `ConfirmDialog`/`Modal` directly for
  approval and posting confirmations — both are already generic enough,
  confirmed during the Sprint 6.5 audit.
- Live status for in-progress stages (VOD analyzing, post pending) follows
  the same hook shape as `useObsStatus`: main process holds state, pushes
  changes over IPC, a small per-domain hook subscribes in the renderer.
- Secrets (any new platform's OAuth tokens) go through `safeStorage`,
  exactly like OBS and Twitch — never into SQLite, never into the activity
  log, never logged.

## How VOD processing, AI analysis, clip approval, and scheduling connect

Each stage is a status on either `Vod` or `ClipCandidate`, and each
transition is owned by exactly one component:

1. A `StreamSession` ends → a `Vod` row is created (`pending`) once its
   recording is located.
2. The VOD source adapter and AI analysis adapter move it through
   `processing` → `analyzed` (or `failed`), writing `ClipCandidate` rows as
   analysis produces them, each starting at `recommended`.
3. The clip review UI is the only place a `ClipCandidate` moves to
   `approved` or `rejected` — always a direct user action, never automatic,
   mirroring the existing rule that public-facing actions require explicit
   approval.
4. Approving a clip is where the user sets (or confirms a suggested)
   `scheduledAt`, creating a `ScheduledPost` row (`pending`).
5. The scheduling engine (per Sprint 6.5's C2 decision) checks pending
   `ScheduledPost` rows and, when due, invokes the relevant posting adapter
   behind the same `ConfirmDialog`-at-the-moment-of-action pattern already
   used for OBS start/stop — except here "the moment of action" is the
   scheduled time firing, not a click, so the approval already happened at
   step 3-4 and this step is the execution of a decision already made, not a
   new confirmation prompt.
6. The posting adapter's outcome updates `ScheduledPost.status`
   (`posted`/`failed`) and writes one `logActivity` entry — action and
   outcome only, never any token or the platform response body if it could
   contain sensitive data.

## Explicitly deferred / open questions

- ~~Which AI provider(s) power analysis~~ — **decided in Sprint 1**: Claude,
  as a single concrete integration, not inherited from a separate AI
  workspace sprint. See [Sprint 1 decisions](#sprint-1-decisions).
- Which platform(s) get a posting adapter first, and in what order — decided
  the same evidence-first way Twitch was chosen over TikTok in Sprint 6 (API
  reachability without an external review process first).
- The exact scheduling execution mechanism — owned by Sprint 6.5 task C2,
  referenced here, not decided in this document.
- Whether `AutomationRun` is reused for the analysis step or whether it
  needs its own run-tracking shape — decided when that slice is scoped.
- Cost/budget visibility for AI analysis calls — inherits whatever Sprint 7
  builds for the AI workspace's budget/usage rules.

## Sprint 1 decisions

Decided during planning for [Content Intelligence Sprint 1](Content%20Intelligence%20Sprint%201.md). These resolve several of the open questions above and refine (without contradicting) the components and entities described earlier in this document.

**Local OBS recording files are the VOD source, not Twitch video.** Twitch's Helix API doesn't expose a documented, ToS-clean way to download full VOD video for a third-party app. It doesn't need to — OBS already writes a local recording of every stream, and `ObsAdapter`'s `RecordStateChanged` event already carries the exact output file path the moment recording stops (confirmed directly in `obs-websocket-js`'s shipped types). Sprint 1 uses manual local file selection specifically; wiring `RecordStateChanged.outputPath` into automatic ingestion is a deferred follow-up, not built in Sprint 1.

**No Twitch video downloading**, now or in any currently planned slice — superseded by the decision above.

**AI and transcription calls are stateless request/response functions, not persistent adapters.** The adapter convention in [Architecture.md](Architecture.md#adapter-convention) is built around a *persistent* connection (OBS's WebSocket) — connect, reconnect, cached status, gated actions. A cloud transcription call or a Claude API call has no connection to hold open and nothing to reconnect; forcing `ObsAdapter`'s full shape onto it would be exactly the kind of unnecessary structure the convention itself warns against. These calls apply the convention's *spirit* only — errors classified, not swallowed; settings in, result out — without the connect/disconnect machinery.

**New `content-intelligence/` sibling directory**, alongside `automation/`, holding pure logic only — building the Claude prompt from a transcript, parsing Claude's response into candidate rows. Zero DB/IPC/network, same discipline as `automation/workflows/content-review-check.ts`.

**Backend orchestration lives in a new `backend/content-intelligence/` subdirectory** — VOD file-picker ingestion, the transcription call, the Claude call, and the `ffmpeg-static` audio-extraction/clip-export calls all live here, not in a separate `backend/vod/`. Orchestration (persistence, logging) stays separate from the pure logic in `content-intelligence/`, mirroring the existing `automation/` (pure) / `backend/automation-runner.ts` (orchestration) split.

**New database entities for Sprint 1: `vods` and `clip_candidates` only.** `scheduled_posts` (in the entity table above) is **not** created yet — it isn't needed until posting/scheduling, which is out of scope for this slice. Transcript text is stored directly as a column on `vods` rather than a separate table; Sprint 1 has no need to query or version transcripts independently.

**IPC naming follows the existing `IPC.<domain><Action>: '<domain>:<action>'` convention** (confirmed against `app/src/shared/ipc-channels.ts`) — e.g. `vodSelectFile: 'vod:selectFile'`, `clipCandidateApprove: 'clipCandidate:approve'`.

**Status lifecycle for a `Vod`:** `pending → processing → analyzed → failed`. `pending` is set on ingestion, `processing` while audio extraction and analysis run, `analyzed` once `ClipCandidate` rows exist, `failed` on any unrecoverable error at either step — surfaced honestly rather than silently retried, consistent with how OBS and Twitch connection failures are already handled.

**Review and approval reuses `ConfirmDialog` as-is** for both candidate approval and clip export confirmation — already generic, already proven reusable (confirmed during the Sprint 6.5 audit), not rebuilt.

## Relationship to Sprint 6.5

This document assumes Sprint 6.5's critical tasks (C1: Electron hardening,
C2: scheduling execution model) and its documented conventions (R5: adapter
shape, R6: status-hook shape) are complete before any Content Intelligence
slice starts. No schema or code from this document should be implemented
until that stabilization work is done.
