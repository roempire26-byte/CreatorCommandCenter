# Content Intelligence — Sprint 2

## Objective

Turn the one-shot clip pipeline from Sprint 1 into a system that learns from the
creator's own approve/reject decisions: capture *why* a clip was approved or
rejected, score candidates on four concrete dimensions instead of a single
freeform reason, and feed the creator's accumulated decisions back into future
Claude analysis calls so recommendations improve over time. Everything stays
local-first SQLite, same as every table this project has ever added — no new
storage engine, no vector DB, no ML framework.

This sprint also starts by resolving a correctness gap found while auditing
Sprint 1: a real exported clip file was found on disk with no matching
`ClipCandidate`/`Vod` row in the database (the export and the database write
are not atomic, and something — an app crash or force-quit — interrupted the
process between them). Preference history is only trustworthy if decisions
reliably persist, so this gets root-caused and fixed first.

## Scope

- **Investigate and harden the export→database persistence gap** found during
  this sprint's planning audit (`exports/divine-discovery-hype-ea3c3e12.mp4`
  exists on disk; no corresponding DB row exists for it or its source VOD).
- **Migration 0006**: extend `clip_candidates` with four AI subscores
  (`hook_strength`, `emotional_intensity`, `context_completeness`,
  `replay_value`, each a `REAL` 0.0–1.0), a locally-computed `overall_score`,
  and a `feedback_note` column for the creator's own reasoning.
- **AI scoring**: Claude's structured output (already zod-validated via
  `content-intelligence/analysis/clipCandidateSchema.ts`) gains the four
  subscores per candidate. `overall_score` is computed locally by a new pure
  function, not trusted from the model's own arithmetic.
- **"Why this clip was selected"**: the existing `reason` field is kept as
  the explanation surface, with the prompt tightened to ground it in the four
  scoring dimensions — no new column.
- **Feedback capture**: `clip:updateStatus` gains an optional `note` — the
  creator's own reasoning for approving/rejecting, separate from Claude's
  `reason` for suggesting the clip in the first place. Optional, not
  required, matching every other one-click status transition in this app.
- **Creator preference history**: a query over past decided `clip_candidates`
  (all VODs, most recent first, capped) is summarized by a new pure function
  and spliced into the analysis prompt as extra context — only when history
  actually exists.

## Non-goals (deferred)

- **No new `clip_feedback` table.** One candidate has exactly one decision
  today (no re-review/undo workflow exists) — a 1:1 relationship belongs on
  `clip_candidates` directly, the same call already made for
  `export_path`/`export_filename`/`exported_at` in migration 0005. Revisit
  only if a re-review workflow becomes a real requirement.
- **No standing "creator profile" table.** Preference history is computed at
  analysis time from existing rows, not cached — a derived summary needs
  invalidation logic this sprint has no real use for, and the source query is
  cheap. Matches the Analytics sprint's rule against precomputing a number
  the underlying data doesn't cleanly support.
- **No reordering the review list by score.** Scores are shown as an
  annotation next to each candidate; the list stays sorted by
  `start_seconds` so it still reads as a timeline.
- **No configurable scoring weights UI.** `overall_score`'s weighting is a
  fixed formula in code for this sprint, not a settings screen.
- **No backfill of historical scores.** `clip_candidates` is currently empty
  in the real database (see the persistence-gap finding above), so there is
  nothing to backfill; the new columns are nullable like every prior
  `ALTER TABLE ADD COLUMN` in this project.
- **No multi-creator support.** This is a single-user desktop app; "creator
  preference history" means this one user's own past decisions.
- **No change to the Claude model tier.** Still `claude-haiku-4-5` — the
  added output fields are a marginal token-cost increase, not a reason to
  move to a heavier model.

## Task breakdown

| # | Task | Complexity | Notes |
| --- | --- | --- | --- |
| 1 | Investigate + fix the export→DB persistence gap | Small–Medium | Root-cause first; fix should be the smallest correct change, not a broader reliability rewrite. |
| 2 | Migration 0006 + repository/schema extension | Small | Score columns + `feedback_note`, nullable, no behavior change yet. |
| 3 | AI scoring (Claude subscores + local `overall_score`) | Medium | Extends `clipCandidateSchema.ts`, `buildPrompt.ts`, new pure `computeOverallScore`, wired into `runAnalysis`. |
| 4 | Feedback capture (optional note + score display) | Medium | `clip:updateStatus` IPC/schema/repo extended; `Clips.tsx` review UI shows scores + optional note input. |
| 5 | Creator preference history | Medium | New `listFeedbackHistory` query + pure `buildPreferenceDigest`, wired into the prompt before Task 3's Claude call. |

