# Test Coverage Map

**Method:** static + script-based validators today; no in-browser DOM tests, no E2E runner. This file is the honest matrix of what is automatically caught vs. manually checked vs. uncovered.

Legend: **A** = automated (build-blocking) · **M** = manual (smoke / persona) · **—** = no coverage

| Surface / system | Automated check | Manual check | Notes |
|------------------|----------------|--------------|-------|
| Lesson data integrity (66 lessons, 717 questions, 330 flashcards) | **A** `validate:data` | M | Fails build on shape regression. |
| Quiz feedback metadata | **A** `validate:feedback` | — | All 717 stems checked for required feedback fields. |
| Training system (≥2 labs, ≥2 sims, decision per lesson) | **A** `validate:training` | — | |
| Elite Lab Factory templates + scoring loaders | **A** `validate:elite-labs` | M (fail/pass loop) | Lab pass/fail UX is manual. |
| Video alignment (Professor Messer) | **A** `validate:videos` | M | Auto-checks 63/66 matched, 3 verification slots. |
| PDF guides registry | **A** `validate:pdf-guides` | M | Files presence is manual. |
| BYO PDF upload wiring | **A** `validate:pdf-upload` | M | Verifier + IndexedDB only confirmed by hand. |
| Video fusion mode (VideoStudyMode hooks, persistence, resume) | **A** `validate:video-notes` | M | |
| AI tutor static integration | **A** `validate:ai-integration` | M | Live API is manual. |
| AI coach + observer smoke | **A** `validate:ai` | — | |
| **PWA / offline shell** | **A** `validate:production` *(new)* | M | New validator added this round; manual offline reload still required. |
| **Service worker update flow** | **A** `validate:production` | M | Banner + reload flow needs Vercel deploy + bump test. |
| **Offline banner + Layout wiring** | **A** `validate:production` | M | |
| **Multi-tab presence + UI hint** | **A** `validate:production` | M | |
| **Local usage signals (privacy: no network sends)** | **A** `validate:production` | — | Asserts no `fetch`/`sendBeacon` in the util. |
| **Cloud sync stub (honest, disabled)** | **A** `validate:production` | — | Asserts `Not connected` + `disabled`. |
| **Deployment docs** | **A** `validate:production` | M | Asserts key sections + env vars present. |
| **Lesson quiz position (sessionStorage only)** | **A** `validate:production` | M | Validator forbids localStorage. |
| Dashboard ResumeWhereCard + Continue routing | — | M | `getNextStep` is pure but not test-harnessed. |
| Smart Coach `nextStepEngine` priorities | — | M | Pure function; safe candidate for unit tests. |
| `studyResume` sort + tier order | — | M | Pure; consider unit harness later. |
| `pdfFileVerifier` confidence buckets | — | M | Heuristic-heavy; manual upload covers it. |
| `localPdfStore` (IndexedDB roundtrip) | — | M | Browser API; needs E2E or jsdom + fake-indexeddb. |
| `microEncouragement` deterministic seed | — | M | Trivial; manual confirms stability. |
| AI fallback layers (rate_limited, timeout, weak) | — | M | `AITutorPanel` swaps on each path; covered by smoke test #2 in `DEPLOYMENT.md`. |
| Practice exam **draft resume** (Messer) | — | M | sessionStorage roundtrip; manual smoke. |
| Lesson study quiz **position resume** (per-tab) | **A** *(new)* | M | New validator asserts wiring; behavior is manual. |
| Multi-tab BroadcastChannel hint | **A** *(new)* | M | Validator confirms wiring; pairing requires two real tabs. |
| 404 / NotFoundPage trust copy | — | M | Trivial. |
| AppErrorBoundary fallback | — | M | Reproduce by throwing in dev. |
| Privacy: no API keys in `dist/` | — | M | Eyeball after `npm run build`. |
| Service worker never caches `/api/*` or PDFs | **A** *(new)* | M | Validator asserts code path; behavior is manual via DevTools. |
| Mobile responsive (320 / 375 / 414 / 768) | — | M | See `MOBILE_TEST_REPORT.md`. |
| Accessibility (WCAG 2.x AA-ish) | — | M | See `ACCESSIBILITY_TEST_REPORT.md`. |
| Performance (bundle sizes, lazy splitting) | — | M | See `PERFORMANCE_TEST_REPORT.md`. |
| Real-user simulation (5 personas) | — | M | See `REAL_USER_TEST_PLAN.md` + `USER_TEST_SCORECARD.md`. |

---

## What could still break silently (today)

1. **`getNextStep` regression** — no unit harness; an unintended priority reshuffle would only show up in manual flows.  
2. **IndexedDB quota / corruption** — manual recovery only; `localPdfStore` swallows non-quota errors.  
3. **AI server live behavior** — covered only by `AITutorPanel` runtime fallbacks; no hosted health-check probe in CI.  
4. **Live cloud sync** — *intentionally not wired*. The stub is verified honest by `validate:production`.

## Recommendations (out of scope this round)

- Add `vitest` + `fake-indexeddb` for `localPdfStore` and `studyResume` unit tests.
- Add a tiny Playwright project that loads `dist/` against a static server and runs the 6 smoke tests in `DEPLOYMENT.md` headlessly.
- Wire a CI step that fetches `/api/ai/health` against the deployed AI server in a hosted job.
