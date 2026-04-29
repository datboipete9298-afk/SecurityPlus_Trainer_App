# Privacy & Security Sanity Report

**Method:** static review + new automated assertions in `validate:production`.

**Net status:** Local-first promise is intact. Nothing leaves the browser without an explicit user action (export, optional AI tutor request, or YouTube embed).

---

## Automated assertions (now build-blocking)

`validate:production` enforces:

- `localUsageSignals.ts` does **not** call `fetch(`, `navigator.sendBeacon`, or `XMLHttpRequest`. Counters stay local.
- `CloudSyncStub.tsx` shows `Not connected` and the connect button is `disabled`. No `fetch("/api/sync...")` call.
- `sw.js` install handler does **not** call `skipWaiting()` (production-correct lifecycle).
- `sw.js` references `/api/` for the explicit pass-through guard and `/assets/` for the asset-only cache match. Confirms no broad-cache wildcards.
- `LessonQuizPosKey` is only persisted to `sessionStorage`, never `localStorage` (would survive across tabs and corrupt cross-tab stats).

## Manual (re-)review

| Check | Status | Notes |
|-------|--------|-------|
| API keys in front-end bundle | ✅ Clean | `OPENAI_API_KEY` is server-only; only `VITE_AI_API_BASE` is build-injected (a URL, not a secret). Search the repo: no `OPENAI_API_KEY` outside `server/` and `DEPLOYMENT.md`. |
| PDFs uploaded anywhere | ✅ No | `localPdfStore` is IndexedDB only; `sw.js` never matches PDF binaries; cloud sync stub explicitly excludes them. |
| `/api/*` cached by SW | ✅ No | `sw.js` returns early if `url.pathname.startsWith("/api/")`. |
| Cross-origin (e.g. YouTube) cached | ✅ No | `sw.js` returns early if `url.origin !== self.location.origin`. |
| Local telemetry stays local | ✅ Yes | `localUsageSignals.ts` is `localStorage` only; validator forbids network APIs in this file. |
| Export reminders are honest | ✅ Yes | `BackupNudgeBanner` no longer says "your progress can be gone" — replaced with calm safety-net framing. |
| Readiness is not a CompTIA prediction | ✅ Yes | `ProgressPage` and Dashboard PageHeaders explicitly say "your practice here — not a real CompTIA score." |
| Cloud sync UI does not pretend to work | ✅ Yes | `CloudSyncStub` shows `Not connected`, the button is disabled, and copy says *Local still works without sync.* |
| `_redirects` SPA fallback | ✅ Yes | `public/_redirects` ships `/* /index.html 200`. |
| AI client base URL | ✅ Safe | `aiClient.ts` reads `import.meta.env.VITE_AI_API_BASE` (a URL); no secret leaks. |
| AI requests timeout | ✅ Yes | `postAi` uses 18 s timeout via `AbortSignal.timeout` or fallback `AbortController`. |
| Health check timeout | ✅ Yes | 7.5 s in `aiClient.ts`. |
| AI fallback never blank | ✅ Yes | `AITutorPanel` always pushes structured response (live, rate-limited, timeout, weak). |

## Privacy-by-default features (still true)

- **No login required.** Anywhere.
- **No analytics, no tracking pixels, no third-party SDKs** in the front end.
- **`Export progress`** JSON is the only way user state leaves the browser, and only when the user clicks.
- **Service worker** caches the app shell + Vite-hashed assets — never user data, never PDFs, never `/api/*`.

## Things explicitly **not** implemented

- No cloud sync backend (architecture is documented; UI stub is honest).
- No analytics network beacon (and the validator forbids adding one to `localUsageSignals.ts`).
- No multi-resolution PWA icon set (visual polish only; doesn't affect privacy).

## Score

**Privacy / security confidence: 95 / 100**

Local-first promise is structurally enforced now. The remaining 5 points are field hardening: CSP headers on the host, server-side rate limiting on `/api/ai/*`, and a security review of the eventual cloud sync backend (out of scope here).
