# Deployment + friend access audit

## Static SPA hosting

- **`vercel.json`** — filesystem first, then `/(.*) → /index.html` — **correct** for client router.  
- **`public/_redirects`** — `/* /index.html 200` pattern for Netlify-style hosts — **present**.

## Build output

- `npm run build` → `dist/` — standard Vite static assets.

## Environment

- **`VITE_AI_API_BASE`** must point to deployment origin that serves `/api/ai/*` or proxy — document per host.  
- Serverless functions in `api/ai/` need OpenAI key in host env.

## GitHub readiness

- Not audited for `.gitignore` completeness here — **ensure `.env` never committed** (standard).

## Phone + PC access

- Same URL works; **touch targets** acceptable; **backup** reminder critical for phone-only users.

## Friend instructions (minimum viable)

1. Open link.  
2. **Export progress** from Progress after first session.  
3. Optional: set AI if host provides it.  
4. Use **Continue** / Smart Coach — don’t hunt routes.

## Gaps

- **No turnkey “Deploy to Vercel” button** in repo — OK if `DEPLOYMENT_GUIDE.md` exists (referenced in README).  
- **AI in prod** is second deploy step — easy to ship static app “without tutor.”

## Deployment readiness score

**83/100** — SPA routing solved; **AI path** is the main integration footgun for friends.
