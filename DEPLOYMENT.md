# Deployment (Vercel + optional AI tutor)

## Static SPA (frontend)

1. Point the Vercel project at this repo root; build command: `npm run build`, output dir: `dist/`.
2. `vercel.json` already rewrites unknown paths to `/index.html` for client-side routing (`NotFoundPage` handles bad URLs visibly instead of looping Home).

## Tutor API (optional but recommended for “Live” mode)

The React app speaks to an HTTP JSON API mounted at **`VITE_AI_API_BASE`**.

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

1. Open Home → **Continue** resolves.
2. Open **Study tutor** → badge becomes **offline** quickly if API missing (no spinner forever).
3. Hit `/this-page-does-not-exist` → human **404 trainer page**, not silent redirect.
