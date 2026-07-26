# Sprint 5 — Content Pipeline and Safe Automations

## Objective

Make Content a real working queue instead of a placeholder, and stand up the
automation runner infrastructure in dry-run mode only — no workflow in this sprint
performs a real external action. Everything here operates on data the app already owns
(`ContentItem`, `Goal`, `StreamSession`) or produces a logged, reviewable result; nothing
posts, deletes, or spends money.

Delivered in slices, same cadence as Sprints 3-4.

## Scope

- **Content queue.** `Content.tsx` replaces its `RoutePlaceholder` stub with a real,
  filterable list of every `ContentItem` (reusing the Sprint 2 repository), grouped or
  filterable by status (idea → captured → drafting → ready for review → approved →
  published).
- **Task creation on Content.** The existing "Add content item" form (Sprint 2, currently
  reachable only from Mission Control) becomes reachable from Content itself, so the
  screen is a complete loop, not just a read view fed from elsewhere.
- **Review flow.** A way to move a content item forward through its status states from
  the Content screen itself (e.g. drafting → ready for review → approved), each
  transition logged via `logActivity()`. No item reaches `published` through this
  sprint's UI — per the scope decision below, this app never posts anything publicly, so
  "published" can be set manually to reflect reality (the user posted it elsewhere) but
  the app itself has no publish action to gate.
- **Automation runner infrastructure.** Real persistence and a real Automations screen:
  `AutomationRun` rows (created but unused since Sprint 2) get written for every run,
  and the screen shows run history — workflow name, status, timestamps, and result —
  per `docs/PRD.md`'s functional requirement that runs "display status, inputs, outputs,
  timestamp, and failure details."
- **One example dry-run workflow**, to prove the runner mechanics end-to-end rather than
  ship infrastructure with nothing plugged into it: a "Content review check" that scans
  `ContentItem` rows for anything sitting in `ready-for-review` past a configurable
  threshold and logs what it *would* flag — no notification is sent, nothing changes,
  it only produces a reviewable `AutomationRun` result.

## Scope decision: no scheduling, no n8n integration, no real workflow triggers yet

`docs/Roadmap.md` lists "optional n8n-compatible workflow integration" for this sprint.
That requires deciding on and building an actual external-trigger/scheduling
mechanism — meaningfully bigger than a slice, and premature with exactly one example
workflow to prove out the runner shape. This sprint ships the runner and log
infrastructure plus one manually-triggered example; scheduling and any external
workflow engine integration stay a distinct, later, explicitly-scoped piece of work —
same pattern as excluding real platform API adapters from Sprint 4.

## Explicitly excluded

- Any real automation trigger that posts, deletes, messages, or spends money — the
  Project Charter's "automation with control" principle and Architecture.md's approval
  rule apply the moment a workflow does anything beyond compute-and-log.
- Scheduling/cron triggers and n8n (or any external workflow engine) integration — see
  the scope decision above.
- Real platform posting/publishing — still excluded per Sprint 4's scope decision;
  nothing in this project posts anywhere on the user's behalf yet.
- AI-assisted drafting — content drafts stay plain text the user writes themselves;
  AI Workspace is Sprint 6.

## Acceptance criteria

- Content shows the same honest empty state (established since Sprint 1) with zero
  content items, not placeholder content.
- Creating a content item from Content itself persists identically to creating one from
  Mission Control — same repository, same data.
- Moving an item between statuses persists across a restart and produces an activity
  log entry.
- Running the example automation with zero qualifying content items produces a run
  logged as "nothing to flag," not an error and not silence — a run always leaves a
  visible record even when it finds nothing.
- No automation in this sprint can be triggered in a way that touches OBS, a stream
  session's live state, or anything outside the local database.
- `npm run typecheck` and `npm run build` stay clean.

## Delivery slices

1. **Content queue** (this slice). Real, status-filterable list on `Content.tsx`.
2. Task creation + review flow (add-item form and status-transition actions on Content
   itself).
3. Automation runner infrastructure (`AutomationRun` repository, IPC, Automations screen
   showing run history).
4. The example "Content review check" dry-run workflow, wired into the runner from
   slice 3.

## Deliverables (content queue slice)

- `Content.tsx` rewritten to fetch and render real content items with status filtering,
  replacing the `RoutePlaceholder` stub.
- This document updated with any scope decisions made once later slices start.

## Definition of done (content queue slice)

The product owner can open Content and see every real content item they've created so
far — from Mission Control or anywhere else — filtered by status, with an honest empty
state when there's nothing yet.
