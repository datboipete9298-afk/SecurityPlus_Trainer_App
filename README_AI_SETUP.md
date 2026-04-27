# AI tutor setup (OpenAI + Security+ Trainer)

The app keeps **all OpenAI credentials on the server**. The React UI only calls `/api/ai/*` — never embed an API key in frontend code or in `VITE_*` env vars.

## 1. Create an OpenAI API key

1. Sign in at [https://platform.openai.com/](https://platform.openai.com/).
2. Open **API keys** and create a secret key.
3. Store it only in a backend env file (see below).

## 2. Local `.env` (Express server)

From the project root:

1. Copy `.env.example` to `.env`.
2. Set `OPENAI_API_KEY=sk-...` (your real key).
3. Optionally set `OPENAI_MODEL` (defaults to `gpt-4o-mini`).

Do **not** commit `.env`. The repo should only contain `.env.example` with placeholders.

## 3. Run the AI server (Express)

```bash
npm install
npm run dev:server
```

Default URL: `http://localhost:8787` (override with `AI_SERVER_PORT`).

Health check: `GET http://localhost:8787/api/ai/health`

## 4. Run frontend + AI together

Terminal 1: `npm run dev` (Vite, port 5173)  
Terminal 2: `npm run dev:server`

Or one command:

```bash
npm run dev:all
```

Vite proxies `/api` → `http://localhost:8787`, so the UI can call `/api/ai/tutor` with no CORS issues.

## 5. Production / deploy safely

**Option A — Split (simple to reason about)**  
- Static frontend: Vercel, Netlify, or any static host.  
- AI API: Render, Railway, Fly.io, or any Node host running `server/index.ts` (or a built bundle) with `OPENAI_API_KEY` set in the host’s secret env.

Set the browser origin to your API if not same-origin: define `VITE_AI_API_BASE=https://your-api.example.com` so requests go to the full API URL.

**Option B — Monorepo on Vercel**  
This repo includes **serverless** handlers under `api/ai/*.ts`. Deploy the whole project to Vercel, add `OPENAI_API_KEY` in the Vercel project **Environment Variables**, and the functions will serve `/api/ai/tutor`, etc., on the same domain as the static app.

Pick one pattern per deployment; do not expose the key in the client.

## 6. Why the key must not live in the frontend

Anyone can open DevTools, read bundled JS, or scrape env injected into the client. Putting `OPENAI_API_KEY` in React would let strangers spend your quota. The UI only sends **lesson/quiz/note/lab context** and **questions** to **your** backend, which adds the key and talks to OpenAI.

## Fallback

If the key is missing or the server is down, the **Smart Coach** (deterministic rules in-app) still runs, and the AI panel shows a friendly offline message with coach tips.
