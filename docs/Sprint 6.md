# Sprint 6 — Live Platform Metrics (Twitch)

## Objective

Replace hand-typed follower counts with real numbers pulled from Twitch, via a real
OAuth connection the user grants themselves. This is the first sprint where the app
talks to a genuine external, internet-facing API — everything before this has been
local (SQLite, OBS on localhost). TikTok is explicitly deferred; see the scope decision
below.

Delivered in slices, same cadence as Sprints 3-5.

## Scope decision: Twitch first, TikTok deferred to its own slice later

Both platforms were researched before writing this doc, not assumed:

- **Twitch**: supports a "public" OAuth client type (no client secret required — a
  real requirement for a desktop app, which can't keep a secret hidden from its own
  user), a standard Authorization Code grant flow, and total follower count is
  readable with just a user access token, no special moderator scope needed. No
  approval/review process — works as soon as the user completes one login.
- **TikTok**: follower count requires the `user.info.stats` scope, which TikTok
  requires registering and **getting reviewed and approved** before it works at all.
  That review is entirely outside this project's control and timeline. Building the
  same adapter shape for TikTok later is straightforward; waiting on TikTok's approval
  process is not something to design around or fake in the meantime.

## Scope

- **Twitch OAuth connection.** Authorization Code grant, public client (no secret).
  The app runs a short-lived local HTTP server on a fixed port to receive the redirect
  (`http://localhost:<port>/callback`) — the standard native-app OAuth pattern (no
  browser embedded in the app; it opens the user's real default browser for the actual
  login/consent, then the local server just catches the redirect and closes). The user
  registers their own Twitch app at dev.twitch.tv (a few minutes, self-serve) and
  enters the resulting Client ID in Settings — never a password, ever.
- **Token storage.** Access + refresh tokens encrypted at rest via `safeStorage`, same
  pattern as the OBS WebSocket password since Sprint 2. Access tokens refresh silently
  using the refresh token when expired; if the refresh token itself is ever invalid
  (revoked, TikTok/Twitch account changes), the UI falls back to "reconnect" rather
  than failing silently.
- **Twitch adapter** (`backend/twitch/adapter.ts`): after connecting, resolves and
  stores the connected Twitch user's ID/login (via the token-validate endpoint) so
  Settings can show "Connected as `<login>`" — and exposes a `getFollowerCount()` call
  against the Helix API.
- **Automatic metric capture.** When a session starts and a Twitch connection exists,
  capture the current follower count as a `MetricSnapshot`. When the session ends,
  capture it again and compute the delta as "Followers gained" — automatically
  populating what Sprint 3's post-stream briefing previously required typing in by
  hand. Manual entry stays available (for TikTok today, and as a fallback if Twitch
  isn't connected).
- Settings gets a **Twitch connection** section, mirroring the existing OBS connection
  section's shape: status pill, connect/disconnect actions, no secrets ever displayed
  back once saved.

## Explicitly excluded

- TikTok — see the scope decision above; its own slice once this pattern is proven
  and whenever TikTok's app review completes.
- Any Twitch metric beyond total follower count (subscriber count, view count, chat,
  clips) — one real metric working end-to-end first, more later if useful.
- Any write/action-performing Twitch API call (no chat messages, no channel updates, no
  clip creation) — this sprint only ever reads the user's own follower count.
- Automatic goal progress updates from live metrics — goals stay manually managed
  (Sprint 2) for now; wiring a connected metric to auto-advance a goal is a real design
  decision (which goal, by how much, on what event) worth its own explicit slice, not a
  side effect of this one.

## Acceptance criteria

- The Twitch Client ID a user enters and the tokens the app receives are never logged,
  never written to the SQLite database, and never appear in the activity log — only
  connection status and outcome (matching the existing rule for the OBS password).
- If the local redirect server's fixed port is already in use, the connect flow fails
  with a clear, plain-language error — not a silent hang.
- An expired access token is refreshed automatically and transparently on the next API
  call; the user is never asked to re-login just because time passed.
- If the refresh token is invalid/revoked, the UI clearly asks the user to reconnect
  rather than repeating silent failures.
- With Twitch not connected, starting and ending a session behaves exactly as it does
  today (manual metric entry, no errors, no dead UI waiting on a connection that isn't
  there).
- `npm run typecheck` and `npm run build` stay clean.

## Delivery slices

1. **Twitch OAuth connect/disconnect flow** (this slice). Loopback server, token
   exchange, `safeStorage` persistence, Settings UI showing connection status.
2. Follower-count adapter + an on-demand "current follower count" surfaced somewhere
   real (e.g. Mission Control or Streaming), proving the read path end-to-end.
3. Automatic metric capture at session start/end, wired into the existing
   `MetricSnapshot`/post-stream-briefing flow from Sprint 3.

## Deliverables (OAuth connect slice)

- `backend/twitch/oauth.ts` — the loopback-server Authorization Code flow.
- `app/src/main/twitch-settings.ts` — encrypted token storage, mirroring
  `obs-settings.ts`'s shape.
- Settings UI: Twitch connection section (Client ID field, Connect/Disconnect,
  status pill, "Connected as `<login>`" once authenticated).
- This document updated with any scope decisions made once later slices start.

## Definition of done (OAuth connect slice)

The product owner can register their own Twitch app, paste in the Client ID, click
Connect, complete Twitch's own login/consent screen in their browser, and see the
Settings screen confirm "Connected as `<their Twitch login>`" — with the ability to
disconnect and reconnect cleanly.
