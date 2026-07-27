# Sprint 6.5 — Stabilization

## Objective

Strengthen and stabilize the existing application before starting the Content
Intelligence module (VOD analysis, clip recommendation, approval, and
scheduled posting). This sprint is not feature work — it exists because
Content Intelligence changes the app's risk profile (a second external
credential, write-capable posting calls, a multi-stage pipeline with state
that several screens need to reflect consistently) and because a few
architectural decisions are cheaper to make now, on paper, than to redo once
a real schema and adapters are built on top of the wrong assumption.

This sprint follows from a full technical audit of the codebase (all sprints
1-6 to date). Two findings from that audit changed what actually belongs
here: `ConfirmDialog` is already a fully generic, reusable confirmation
component (no OBS-specific logic), and `useObsStatus` already demonstrates
the "main process pushes, a small hook subscribes" pattern for live status.
Neither needs to be rebuilt or generalized into a framework — they need to be
named as the convention to reuse, which is documentation, not code.

## Scope decision: documentation and small hardening only, no speculative infrastructure

Almost everything in this sprint is either a config addition (`.gitignore`,
ESLint, CI), a documented decision (scheduling model, adapter convention,
status-hook convention), or one genuine security hardening change (CSP +
permission handler). Nothing here pre-builds Content Intelligence's schema,
adapters, or UI — that stays scoped to Content Intelligence's own first
slice, consistent with how this project has always added
infrastructure (see Sprint 5's `status_changed_at` column, added only when a
real slice needed it, not ahead of time).

## Task list, in priority order

