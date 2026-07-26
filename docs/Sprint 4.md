# Sprint 4 — Analytics Hub

## Objective

Turn Analytics from a placeholder into the one place to understand streaming effort and
growth: a real session timeline, platform summaries, goal progress, date filtering, and
honest trend callouts — all built on data Sprints 2-3 already collect (`StreamSession`,
`MetricSnapshot`, `Goal`). No new external integrations.

This sprint is being implemented in slices, same as Sprint 3 — each one usable and
reviewable before the next starts.

## Scope decision: "adapters" means manual import, not live platform APIs

`docs/Roadmap.md` lists "Import/adapters for available analytics sources" for this
sprint. Real Twitch/YouTube/TikTok API adapters require OAuth grants and stored
credentials — that's meaningfully bigger than a slice, crosses into
explicit-user-permission territory (granting account access), and can't be built or
tested without the user's real accounts. `docs/PRD.md`'s own risk mitigation for this is
"adapters, manual import, and only supported integrations" — manual import already
exists (the post-stream briefing's metrics form, Sprint 3). So Sprint 4 treats that
requirement as satisfied by what's already built and focuses entirely on
**reading and presenting** the data already being collected. Real platform adapters stay
a distinct, later, explicitly-scoped piece of work — not silently rolled into this
sprint.

## Scope

- **Session timeline.** The Analytics screen lists every `StreamSession`
  (reusing the existing repository), newest first: title, platform, status, duration,
  notes. Replaces the current `RoutePlaceholder` stub.
- **Platform summaries.** Per-platform rollups: total sessions, total hours, and sums of
  any `MetricSnapshot` values recorded for that platform (e.g. total followers gained
  across all Twitch sessions).
- **Goal progress.** Real goals shown with the same `Meter` component used on Mission
  Control and the post-stream briefing — one visual language for "progress toward a
  target" across the whole app.
- **Date range filter.** Filter the session timeline (and the summaries/trend callouts
  that depend on it) to a date range — at minimum presets for "last 7 days," "last 30
  days," and "all time."
- **Trend callouts.** Short, honest, computed-only statements comparing the filtered
  range to the equivalent prior range (e.g. "3 sessions this week vs. 2 last week") —
  never a vague qualitative claim ("great growth!") and never anything not directly
  derived from stored rows. If there isn't enough history for a comparison, say so
  instead of guessing.
- Clicking a session in the timeline links to that session's detail (reuses data already
  fetched — no new detail endpoint needed if the list view already carries what's shown).

## Explicitly excluded

- Any real platform API adapter (Twitch/YouTube/TikTok) — see the scope decision above.
- Editing or deleting sessions/goals/metrics from Analytics — this sprint is read +
  filter, not a management UI. Creation stays where it already lives (Mission Control,
  Streaming's post-stream briefing).
- Predictive analytics or forecasting — `docs/Project Charter.md` explicitly excludes
  "complex predictive analytics before reliable data collection exists," and four
  sprints of a single user's data isn't that yet.
- Automation, content pipeline, and AI features — untouched.

## Acceptance criteria

- With an empty database, Analytics shows the same honest empty-state treatment
  established since Sprint 1 — no placeholder numbers.
- The session timeline reflects real sessions created via Mission Control or Streaming,
  including ones with no `endedAt` yet (an in-progress live session).
- Platform summaries only aggregate real `MetricSnapshot`/`StreamSession` rows — no
  invented or estimated figures.
- The date filter actually narrows the timeline, summaries, and trend callouts
  together, not just the list.
- A trend callout never claims a comparison it can't support (e.g. no "vs. last week"
  language when there's no data from last week) — it degrades to a neutral statement
  instead.
- `npm run typecheck` and `npm run build` stay clean.

## Delivery slices

1. **Session timeline** (this slice). Real list of sessions with a date filter, replacing
   the `RoutePlaceholder` stub.
2. Platform summaries (aggregation over the filtered session/metric set).
3. Goal progress on Analytics (reusing `Meter`, filtered where the goal's period makes
   that meaningful).
4. Trend callouts comparing the filtered range to the prior equivalent range.

## Deliverables (session timeline slice)

- `Analytics.tsx` rewritten to fetch and render real sessions instead of using
  `RoutePlaceholder`.
- A date-range filter control, shared enough in shape that later slices (summaries,
  trends) can consume the same selected range without re-deriving it.
- This document updated with any scope decisions made once later slices start.

## Definition of done (session timeline slice)

The product owner can open Analytics, see every real session they've recorded so far in
one scrollable list, narrow it to a date range, and trust that an empty result honestly
means "no sessions in that range" rather than a broken screen.
