# Deploy now — one link for every device

**Project folder:** `C:\Users\Petey\Desktop\SecurityPlus_Trainer_App`

After you finish, your friend only needs: **open the Vercel URL — no install.**

---

## A. Verify build (already green if you just pulled)

```powershell
cd C:\Users\Petey\Desktop\SecurityPlus_Trainer_App
npm install
npm run validate:data
npm run validate:videos
npm run build
```

---

## B. GitHub — new repo `SecurityPlus_Trainer_App`

### If this folder is not a git repo yet

```powershell
cd C:\Users\Petey\Desktop\SecurityPlus_Trainer_App
git init
git branch -M main
git add -A
git commit -m "Security+ Trainer SY0-701 — production build ready"
```

### Create the empty repo on GitHub

1. Open https://github.com/new  
2. Repository name: **SecurityPlus_Trainer_App**  
3. **Private** or **Public** (your choice)  
4. **Do not** add README, .gitignore, or license (you already have files locally)  
5. Click **Create repository**

### Connect and push (replace `YOUR_GITHUB_USERNAME`)

```powershell
cd C:\Users\Petey\Desktop\SecurityPlus_Trainer_App
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/SecurityPlus_Trainer_App.git
git push -u origin main
```

If GitHub shows a different default branch name, follow its instructions.

---

## C. Vercel (primary)

1. Open https://vercel.com and sign in (GitHub login is easiest).  
2. **Add New… → Project**  
3. **Import** `YOUR_GITHUB_USERNAME/SecurityPlus_Trainer_App`  
4. Framework: **Vite** (or “Other” — both work).  
5. Settings:
   - **Build Command:** `npm run build`  
   - **Output Directory:** `dist`  
   - Install Command: default (`npm install`)  
6. **Deploy**

`vercel.json` is already in the repo: static files (`/assets/*`) are served first; everything else falls back to `index.html` for React Router.

---

## D. The link you send your friend

After deploy, Vercel shows:

**`https://security-plus-trainer-app.vercel.app`**  
(or similar — copy the **Production** domain from the Vercel project **Settings → Domains**.)

That HTTPS URL is the **only** link they need.

---

## E. Quick live checks

- Open the URL on **phone** and **PC**  
- Go to `/roadmap`, refresh — page should load (SPA fallback)  
- Open a lesson with video — embed should play  
- **Progress** → Export / Import JSON  

---

## F. Friend instructions (copy-paste)

> Open this link: **`<YOUR-VERCEL-URL>`**  
> No app to install. Your progress saves in that browser. To move to another device: **Progress → Export** on the old one, **Import** on the new one.

See also **`FRIEND_ACCESS_GUIDE.md`**.
