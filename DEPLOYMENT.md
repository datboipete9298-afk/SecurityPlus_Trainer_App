# Deployment (Vercel + optional AI tutor)

## Static SPA (frontend)

1. Point the Vercel project at this repo root; build command: `npm run build`, output dir: `dist/`.
2. `vercel.json` already rewrites unknown paths to `/index.html` for client-side routing (`NotFoundPage` handles bad URLs visibly instead of looping Home).

## Tutor API (optional but recommended for “Live” mode)

The React app speaks to an HTTP JSON API mounted at **`VITE_AI_API_BASE`**.

| Variable | Where | Purpose |
|----------|--------|---------|
| `VITE_AI_API_BASE` | **Frontend** build (Vercel env) | Public HTTPS origin of your API, **no trailing slash** (e.g. `https://api.example.com`). Empty = UI uses built-in / offline coaching — **not** a bug. |
| `OPENAI_API_KEY` | **Server only** (Node host, not Vite) | Enables live model calls; never expose to the browser bundle. |
| (optional) `PORT` / host env | Server | As used by `server/index.ts` for local or PaaS binding. |

### Local development

`vite.config.ts` proxies `/api/*` → `http://localhost:8787`.

Run **`npm run dev`** (Vite) **and** **`npm run dev:server`** together (or **`npm run dev:all`** if defined) so `POST /api/ai/tutor`, health checks, etc. resolve.

### Production

1. Deploy the Express server (`server/index.ts`) to any Node-capable host, **or** wire equivalent `/api` routes via Vercel serverless wrappers (keep the handler paths unchanged).
2. Set **`OPENAI_API_KEY`** on the **server only** — never commit it into the SPA bundle.
3. Set **`VITE_AI_API_BASE`** in the **frontend build** to the HTTPS origin serving your API **without trailing slash** (example: `https://api.example.com`).
4. If `VITE_AI_API_BASE` is **empty**, the UI automatically shows **offline / guided** coaching — that is intentional, not broken.

### Health endpoints

`/api/ai/health` must return `{ ok: boolean; hasKey: boolean }`. The SPA uses it—and a ~7.5s network timeout—for status badges (“Live” vs “Guided” vs “offline”).

## After deploy sanity checklist

### Three quick scenarios (smoke)

1. **Static-only (no API):** Deploy with empty `VITE_AI_API_BASE` → Home loads, tutor shows **offline / guided** within a few seconds, no infinite spinner.
2. **API connected:** Set `VITE_AI_API_BASE` to your deployed API → **Study tutor** health check shows **live** when key is valid; one short tutor message returns structured JSON fields (answer, key points, exam tip, next step).
3. **Routing:** Open a bad URL → **`NotFoundPage`** (trainer 404), not a blank screen.

### Routine checks

1. Open Home → **Continue** resolves.
2. Open **Study tutor** → badge becomes **offline** quickly if API missing (no spinner forever).
3. Hit `/this-page-does-not-exist` → human **404 trainer page**, not silent redirect.

### What to test after every deploy

- **Progress export** still downloads JSON (local-first trust story).
- **One lesson quiz** + **one weak-area link** round-trip if you changed routing or storage.
- **PDF guide** path: if you use BYO PDF, confirm file stays in browser storage and no server upload is required (unless you added one).
