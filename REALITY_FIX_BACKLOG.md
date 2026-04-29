# Reality Fix Backlog

Triaged from this stress lab + the prior persona / device / chaos plans. Items already shipped this round are tagged ✓; everything else is pending.

| Pri | Item | Affected users | Emotional / product risk | Exact fix | File(s) | Test to prove it | Score impact |
|-----|------|----------------|--------------------------|-----------|---------|------------------|:-----------:|
| **CRITICAL** | _none open_ | — | — | — | — | — | — |
| **HIGH** | Detect `localStorage` unavailability and surface a calm banner | Private-mode / strict-storage users | Silent data loss → broken trust | Wrap `loadState` save with try-catch; if write throws, set context flag `storageBlocked: true`; render banner "Your browser is private — progress won't save here. Use a regular window for work that should stick." | `src/utils/storage.ts`, `src/context/ProgressContext.tsx`, new `StorageBlockedBanner.tsx` | Manual + new validator that forbids silent swallow in `saveState` | +1 |
| **HIGH** | iPhone Safari + Android Chrome real-device run | Phone-only users | Visual / keyboard regressions | Run `DEPLOYMENT_TEST_CHECKLIST.md` §11 + new device matrix | — | `DEVICE_ISSUE_LOG.md` rows | +1.5 |
| **HIGH** | Persona scorecard run with 5 humans | All study personas | Real-world quitting | Run `REAL_USER_TEST_PLAN.md` T1–T8 | `USER_TEST_SCORECARD.md` | Median + per-persona thresholds | +2 |
| **MEDIUM** | Detect IndexedDB write failures and offer "metadata-only" PDF fallback | Private-mode users wanting PDFs | Confusion, retry without recovery | Try a small no-op write on `openDb`; if it fails, render a calm explainer | `src/utils/localPdfStore.ts`, `src/pages/PdfSetupPage.tsx` | Manual | +0.5 |
| **MEDIUM** | Lighthouse run on deployed Vercel | All users | Slow first-load | Run + iterate on top finding | external | Lighthouse JSON | +0.5 |
| **MEDIUM** | Live AI server health-check on a hosted backend | Users with `VITE_AI_API_BASE` set | False "Tutor ready" then timeout | Add CI step that pings `/api/ai/health` post-deploy | Vercel config | curl probe | +0.5 |
| ✓ **DONE** | New `ai_fallback_used` local signal | All AI users | Hard to spot when AI is degraded | `markUsage("ai_fallback_used")` in `pushAssistant` for non-live | `src/components/AITutorPanel.tsx`, `src/utils/localUsageSignals.ts` | Test of fallback path | shipped |
| ✓ **DONE** | New `quiz_retry` local signal | Wrong-answer users | Hard to spot motivation drop | `markUsage("quiz_retry")` on retry button | `src/pages/QuizPage.tsx` | Manual | shipped |
| ✓ **DONE** | New `unknown_route_hit` signal + Playwright test | Users with stale bookmarks | Hard to spot deep-link breakage after refactors | `markUsage` in `NotFoundPage` `useEffect` + Playwright check | `src/pages/NotFoundPage.tsx`, `tests/e2e/smoke.spec.ts` | E2E | shipped |
| ✓ **DONE** | Validator forbids `fetch`/`sendBeacon` in 6 local-only utils | Privacy-conscious users | Slip-in of network call | `validate:production` extended | `scripts/validate-production-readiness.ts` | Build-blocking | shipped |
| ✓ **DONE** | New Playwright test: AI panel never blanks under blocked `/api` | All AI users | Hard-to-prove blank states | `tests/e2e/smoke.spec.ts` "AI panel renders Built-in coach when the API base is unreachable" | — | E2E | shipped |
| **LOW** | Add reduced-motion alternative for `Thinking…` pulse | Users who set `prefers-reduced-motion` | Mild discomfort | Wrap `animate-pulse` in `motion-safe:` Tailwind variant | `src/components/AITutorPanel.tsx` | manual | +0.2 |
| **LOW** | Use CSS variables for inline `style={{ width }}` bars | Accessibility lint cleanliness | None functional | Replace `style={{ width }}` with `--w` CSS var | `LessonStepIndicator.tsx`, `Dashboard.tsx`, `ProgressPage.tsx`, `RetentionStreakCard.tsx` | n/a | +0.2 |
| **FUTURE** | Optional cloud sync backend (encrypted JSON, BYO storage) | Multi-device users | Not having sync caps trust | Implement per `CLOUD_SYNC_IMPLEMENTATION_PLAN.md` | new server route + UI | E2E with hosted backend | +2 |
| **FUTURE** | Background sync queue for AI requests when offline | Phone-only users with bad connectivity | Lost questions during commute | Save question text + replay when online | `src/components/AITutorPanel.tsx` + new util | E2E | +0.5 |
| **FUTURE** | PWA icon set (192/512 px) | Users installing as app | Less polished install banner | Generate from `favicon.svg`; reference in `manifest.webmanifest` | `public/` | Lighthouse PWA | +0.3 |

## Score impact summary

If we ship the **CRITICAL/HIGH** rows: ~ +4 points (toward 99).
If we ship **MEDIUM** rows: another ~ +1.5 points.
The **FUTURE** rows are blocked on infrastructure (backend, real users, real devices).

The **DONE** rows already moved the score this round (see `PERFECTION_LOOP_REPORT.md`).