## Dependencies

- Task 1 has no dependency and is sequenced first per the product owner's
  explicit call — preference history (Task 5) is only meaningful if decisions
  reliably land in the database.
- Task 3 depends on Task 2 (score columns must exist before Claude's output
  can be persisted).
- Task 4 depends on Task 2 (`feedback_note` column) — otherwise independent
  of Task 3, but sequenced after it.
- Task 5 depends on Task 3 (needs real score values to summarize) and Task 4
  (needs real feedback notes/decisions to be a meaningful digest, not an
  empty one on the first few runs).

## Implementation order

1. Investigate + fix the export/DB persistence gap (Task 1) — a trust
   prerequisite for everything else in this sprint.
2. Migration 0006 + repository/schema extension (Task 2) — zero behavior
   change, verify clean before any Claude call changes shape.
3. AI scoring (Task 3) — extends the existing Claude call, no UI dependency.
4. Feedback capture (Task 4) — optional note end-to-end, score display in
   the review modal.
5. Creator preference history (Task 5) — the payoff slice, built once real
   scored, decided candidates exist to learn from.

## Risks

- **Claude's self-reported subscores are inherently noisy/subjective** —
  `overall_score`'s weighting stays local and adjustable in code without
  needing a new Claude call, so the composite number can be recalibrated
  without touching the model integration.
- **A small early sample could over-influence the preference digest** —
  mitigated by only including the digest when real history exists, and
  keeping it short (a nudge, not a dominant instruction) rather than an
  exhaustive dump of every past decision.
- **The persistence-gap investigation could reveal a deeper Electron
  lifecycle issue** (e.g. no handling for a quit during an in-flight async
  step) that's tempting to over-fix — timeboxed to root-causing plus the
  smallest correct fix, not a broader reliability pass.
- **No risk to existing functionality outside Content Intelligence** — every
  change is additive to `clip_candidates` and the existing analysis/export
  call sites; `Streaming`, `Analytics`, `Automations`, and the OBS/Twitch
  adapters are untouched.

## Definition of done

- The export/DB persistence gap is root-caused and either fixed or turned
  into an explicit, documented follow-up decision.
- `npm run typecheck` and `npm run build` stay clean after migration 0006.
- A real Claude analysis call returns four subscores per candidate; a local
  `overall_score` is computed and persisted alongside them.
- The review UI displays all four subscores, the overall score, and the
  existing AI `reason`.
- Approving or rejecting a candidate can optionally record a creator note,
  persisted in `feedback_note` and visible afterward.
- Running analysis again once prior decided candidates exist produces a
  prompt that includes a non-empty preference digest — verified by
  inspecting the actual prompt text sent, not assumed from code review alone.
- No new npm dependencies were added.

## Task 1 outcome (completed 2026-07-28)

Reproduced directly: two independent processes opening `openDatabase()` against
the same userData directory each hold their own in-memory `sql.js` snapshot;
`saveDatabase()` is a full-file, last-writer-wins overwrite with no locking or
merge. A minimal repro (instance A creates+approves a VOD/candidate, saving
progressively; instance B — unaware of any of it — makes one unrelated
`logActivity` write and saves) silently erased all of instance A's rows. This
matches the real symptom exactly: a real exported `.mp4` on disk with zero
trace of its `Vod`/`ClipCandidate` in the database, because the file write
(ffmpeg, outside SQLite) survived while every DB row from that session was
clobbered by a second, stale process.

Root cause: `app/src/main/index.ts` never called `app.requestSingleInstanceLock()`,
so nothing prevented a second app instance from running concurrently.

Fix shipped:
- `app/src/main/index.ts` now calls `requestSingleInstanceLock()` — a second
  launch attempt quits immediately instead of opening a second in-memory copy
  of the database; the first instance focuses its existing window instead.
  Verified directly by launching two real Electron processes against the same
  scratch userData dir.
- `backend/content-intelligence/export.ts` now logs an `export-started`
  activity-log entry (target file path included) immediately before the
  ffmpeg call, not just on success/failure after — so even a freak crash
  mid-export leaves a real audit trail instead of total silence. Verified by
  running a real export and confirming both `export-started` and `exported`
  entries land in `activity_log`.

No schema change, no new table, no pipeline/status redesign — scoring and
feedback capture (Tasks 2-5) are untouched.

## Checklist

- [x] 1 — Investigate + fix the export→DB persistence gap
- [ ] 2 — Migration 0006 + repository/schema extension
- [ ] 3 — AI scoring (Claude subscores + local `overall_score`)
- [ ] 4 — Feedback capture (optional note + score display)
- [ ] 5 — Creator preference history
