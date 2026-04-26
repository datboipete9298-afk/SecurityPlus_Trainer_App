# Deployment guide — Security+ Trainer (Vite + React)

**Canonical project path:** `C:\Users\Petey\Desktop\SecurityPlus_Trainer_App`  
See also `ACTIVE_PROJECT_PATH.md` and `FRIEND_ACCESS_GUIDE.md`.

---

## Prerequisites

- Node.js 18+ recommended  
- From the project folder, these must pass:

```powershell
cd C:\Users\Petey\Desktop\SecurityPlus_Trainer_App
npm install
npm run validate:data
npm run validate:videos
npm run build
```

Artifacts appear in **`dist/`**.

---

## Option A — Vercel (recommended for Vite SPA)

1. Push this repo to **GitHub** (no need to commit `node_modules`; use `.gitignore` as usual).
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. Framework preset: **Vite** (or Other).
4. **Build Command:** `npm run build`  
5. **Output Directory:** `dist`  
6. Root directory: repo root (where `package.json` lives).
7. Deploy.

**SPA routing:** `vercel.json` uses `routes`: serve real files first (`filesystem`), then fall back to `index.html` so `/roadmap`, `/quiz/messer-exam-a`, `/assets/*`, etc. work on refresh.

**Share:** Copy the production URL (e.g. `https://your-app.vercel.app`) and send it to your friend.

---

## Option B — Netlify

1. Push the repo to **GitHub**.
2. Go to [netlify.com](https://netlify.com) → **Add new site** → Import from Git.
3. **Build command:** `npm run build`  
4. **Publish directory:** `dist`
5. Deploy.

**SPA routing:** `public/_redirects` is copied into `dist` by Vite:

```text
/*    /index.html   200
```

**Share:** Use the Netlify URL (e.g. `https://your-site.netlify.app`).

---

## Option C — Local only (not for your friend)

```powershell
cd C:\Users\Petey\Desktop\SecurityPlus_Trainer_App
npm install
npm run dev
```

Opens **http://localhost:5173** on **your** PC only. Your friend cannot use this unless they install Node and clone the repo themselves — **not** the goal for “one link for everyone.”

**Production smoke test locally:**

```powershell
npm run build
npm run preview
```

Then open the URL Vite prints (usually `http://localhost:4173`).

---

## Embedded YouTube

Videos use normal YouTube **embed** URLs. They work on the public site as long as the user’s network does not block YouTube.

---

## Environment variables

None required for the current app (static hosting, client-only `localStorage`).

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Refresh on `/lesson/...` → 404 | Ensure Vercel `vercel.json` or Netlify `_redirects` is deployed with the site. |
| Blank page | Open devtools console; fix build errors; confirm `base` in `vite.config` is default `/`. |
| Old build | Trigger redeploy after `git push`. |
