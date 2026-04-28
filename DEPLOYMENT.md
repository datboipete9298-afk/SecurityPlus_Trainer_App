# Deployment Guide

The app is a static Vite SPA with optional `/api/*` server for the AI tutor. It is **PWA-ready** out of the box (offline-capable after first visit). This file is the source of truth for shipping.

---

## TL;DR

```bash
# in the repo root
npm ci
npm run build       # runs all validators + tsc -b + vite build
# upload `dist/` to your static host
```

If you're proxying `/api` at the same origin, you don't need any client env vars. If your AI server lives on a different origin, set `VITE_AI_API_BASE` at build time.

---

## Recommended host: Vercel

1. **Import the repo** in Vercel.
2. **Framework preset:** *Other* (or *Vite*). Output directory: `dist`. Install command: `npm ci`. Build command: `npm run build`.
3. **Environment variables (Project → Settings → Environment Variables):**
   - `VITE_AI_API_BASE` *(optional)* — full origin of the AI server, e.g. `https://api.example.com`. Leave blank if `/api` is proxied at the same origin or you're shipping client-only with the Built-in coach.
   - `OPENAI_API_KEY` — only for the **Vercel Functions / Node server** project that hosts `/api/ai/*`. **Never** put this in `VITE_*` vars; it would leak into the bundle.
