# Edge Chaos Lab

**Goal:** confirm the app stays understandable, calm, and recoverable when the browser environment is broken or weird.

| # | Condition | What happens now | What user sees | Trust preserved? | Recovery exists? | Safe fix this round | Test coverage |
|---|-----------|------------------|----------------|:---------------:|:----------------:|---------------------|----------------|
| 1 | **Two tabs + slow network** | Both load same SPA; both register their own SW. `MultiTabHint` fires when peers detected. `ForeignWriteCue` fires when one writes the persisted state. | Both banners visible briefly. | ✓ | ✓ | — | Playwright `Multi-tab foreign write cue` test |
| 2 | **Tab B writes while A is editing a note** | Tab A's React state continues unaffected; on save it overwrites Tab B's last write (last-write-wins) | A doesn't see B's changes until reload | Partial | Reload via `ForeignWriteCue` advice | Already calm copy: "Refresh this tab to see the latest, or close the other tab to keep editing here" | Playwright multi-tab cue |
| 3 | **Corrupted IndexedDB** | `localPdfStore.openDb` rejects with error; PDF Setup shows "browser won't let the app save files" message | Clear amber notice with what to do | ✓ | ✓ | — | Manual; covered in `DEPLOYMENT_TEST_CHECKLIST.md` |
| 4 | **IndexedDB unavailable** (private mode some browsers) | `isIndexedDbAvailable()` returns false; PDF Setup shows red notice | Direct, blame-free copy | ✓ | ✓ | — | Validator confirms wiring |
| 5 | **localStorage unavailable** | `loadState` returns defaults; `saveState` is silently best-effort | App works in-memory only; resets on reload | Partial — user may not notice loss until reload | Limited (no surfaced banner today) | **Future: detect via try-catch on save and surface a calm "private mode — progress not saving here" banner.** Out of scope this round. | Manual |
| 6 | **sessionStorage cleared mid-quiz** | Lesson study quiz: position resets to Q1 next reload. Messer exam: draft lost. | Calm "If you refresh, this run picks up where you left off" copy on lesson study | ✓ | Partial for Messer | — | Code path covered |
| 7 | **Huge PDF** | `localPdfStore.savePdfFile` throws `pdf_too_large` if > 85 MB → user sees "this file is over X MB" error | Clear, calm, with fix | ✓ | ✓ | — | Code-path covered |
| 8 | **Wrong PDF** (low-confidence match) | `pdfFileVerifier` returns medium/low; setup screen prompts confirmation | "Save as matched PDF" or "Skip" choice | ✓ | ✓ | — | Code-path covered |
| 9 | **Renamed PDF** | Filename normalization + `/Title` metadata + first-4 KB content fingerprint score the file | Either matches or asks user to confirm | ✓ | ✓ | — | Code-path covered |
| 10 | **PDF object URL fails** | `getPdfObjectUrl` returns null when blob doesn't start with `%PDF-`; `LocalPdfOpenButton` falls back gracefully | Button still tappable; no crash | ✓ | ✓ | — | Code-path covered |
| 11 | **Stale SW cache after deploy** | New SW installs but waits; **`AppUpdateBanner`** appears with `Reload now` / `Later` | User chooses when to reload | ✓ | ✓ | — | Documented in DEPLOYMENT.md and the flow validator |
| 12 | **User clears site data mid-flow** | All localStorage / IndexedDB / SW caches gone | Next nav: `loadState` returns defaults, looks like fresh user | Partial — no warning before clear | None possible (the user did this) | Trust copy already explains "browser-only" | Manual |
| 13 | **Browser private mode** | IndexedDB and/or localStorage may be ephemeral or blocked | App still loads; PDF Setup shows the storage-blocked notice | ✓ | ✓ | — | Code-path covered |
| 14 | **Unknown route** (404) | `NotFoundPage` renders friendly card with Home / Search / Roadmap links; `unknown_route_hit` local signal fires | Clear, calm | ✓ | ✓ | — | Playwright `Unknown route` test (NEW this round) |
| 15 | **Refresh during lesson quiz** | sessionStorage restores the question index for the same `(lesson, wrongOnly, quickCap)` triple | Picks up where you left off; calm copy explains | ✓ | ✓ | — | Production validator forbids localStorage; sessionStorage path proven |
| 16 | **Refresh during practice exam** | `practiceExamDraft` restores answers + index | Existing draft-resume amber card on hub + auto-restore | ✓ | ✓ | — | Manual smoke test |
| 17 | **App update during active session** | Tab A keeps running old code; new SW waits; `AppUpdateBanner` shows when new SW is `installed` AND there's an active controller | User chooses when to reload | ✓ | ✓ | — | Documented in DEPLOYMENT.md |

---

## High-priority follow-ups (next round, not now)

1. **Detect localStorage unavailability** in `ProgressContext` and surface a one-time banner: *"Private mode — your progress isn't saving on this device. Use one regular tab for work that should stick."* Today the user discovers this only after a reload.
2. **Detect IndexedDB write failure mid-PDF-save** in private mode and offer to keep using metadata-only (PDF binary not stored, search still works against registry-known sections).

Both touch trust copy and a small new state field. Out of scope for this round (need to fit `STORAGE_AVAILABLE` flag into `ProgressContext` without breaking existing migrations).

---

## Verified guarantees this round

- **No silent overwrites:** every cross-tab race surfaces `ForeignWriteCue` within ~10 s.
- **No infinite reload loops:** SW `controllerchange` reload is gated by a `reloading` flag.
- **No spam-click chaos:** AI tutor + Send button + retry buttons are `disabled={loading}` while a request is in flight.
- **No cached `/api`:** `validate:production` asserts `sw.js` skips `/api/*` for cache.
- **No leaked PDFs:** `localPdfStore.ts` has zero `fetch`/`sendBeacon` (validator-enforced this round).
- **No silent leak from telemetry:** `localUsageSignals.ts` has zero network APIs (already enforced); same guard now extends to `crossTabWriteWatcher`, `multiTabPresence`, `localPdfStore`, `pdfStorageBroadcast`, `microEncouragement`, `coachingMicroCopy`.