| # | ID | Task | Category | Complexity | Depends on |
|---|---|---|---|---|---|
| 1 | R1 | Add root `.gitignore` | Recommended | Small | — |
| 2 | R2 | Fix stale `README.md` status section | Recommended | Small | — |
| 3 | R3 | Add CI (GitHub Actions: `typecheck` + `build` on push) | Recommended | Small | — |
| 4 | R4 | Add ESLint + Prettier | Recommended | Small–Medium | — |
| 5 | C1 | Electron hardening: CSP + `setPermissionRequestHandler` | Critical | Small–Medium | — |
| 6 | C2 | Decide & document the background/scheduled-execution model | Critical | Small (docs only) | — |
| 7 | R5 | Document the adapter convention (`ObsAdapter`'s shape) in Architecture.md | Recommended | Small (docs only) | — |
| 8 | R6 | Document the live-status hook pattern as the convention for future pipeline screens | Recommended | Small (docs only) | — |
| 9 | R7 | Unit tests for existing pure logic | Recommended | Medium | Benefits from R3 |
| 10 | N3 | Document dev-environment setup for a fresh clone | Nice to have | Small | — |
| 11 | N1 | Note a `sql.js` write-scaling threshold to watch for | Nice to have | Small | — |
| 12 | N2 | Twitch loopback port fallback / clearer guidance | Nice to have | Small | — |
| 13 | N4 | Confirm `ConfirmDialog`/`Modal` are the reused components for clip-approval UI (no new component) | Nice to have | Small (verification only) | — |

## Critical — must complete before Content Intelligence integration

**C1 — Electron hardening (CSP + permission handler).** *Small–Medium.*
The app is about to hold a second external credential (an AI provider key,
per Sprint 7) on top of the Twitch token it already holds, and Content
Intelligence's posting step adds outbound write calls to platform APIs. This
is the point where having no CSP and no permission request handler stops
being theoretical. Additive change — a meta tag and one handler — not a
rewrite of anything working.

**C2 — Decide the background/scheduled-execution model.** *Small, docs only.*
**Decided** — see [Architecture.md, "Scheduled execution model"](Architecture.md#scheduled-execution-model).
Summary: scheduled posting only runs while the app is open, via a
`setInterval` check in the main process (the same primitive `ObsAdapter`
already uses for its reconnect loop) — no background service. A missed
scheduled time (app was closed) is not fired automatically on relaunch; it's
surfaced as a distinct `missed` state requiring the same explicit
confirmation an on-time post would need, consistent with this project's
existing rule that problems get surfaced, not silently retried or silently
actioned.

## Recommended — real value, not launch-blocking

**R1 — Root `.gitignore`.** *Small.* Nothing bad is tracked yet, but there's
no backstop against `app/dist/` output or editor files being added by
accident as the codebase grows.

**R2 — Fix the stale README.** *Small.* It still claims "Sprint 5 complete,
next: AI workspace," but Sprint 6 (Twitch OAuth) is already underway.

**R3 — CI (typecheck + build on push).** *Small.* `gh` is already
authenticated on this machine, so this is close to zero-friction. Catches
regressions automatically instead of relying on manually running
`npm run typecheck` — more valuable once Content Intelligence starts landing
bigger diffs.

**R4 — ESLint + Prettier.** *Small–Medium.* Cheaper to introduce now, on a
small and already-consistent codebase, than after Content Intelligence
roughly doubles the file count.

**R5 — Document the adapter convention.** *Small, docs only.* `ObsAdapter`
already demonstrates a clean, reusable shape (settings getter, status
callback, transition logging, gated control methods). Content Intelligence
will need at least a VOD/analysis source adapter and a posting adapter per
platform. Writing this shape down in Architecture.md means those get built
consistently the first time, without inventing a formal `interface Adapter`
today that nothing implements yet.

**R6 — Document the live-status hook pattern.** *Small, docs only.* Same
reasoning as R5, applied to `useObsStatus`. When a pipeline-stage screen
(e.g. "VOD analysis in progress") needs the same kind of reactive status,
replicate this hook's shape directly — a few similar lines, not a shared
framework.

**R7 — Unit tests for existing pure logic.** *Medium.* `dateRange.ts`,
`trendCallout.ts`, `platformSummary.ts`, and the OAuth
`parseCallbackParams`/`buildAuthorizeUrl` functions are already pure and
side-effect-free — cheap to test, currently untested. Doing this before
Content Intelligence adds more pure logic (recommendation scoring,
scheduling time math) means the pattern and tooling already exist when that
code lands.

## Nice to have

**N1 — Note a `sql.js` scaling threshold.** *Small.* No migration needed —
there's no native build toolchain on this machine to move to
`better-sqlite3`/`node:sqlite` anyway, and current data volume doesn't
warrant it. Write down a rough row-count threshold (e.g. "~50k rows in one
table") as a trigger to revisit later, so it's a deliberate future decision.

**N2 — Twitch loopback port fallback.** *Small.* Currently a clear error if
port 17945 is taken, no retry-with-different-port. Low-priority polish.

**N3 — Dev-environment setup doc.** *Small.* No `.env` needed (all settings
are UI-entered by design), but a short note on what a fresh clone needs
beyond what's already in the README's "Getting started" section.

**N4 — Confirm reuse of `ConfirmDialog`/`Modal`.** *Small, verification
only.* Already generic and ready for clip-approval and scheduled-post
confirmations — a one-line note in Architecture.md or Content Intelligence's
own sprint doc saying "reuse `ConfirmDialog`, don't build a new one."

## Explicitly excluded

- Any Content Intelligence schema, adapters, or UI — that's feature work,
  scoped to Content Intelligence's own sprints, not stabilization.
- Migrating off `sql.js` — no build toolchain exists on this machine, and
  current data volume doesn't warrant the migration cost. N1 only asks for a
  documented threshold, not a migration.
- A general-purpose client-side state management library (Redux/MobX/etc.) —
  the app is a handful of screens; R6's documented hook-replication pattern
  is proportionate, a full store is not.
- Finishing Sprint 6 slices 2-3 (Twitch follower-count adapter, automatic
  metric capture) — that's in-flight feature work, tracked in
  [Sprint 6](Sprint%206.md), not part of this stabilization sprint.

## Dependencies

- R7 (tests) is easiest to keep running automatically if R3 (CI) exists
  first — soft dependency, not blocking.
- C2 (scheduling decision) has no dependency within this sprint, but is an
  upstream input to Content Intelligence's first schema migration — decide
  it before that migration is written.
- R5 and R6 should exist before the first Content Intelligence adapter or
  pipeline-status screen is built, so there's something to follow.
- Everything else (R1, R2, R3, R4, C1, N1-N4) is independent.

## Smallest, safest path

Nearly everything here is config or documentation, not new feature code.

1. **Phase 0 (~15 min):** R1, R2.
2. **Phase 1 (~1-2 hrs, guardrails first):** R3, R4.
3. **Phase 2 (~1-3 hrs, the one real security change):** C1.
4. **Phase 3 (~1-2 hrs, decisions on paper, no code):** C2, R5, R6, N3.
5. **Phase 4 (incremental, can run alongside Content Intelligence rather than gating it):** R7.
6. **Phase 5 (optional, anytime):** N1, N2, N4.

Total critical-path effort is roughly a day, not a full sprint in the
traditional sense. Nothing here modifies working code except C1, and that's
additive.

## Definition of done

- Every Critical task (C1, C2) is complete.
- `npm run typecheck` and `npm run build` stay clean throughout.
- The decisions recorded in C2, R5, and R6 are written into
  [Architecture.md](Architecture.md) (or this document, cross-referenced) so
  Content Intelligence's first sprint doc can point back to them instead of
  re-deriving them.

## Checklist

- [ ] R1 — Add root `.gitignore`
- [ ] R2 — Fix stale README status section
- [ ] R3 — Add CI (typecheck + build on push)
- [ ] R4 — Add ESLint + Prettier
- [ ] C1 — Electron hardening (CSP + permission handler)
- [x] C2 — Decide & document background/scheduled-execution model
- [ ] R5 — Document adapter convention in Architecture.md
- [ ] R6 — Document live-status hook convention
- [ ] R7 — Unit tests for existing pure logic
- [ ] N3 — Dev-environment setup doc
- [ ] N1 — Note `sql.js` scaling threshold
- [ ] N2 — Twitch loopback port fallback
- [ ] N4 — Confirm `ConfirmDialog`/`Modal` reuse note
