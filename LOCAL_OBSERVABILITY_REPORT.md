# Local Observability Report

**Goal:** give the user (and the developer reviewing builds) enough signal to spot real problems — **without** sending anything anywhere. The user is the audience for these counters, not us.

---

## What is tracked (locally)

| Signal name | When it fires | Where surfaced |
|-------------|---------------|----------------|
| `lesson_started` | Mounting `LessonPage` | Progress → Usage signals |
| `first_win` | First completion of any lesson (one-time) | Progress |
| `lesson_completed` | Each completion of a lesson | Progress |
| `video_note_saved` | Saving a Brain Book row from a lesson | Progress |
| `quiz_completed` | Hitting "Finish quiz" on a lesson study quiz | Progress |
| `pdf_added` | A PDF saves successfully via `PdfSetupPage` | Progress |
| `export_completed` | Tapping `Export progress` on Progress | Progress |
| `error_boundary_hit` | `AppErrorBoundary.componentDidCatch` runs | Progress |
| `offline_mode_used` | The browser fires `offline` while the app is open | Progress |
| `pwa_installed` | Service Worker registration resolves (one-time per session) | Progress |
| `ai_fallback_used` *(NEW)* | Tutor renders a non-`live` structured response (rate-limit / weak / timeout / no-API / 5xx) | Progress |
| `quiz_retry` *(NEW)* | User taps the "Retry this question" button after a wrong | Progress |
| `unknown_route_hit` *(NEW)* | A route hits `NotFoundPage` (deep-link / stale bookmark) | Progress |

## Why each signal exists

- The **funnel** ones (`lesson_started → lesson_completed`, `pdf_added`, `export_completed`) help the user **see their own momentum**. They're calmer than abstract XP.
- **`first_win`** is celebratory — combined with the existing `flashExtensionIdentityForDashboard` line, it tells a returning user "you started this."
- **`error_boundary_hit`** is honest — if the user sees this counter > 0 they know to expect rendering glitches and have permission to reload.
- **`offline_mode_used`** + **`pwa_installed`** prove the offline shell is actually doing its job.
- **`ai_fallback_used`** *(new)* lets a user spot when the live AI is degraded **without us sending anything anywhere**. If they see this rising above their lesson activity, they know the API is having a bad day.
- **`quiz_retry`** *(new)* is a self-care signal: a user can see they're working through wrongs, not just guessing past them.
- **`unknown_route_hit`** *(new)* helps spot stale bookmarks after a release.

## Where stored

- `localStorage` only.
- One key: `spt_usage_signals_v1`.
- Schema: `Record<UsageSignalName, { count: number, lastAt: number }>`.
- Storage cost: ~13 entries × ~40 bytes = **< 1 KB**. Bounded.

## How the user clears it

- **Progress → Usage signals** panel has a `Clear local counters` button.
- Confirmation dialog before reload.
- **Does not** affect notes, quiz history, streak, or any study state — only the counters.
- Also wiped by browser site-data clear (same as everything else local).

## What is **never** sent

- Anywhere. Off-device.
- The util `src/utils/localUsageSignals.ts` is forbidden by `validate:production` from importing or invoking `fetch`, `navigator.sendBeacon`, `XMLHttpRequest`, or `WebSocket`.
- This same forbid-list now extends to `crossTabWriteWatcher`, `multiTabPresence`, `localPdfStore`, `pdfStorageBroadcast`, `microEncouragement`, `coachingMicroCopy` (round-applied this lab pass).

## What is intentionally **not** tracked

These would be useful but require state-of-the-tab tracking that adds complexity and risks accidental leaks. Deferred:

- **Same-page hesitation** (≥ 30 s on a surface with no interaction) — would need a global activity timer.
- **Quiz abandoned mid-run** — distinct from `quiz_completed`; would need `beforeunload` handler.
- **PDF Setup visit without save** — would need session-scope correlation.
- **More disclosure opens** — would need to instrument every `<details>` summary click.

If a future pass wants these, gate them behind the same forbid-list and document each in this file.

## Privacy posture, plainly

- The user holds their own counters.
- The repo's validators **structurally prevent** a future contributor from sneaking a network call into any local-only utility.
- The Cloud sync stub is the only place a network sync is even mentioned, and it is explicitly disabled (`Not connected`).

If/when a real cloud sync backend lands per `CLOUD_SYNC_IMPLEMENTATION_PLAN.md`, this file will be updated to make clear what (encrypted, user-controlled) state the user **opts into** uploading. Until then: nothing leaves.
