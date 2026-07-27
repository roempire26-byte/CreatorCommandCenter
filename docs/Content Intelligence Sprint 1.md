# Content Intelligence — Sprint 1

## Objective

Prove the full Content Intelligence pipeline end-to-end on one real local
recording: a user picks a video file, the app extracts its audio, gets a
transcript, sends that transcript to Claude for candidate clip detection,
the user reviews and approves or rejects each candidate in a real UI, and an
approved clip gets cut into its own local video file. Nothing gets posted
anywhere, and nothing runs unattended.

This is the smallest useful vertical slice, not the full creator automation
system described in [Content Intelligence Architecture.md](Content%20Intelligence%20Architecture.md).

## Scope

- Manual local VOD selection via a native file picker (`dialog.showOpenDialog`).
- Local audio extraction from the selected file via `ffmpeg-static`.
- One transcription API call producing a timestamped transcript, stored on
  the `Vod` row.
- One Claude API call (user-supplied API key, entered in Settings, encrypted
  via `safeStorage`) that takes the transcript and returns candidate clips:
  start/end seconds, a draft title, a short reason.
- A review screen listing candidates per VOD, each approvable or rejectable,
  reusing the `Content.tsx` status-list pattern.
- On approval: cut that segment into its own local `.mp4` via
  `ffmpeg-static`, behind `ConfirmDialog`, logged via `logActivity`.
- Live `Vod` processing status (`pending → processing → analyzed → failed`)
  using the `useObsStatus`-style push pattern.
- A minimal Settings section for the Claude API key, mirroring the Twitch
  section's shape (status pill, save, never displayed back once saved) —
  not a full AI workspace.

## Non-goals (deferred)

- **Twitch VOD downloading.** Twitch's Helix API doesn't expose a
  documented, ToS-clean way to download full VOD video, and doesn't need
  to — OBS already writes a local recording of every stream. Not built, not
  needed for this or any planned future slice.
