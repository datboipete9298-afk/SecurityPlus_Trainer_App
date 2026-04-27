# Friend-Ready Checklist

Use before sending a **public link** to someone non-technical.

## Host & URL

- [ ] Deployed build is latest (`npm run build` clean locally first)
- [ ] SPA routing works (refresh on `/lesson/1-1` does not 404) — **Vercel/Netlify rewrite** configured
- [ ] HTTPS works

## AI (optional)

- [ ] If using tutor: `VITE_AI_API_BASE` points to **your** deployed API
- [ ] OpenAI (or provider) key only on server — **never** in browser bundle
- [ ] Smoke: ask one question → JSON answer or graceful fallback message

## Expectations (tell your friend in one message)

- [ ] “Progress saves in **this browser** — use **Progress → Export** before clearing data or switching devices”
- [ ] “**Readiness %** is from practice in the app — **not** a guarantee you’ll pass CompTIA”
- [ ] “PBQs here are **style practice**, not copies of real exam screens”

## Core path smoke (5 min)

- [ ] Open site → **Start here** (first visit) or **Dashboard**
- [ ] **Continue** / **Next step** goes somewhere sensible
- [ ] Open **one lesson** → video loads or shows verify message
- [ ] **Quiz** → one question → explanation visible in study mode
- [ ] **Practice exams** → **Quick practice (5)** runs

## Mobile

- [ ] Menu opens; **Continue** bar not covering primary CTAs
- [ ] Quiz choices tappable

## Content

- [ ] No HeliosII / old folder confusion — you’re sharing the **Desktop** project build

## Support

- [ ] You know where **Import/Export** is if they lose progress
- [ ] You have a **fallback** if AI is down (app still usable)

---

*Pair with `FRIEND_ACCESS_GUIDE.md` for hosting steps.*
