# Sprint 3 — Stream Workflow

## Objective

Turn Streaming from a status readout into a structured routine: a pre-stream checklist,
real session start/end tracking, confirmed OBS control actions, and a post-stream
briefing. This is the sprint where the app starts doing something on the user's behalf,
so every public/irreversible action requires explicit confirmation and lands in the
activity log.

This sprint is being implemented in slices rather than all at once — see "Delivery
slices" below. Each slice should be usable and reviewable on its own before the next
starts.

## Scope

- **Pre-stream checklist.** A persisted, user-editable list of checklist items (label +
  order) shown on the Streaming screen. Checking/unchecking an item is local review
  state, not itself an audited action — the checklist doesn't gate or trigger anything
  yet in this slice; it's a reviewable routine, matching the PRD's "presents a
  pre-stream checklist" step ahead of the actual start-stream action.
- **Session start/end tracking.** "Start stream" captures session metadata (title,
  platform) and marks a session live; "End stream" closes it with duration and notes.
  Reuses the `StreamSession` table and repository from Sprint 2 instead of introducing a
  new entity.
- **OBS control actions.** The OBS adapter's `performAction` capability (unused since
  Sprint 2) starts and stops the actual OBS stream output, gated behind an explicit
  confirmation dialog per `docs/Architecture.md`'s "Require explicit user approval
  before... stream changes" rule. Every attempt and outcome is logged via the existing
  `logActivity()` entry point.
- **Post-stream briefing.** After ending a session, a summary view shows duration, goal
  progress delta, and any content items still pending review — reusing data already
  collected in Sprint 2, not a new data source.
- **Manual metrics entry.** A lightweight form to record follower/subscriber counts
  against a session (`MetricSnapshot`, created but unused since Sprint 2).

## Explicitly excluded

- Platform analytics adapters (Twitch/YouTube/TikTok APIs) — manual metrics entry only,
  real adapters are Sprint 4+.
- Automation runner, content drafting, and AI features — untouched.
- Any OBS action beyond start/stop stream output (no scene switching, no source
  toggling, no recording control) — those stay out of scope until a concrete need
  justifies expanding the control surface.
- Packaging/installer work.

## Delivery slices

1. **Pre-stream checklist** (this slice). New `checklist_items` table + repository +
   IPC + Streaming screen UI. No OBS control, no session tracking yet — purely a
   reviewable list the user can add to, check off, and remove.
2. Session start/end tracking on the Streaming screen (reuses Sprint 2's
   `StreamSession` repository — mostly UI + a "currently live session" concept).
3. OBS control actions (start/stop stream) with a confirmation dialog, wired to the
   session start/end flow above.
4. Post-stream briefing + manual metrics entry.

## Acceptance criteria (checklist slice)

- Checklist items persist across app restarts (same pattern as Sprint 2's goals/content
  items: SQLite via `sql.js`, IPC boundary, no direct renderer DB access).
- Adding, checking, unchecking, and removing a checklist item all work without a page
  reload.
- Checked state is local UI state, not written to the database — reopening the app
  shows all items unchecked again, since there's no session concept tied to the
  checklist yet in this slice.
- An empty checklist shows the same honest empty-state treatment established in
  Sprints 1-2, not placeholder content.
- `npm run typecheck` and `npm run build` stay clean.

## Deliverables (checklist slice)

- `database/migrations/0002_checklist_items.sql` + repository.
- IPC channels + Zod schemas for list/create/toggle/delete, following the exact shape
  established in `app/src/shared/ipc-channels.ts` / `schemas.ts` and `app/src/main/ipc.ts`.
- Streaming screen updated to show the real checklist instead of the static
  "what's coming" placeholder for this specific item.
- This document updated with any scope decisions made once later slices start.

## Definition of done (checklist slice)

The product owner can open Streaming, build a personal pre-stream checklist, check
items off during a real stream setup, and trust that the list itself survives a
restart even though the checked state intentionally doesn't yet.