- **Automatic OBS recording ingestion.** `ObsAdapter`'s `RecordStateChanged`
  event already carries the exact output file path the moment recording
  stops (confirmed directly in `obs-websocket-js`'s shipped types) — a
  well-scoped, low-risk follow-up slice, deliberately not built now so this
  sprint's harder, newer work (the AI pipeline) isn't coupled to "did a real
  recording just happen." `ObsAdapter` is untouched in this sprint.
- **Scheduled posting.** No `ScheduledPost` entity, no posting adapters, no
  use of the Sprint 6.5 `setInterval` scheduling mechanism. This sprint
  stops at a local exported file.
- **Platform publishing of any kind.** No Twitch/YouTube/TikTok write calls.
- **A multi-provider AI abstraction.** One concrete Anthropic-calling
  module, not an interface over multiple providers — per
  [Architecture.md](Architecture.md#adapter-convention)'s own guidance to
  formalize a shared interface only once three or four real implementations
  exist, which isn't true yet.
- **A full "AI workspace."** No general drafting UI, no budget/usage
  dashboard, no multi-purpose assistant — just enough Claude connectivity to
  prove clip analysis works.

## Task breakdown

| # | Task | Complexity | Notes |
| --- | --- | --- | --- |
| 1 | Migration + repositories (`vods`, `clip_candidates`) | Small | Schema only, no behavior yet. |
| 2 | VOD ingestion slice (file picker IPC handler → `Vod` row → list UI) | Small–Medium | Proves the DB/IPC/UI loop before any external API is involved. |
| 3 | Local audio extraction (`ffmpeg-static`), `Vod` status `pending → processing` | Medium | Fully offline, no API cost. |
| 4 | Transcription API integration | Medium | First real external call, first real cost. |
| 5 | Claude analysis integration (`content-intelligence/` pure prompt-builder/parser + `backend/` orchestration) | Medium–Large | Pure logic testable without any network call. |
| 6 | Clip review UI (approve/reject) | Medium | Reuses `Content.tsx`'s status-list pattern. |
| 7 | Local clip export (`ffmpeg-static` cut) behind `ConfirmDialog` | Small–Medium | On approval only. |
| 8 | AI Settings section (Claude API key entry, `safeStorage`) | Small | No hard ordering dependency — should land before step 5 is tested live. |

## Dependencies

- Task 2 depends on Task 1 (`vods` table must exist).
- Task 3 depends on Task 2 (needs a real `Vod` row to attach status to).
- Task 4 depends on Task 3 (needs extracted audio).
- Task 5 depends on Task 4 (needs a transcript) and on Task 8 to be
  exercised end-to-end (needs a real API key) — the code itself can be
  written before Task 8 lands, just not tested live.
- Task 6 depends on Task 5 (needs real `ClipCandidate` rows to review).
- Task 7 depends on Task 6 (needs an approved candidate).
- Task 8 has no dependency and can happen at any point, but should land
  before Task 5 needs live testing.

## Implementation order

1. Migration + repositories (Task 1).
2. VOD ingestion slice (Task 2) — validate the foundation before any cost
   is involved.
3. Local audio extraction (Task 3) — still fully offline.
4. AI Settings section (Task 8) — unblocks live testing of the next two
   steps.
5. Transcription API integration (Task 4).
6. Claude analysis integration (Task 5).
7. Clip review UI (Task 6).
8. Local clip export (Task 7).

Steps 1-3 have zero external cost and can be fully built and verified before
any API key is needed — a deliberate checkpoint to confirm the foundation is
right before spending money.

## Risks

- **Transcription provider is an open choice**, not yet decided. A hosted
  speech-to-text API (typically priced per minute, inexpensive for a single
  stream's audio, no local compute burden) is recommended for this sprint
  over a local WASM/CPU alternative — simpler to integrate, faster to prove
  the pipeline. Revisit locally-run transcription later only if API cost
  becomes a real concern.
- **Cost is now usage-based**, a first for this project — every prior
  sprint (OBS, SQLite, Twitch OAuth) has been free. Both new API calls
  (transcription, Claude) charge per use. Capping test-run VOD length and
  using a cheaper/faster Claude model tier for this classification-style
  task are both real levers worth using deliberately.
- **Transcript quality risk**: game audio, music, or a chaotic multi-person
  stream could produce a noisy transcript and weak clip candidates. This
  sprint's job is proving the pipeline moves data through correctly
  end-to-end, not tuning recommendation quality — a mediocre first-pass
  suggestion is not a pipeline failure.
- **`ffmpeg-static` adds real disk size** (tens of MB) to `node_modules` and
  the eventual packaged `.exe` — acceptable for a personal desktop app,
  worth knowing it's there.
- **No risk to existing functionality** — every change is additive (new
  tables, new files, new routes); `Streaming`, `Analytics`, `Automations`,
  and the existing OBS/Twitch adapters are untouched.

## Definition of done

- A user can pick a local video file and see it appear as a `Vod` with
  `pending` status.
- Audio extraction completes and status moves to `processing`.
- A transcript is produced and stored.
- Claude returns at least one clip candidate (title, timestamps, reason) for
  a real test recording.
- A user can approve or reject candidates in the review UI.
- Approving a candidate produces a real local `.mp4` file for that time
  range.
- `npm run typecheck` and `npm run build` stay clean.
- No posting, scheduling, or Twitch-video-download code exists anywhere in
  the diff.

## Checklist

- [ ] 1 — Migration + repositories (`vods`, `clip_candidates`)
- [ ] 2 — VOD ingestion slice (file picker → `Vod` row → list UI)
- [ ] 3 — Local audio extraction, `Vod` status `pending → processing`
- [ ] 8 — AI Settings section (Claude API key, `safeStorage`)
- [ ] 4 — Transcription API integration
- [ ] 5 — Claude analysis integration
- [ ] 6 — Clip review UI (approve/reject)
- [ ] 7 — Local clip export behind `ConfirmDialog`
