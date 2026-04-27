# AI tutor — production deployment checklist

**Project:** `C:\Users\Petey\Desktop\SecurityPlus_Trainer_App`  
The OpenAI **API key must never ship in the browser** or in Vite `import.meta.env` bundles that users download. Keys belong only on a server, serverless function, or CI secret.

---

## 1. Security rules

- [ ] **No `OPENAI_API_KEY` in frontend** — do not put it in `.env` files that Vite exposes as `VITE_*` or paste it into React code.
- [ ] **Repo scan** — confirm no `sk-` strings committed; use `.gitignore` for `.env`.
- [ ] **Rotate** the key if it was ever exposed in a client bundle or public repo.

---

## 2. Local development (full AI)

1. Copy `.env.example` → `.env` in the project root (server reads this).
2. Set `OPENAI_API_KEY=sk-...` in `.env` (never commit).
3. Run **`npm run dev:all`** — Vite proxies `/api/*` to the Express server (see `vite.config.ts` + `README_AI_SETUP.md`).
4. Confirm the AI panel returns real answers when the server is up.

---

## 3. Vercel (static SPA + optional API)

**Frontend only (no AI):**

- Build: `npm run build`, output `dist`.
- No `OPENAI_API_KEY` required — Smart Coach and static fallbacks work.

**With AI on Vercel:**

- [ ] Deploy an API route or serverless function that reads `process.env.OPENAI_API_KEY`.
- [ ] In Vercel project → **Settings → Environment Variables**, add:
  - **Name:** `OPENAI_API_KEY`
  - **Value:** your secret key
  - **Environment:** Production (and Preview if you test PRs)
- [ ] Point the frontend `postAi` / fetch base URL to that API (same origin or CORS-allowed).
- [ ] **Do not** add the key to “Environment Variables” prefixed with `VITE_` unless you accept exposing it (you should not).

---

## 4. Fallback when AI is unavailable

The app is designed to work **without** any API key:

- **Smart Coach** (`nextStepEngine`) is 100% local.
- **`AITutorPanel`** uses `aiTutorFallback.ts` when the API returns errors, “not configured,” or network failure.
- **Exam mode** sets `examAiLocked` — users see an exam-appropriate lock message instead of live AI.

Test before sharing:

- [ ] Load app with **no** server — navigation, quizzes, PBQs, flashcards still work.
- [ ] Open AI panel — expect short offline / configuration guidance, not a white screen.

---

## 5. Post-deploy smoke

- [ ] One lesson page → ask AI (if enabled) → one quiz → confirm exam mode still locks AI.
- [ ] Browser devtools → Network → confirm no request sends `Authorization: Bearer sk-...` from client-built JS (server may attach server-side only).

---

## References

- `README_AI_SETUP.md` — detailed local setup
- `scripts/validate-ai-system.mjs` / `validate-ai-integration.mjs` — structural checks
- `src/lib/aiClient.ts` — client → `/api` entry
- `server/` — Express reference implementation
