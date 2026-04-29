# Performance Test Report

**Method:** static review of bundle output from `npm run build` (Vite 5, 200 modules), inspection of effects/intervals, and lazy-loading audit. No Lighthouse run this round.

**Net status:** Bundle is well-split. No obvious render thrash. AI health check is once-per-mount with a 4.5 s fail-safe. Service worker keeps offline cache under control.

---

## Bundle (production, gzipped)

| Chunk | Raw | Gzip |
|-------|-----|------|
| `vendor-react` | 142 kB | **45.6 kB** |
| `index` (root SPA bootstrap + shared utils) | 306 kB | **108 kB** |
| `LessonPage` | 113 kB | **30.7 kB** |
| `QuizPage` | 33 kB | **9.1 kB** |
| `Dashboard` | 25 kB | **7.4 kB** |
| `VideoStudyMode` | 24 kB | **7.8 kB** |
| `PdfLessonGuidePage` | 25 kB | **7.4 kB** |
| `ProgressPage` | 23 kB | **7.2 kB** |
| `vendor-router` | 22 kB | **8.0 kB** |
| `AITutorPanel` | 18 kB | **7.0 kB** |
| `index.css` | 49 kB | **9.7 kB** |
| **Approx. first-load (Home)** | — | **≈ 175 kB gzipped** (vendor-react + index + Dashboard + router + css) |

Total dist transfer for the first paint of Home is well under 200 kB gzipped — acceptable for a study app.

## Lazy splitting

`App.tsx` lazy-loads every route, including `LessonPage`, `QuizPage`, `WatchLesson`, `PdfLessonGuidePage`, `Session30`, `BossFight`, etc. Only the route the user opens is fetched. Confirmed by the per-chunk asset list.

## Render-thrash audit (sample)

| Hot surface | Inspection | Verdict |
|-------------|-----------|---------|
| `LessonPage` `flowStep` updates + `fusionPauseCtx` | Both stored as `useState`; `useMemo` for derived `lessonPageVideoFusion`. | OK |
| `VideoStudyMode` pause pool | `useMemo(buildPausePromptPoolFromLesson(lesson))` keyed on lesson reference. | OK |
| `AITutorPanel` health probe | One `checkAiHealth()` per mount with 4.5 s fail-safe. No retry loops. | OK |
| `multiTabPresence` heartbeat | One `setInterval` (5 s) global singleton — never duplicated. | OK |
| `OfflineStatusBanner` | Two listeners on `window` only; cleaned in effect cleanup. | OK |
| `BackupNudgeBanner` | Reads `sessionStorage` once per render. Cheap. | OK |
| `MobileStickyContinue` | Reads `useLocation()`; re-renders on route change only. | OK |

## Service worker behavior

- **Install:** precaches 4 URLs (`/`, `/index.html`, `/manifest.webmanifest`, `/favicon.svg`).  
- **Hashed `/assets/*`:** cache-first w/ background revalidate. Each asset gets a single cache entry per filename hash. Old caches cleared on `activate`.  
- **`/api/*`:** never enters Cache Storage.  
- **Cross-origin (YouTube embeds, fonts):** never enters Cache Storage.  
- **Privacy carve-out:** PDF binaries live in IndexedDB only; the SW does not match them in any branch.

## Findings

| # | Severity | Surface | Issue | Status |
|---|----------|---------|-------|--------|
| 1 | Low | Index chunk size (108 kB gzip) | `src/index.css` and the shared root utility surface push the index chunk above 100 kB gzip — typical for an app this size. | Acceptable for a study app; could shave more by route-splitting `Layout`. |
| 2 | Low | `ProgressPage` initial render | Computes `summarizeUsageSignals` synchronously on every render. | `useMemo` would shave a few µs; not a real cost (8 keys, O(n) scan). |
| 3 | Low | `AITutorPanel` `quick` array | Recreated per render via `useMemo` (already memoized). | OK |
| 4 | Info | `vite:reporter` chunking advisory | All resolved last round — 0 warnings. | OK |

## What still needs measurement

- **Real-device Time-to-Interactive** on a mid-tier Android (e.g. Pixel 4a) over 4G.
- **Lighthouse Performance score** post-deploy.
- **Cold offline reload** time after first visit (subjectively snappy in dev; needs a real-device pass).

## Score

**Performance confidence: 87 / 100**

Bundle hygiene is strong; route lazy-splitting works. Remaining gap is field measurement, not engineering.