4. **SPA fallback** — already shipped via `public/_redirects` (`/* /index.html 200`). Vercel honors this. If you'd rather use `vercel.json`:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/" }]
   }
   ```
5. **Headers (optional but recommended):**
   ```json
   {
     "headers": [
       {
         "source": "/sw.js",
         "headers": [
           { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
         ]
       },
       {
         "source": "/manifest.webmanifest",
         "headers": [
           { "key": "Cache-Control", "value": "public, max-age=300, must-revalidate" }
         ]
       }
     ]
   }
   ```
   The SW must never be HTTP-cached itself, otherwise updates can lag for hours/days.

### Other static hosts

- **Netlify** — `_redirects` already covers it.
- **Cloudflare Pages** — root output `dist`. SPA fallback via the same `_redirects`.
- **GitHub Pages / S3 / Nginx** — point any 404 at `index.html`.

---

## Environment variables

| Var | Where | Purpose | Required? |
|-----|-------|---------|-----------|
| `VITE_AI_API_BASE` | client (build-time) | Origin of AI server. Empty = use Built-in coach. | No |
| `OPENAI_API_KEY` | server-only | Used by `server/` to call OpenAI. | Only if shipping the AI server |

Never expose `OPENAI_API_KEY` to the client. The app falls back gracefully when it's missing — users see the "Built-in coach" badge with the same answer · key points · next-step structure.

---

## Service worker (PWA)

Build emits `sw.js` from `public/sw.js`. It:

- **Network-first** for SPA navigations, with cached `/` as the offline fallback.
- **Cache-first + background revalidate** for Vite-hashed `/assets/*`, `/favicon.svg`, `/manifest.webmanifest`.
- **Pass-through (never cached)** for `/api/*` and **all** cross-origin requests (YouTube embeds, fonts, AI server when on a different origin).

### Lifecycle (production-correct)

- Install precaches the app shell. **Does not** call `skipWaiting()` — waiting until the user opts in via the in-app **"New version available — Reload now"** banner. This avoids the classic "new SW serves stale-loaded HTML" problem.
- Activate cleans up old caches by version prefix and calls `clients.claim()`.
- Cache version is the `CACHE_VERSION` constant in `public/sw.js` — bump on breaking shell changes (`spt-v1` → `spt-v2`, …).

### Releasing a new version

1. Make your changes; **bump `CACHE_VERSION` in `public/sw.js`** if assets / shell changed in a way users must see immediately.
2. Build + deploy.
3. The next page load downloads the new `sw.js`. The browser installs it in the background; the in-app banner fires when it's `installed` and an old controller is active. Users tap *Reload now*; the page sends `SKIP_WAITING`, the SW activates, `controllerchange` fires, and the page reloads exactly once.

If a user gets stuck, **hard reload** (Ctrl-Shift-R) is always a valid escape hatch — the app keeps working without the SW.

---

## What is **never** uploaded or cached on the network

- User-supplied **PDFs** (live in IndexedDB only).
- Notes, quiz history, streak, readiness, and any state in `localStorage` / IndexedDB.
- The `localUsageSignals` counters under `spt_usage_signals_v1`.
- Practice exam draft state (sessionStorage; per-tab only).
- Quiz position state (sessionStorage; per-tab only).

Cloud sync is **not implemented** in this build. See `CLOUD_SYNC_IMPLEMENTATION_PLAN.md` for the architecture and the on-page UI stub on Progress.

---

## Post-deploy smoke tests (5 minutes, manual)

Run these in a clean Incognito window pointed at the deployed URL.

### 1. First-load + first-win

- [ ] Home shows **First loop card** with `Start now →` (or Continue if you've used the app before in this profile).
- [ ] Tap **Start now**. A lesson loads with the **Do this now** strip, **You are here · Step 1 of 10**, and the embedded video.
- [ ] Save a fusion note → green proof banner appears → quick-check question appears.
- [ ] Total time from cold open to first quick-check: **≤ 60–90 s**.

### 2. AI tutor — predictable in every state

- [ ] On a lesson, open the tutor panel.
- [ ] Tap any shortcut. Answer arrives within ~2 s **or** the panel says *"Built-in coach"* and produces the same `answer · key points · next` shape — never empty.
- [ ] DevTools → Network → block all `*/api/ai/*`. Tap a shortcut again. Same shape, fallback path. No infinite "Thinking…".
- [ ] Badge stays consistent: **Tutor ready** when API is live, **Built-in coach** when not, **Paused** during a Messer practice exam.

### 3. Offline behavior — works on the second visit

- [ ] First visit while online completes (any page). Confirm Application → Service Workers → `sw.js` is **activated**.
- [ ] DevTools → Network → **Offline**. Reload the page.
- [ ] App shell loads from the cache; you can navigate between Home, Lesson, Quiz, Progress.
- [ ] Notes and quiz answers still save (writes go to localStorage / IndexedDB).
- [ ] Banner reads *"Offline — keep studying. Notes, quizzes, and PDFs work…"*.
- [ ] Re-enable network → green *"Back online"* banner flashes briefly. Tutor returns to **Tutor ready** if the API is reachable.

### 4. Service worker update flow

- [ ] Bump `CACHE_VERSION` in `public/sw.js` (e.g. `spt-v1` → `spt-v1-2`). Deploy.
- [ ] Reload the previously-loaded page. Within ~3 s the **"New version available — Reload now"** banner appears at the bottom-right.
- [ ] Tap **Reload now**. The page reloads exactly once and the new bundle is in effect.
- [ ] No console errors. No second reload loop.

### 5. PDFs (BYO files)

- [ ] Progress → *Add PDF files*. Drop or pick a Messer PDF.
- [ ] Setup screen reports a saved match.
- [ ] Open `/pdf-guides/messer-course-notes-v107/<lessonId>` — the matching section renders, search field works.
- [ ] Clear browser site data → PDFs are gone (expected, local-only). Notes + quiz history are also gone unless you exported.

### 6. Multi-tab safety

- [ ] Open two tabs of the deployed URL. Both load.
- [ ] On Progress and on any Lesson, the inline note *"Heads up: another tab of this app is open…"* appears within ~6 s.
- [ ] Close one tab. The note disappears within ~10 s on the remaining tab.

---

## Troubleshooting

### "AI says Built-in coach even though I set `VITE_AI_API_BASE`"

- Confirm the var was set **at build time** (Vite inlines it; rebuild after a Vercel env change).
- DevTools → Network → check that `/api/ai/health` returned `{ ok: true, hasKey: true }` from your AI server origin.
- Confirm CORS allows your front-end origin.

### "PDFs don't open"

- Confirm IndexedDB is allowed (private windows / strict storage settings can block it).
- The PDF Setup page surfaces an explicit message when IndexedDB is unavailable.
- Re-add the file. The verifier runs on filename + first bytes.

### "Offline didn't work on second visit"

- Confirm `sw.js` was registered (Application → Service Workers).
- Confirm `Cache-Control: no-cache` headers on `/sw.js` so updates aren't deferred for hours.
- Hard reload, then take it offline.

### "App got stuck with old code after a deploy"

- Open Application → Service Workers → click **Update**, then reload.
- Or, hard reload (Ctrl-Shift-R). Both are documented escape hatches.
- The `controllerchange` reload should happen automatically once the user taps **Reload now**.

---

## Local-first guarantees (still true on production)

- No required login.
- No analytics / no tracking pixels.
- No outbound requests except: optional AI tutor, YouTube embeds the user clicked, and same-origin static assets.
- `Export progress` JSON on the Progress page remains the **canonical** way to move user state between devices.

---

## Cloud sync (planned — not in this build)

See `CLOUD_SYNC_IMPLEMENTATION_PLAN.md`. The Progress page exposes a UI stub with a clearly disabled *"Connect cloud sync (planned)"* button. **No fake sync.**
