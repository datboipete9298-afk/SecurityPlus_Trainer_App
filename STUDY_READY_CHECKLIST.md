# Study-ready checklist — Security+ Trainer

Use this after code changes or before sharing with a friend. **Project:** `C:\Users\Petey\Desktop\SecurityPlus_Trainer_App`

## Automated (run every release)

```powershell
cd C:\Users\Petey\Desktop\SecurityPlus_Trainer_App
npm install
npm run validate:data
npm run validate:feedback
npm run validate:training
npm run validate:videos
npm run validate:ai
npm run validate:ai-integration
npm run build
```

- [ ] All commands exit **0**
- [ ] Note any Vite **chunk size** warnings (informational)

---

## 1. First-time user test

- [ ] Open `/start-here` — purpose, Messer alignment, and “Start my first lesson” are clear
- [ ] First lesson loads: video or explicit fallback + playlist / Messer index links
- [ ] Marking progress updates dashboard without console errors

---

## 2. Lesson flow test

- [ ] Watch or open video → highlight / note guidance visible
- [ ] Hands-on section: labs/sims/decision complete without unsafe instructions
- [ ] Links to quiz and flashcards for same `lessonId` work
- [ ] **Continue** / Smart Coach suggests a sensible next URL

---

## 3. Video test

- [ ] Embedded player is responsive (narrow browser width)
- [ ] Sections **2-0**, **5-0**, **5-grc** show honest “needs URL” / index fallback (see `VIDEO_ALIGNMENT_REPORT.md`)
- [ ] No console errors from bad iframe src

---

## 4. Quiz test

- [ ] Study mode: explanations available after answering
- [ ] Exam mode: no premature AI assist; review phase behaves as expected
- [ ] Wrong answers feed weak areas / missed journal where applicable
- [ ] Multi-select (if present in set) grades correctly

---

## 5. Practice exam test

- [ ] Start exam A, B, or C; submit; attempt saved in history
- [ ] Domain breakdown or readiness updates
- [ ] Switching exam mode vs study mode matches expectations

---

## 6. PBQ test

- [ ] Open PBQ hub → runner
- [ ] Can complete or exit without breaking navigation
- [ ] Progress / weak signals update (spot-check Progress page)

---

## 7. Flashcard test

- [ ] Due cards appear when spaced items mature
- [ ] Add card from miss (if UI offers) persists after refresh
- [ ] Lesson query filter (`?lesson=`) works if implemented

---

## 8. AI tutor test

- [ ] With **dev:all** + valid `.env`: panel returns structured help
- [ ] With **no key**: graceful fallback, no crash, no key in browser bundle
- [ ] During **exam lock**: panel shows lock message, no live API dependency for grading

---

## 9. No-API-key fallback test

- [ ] `npm run dev` only (no server): app usable; AI shows offline / configure messaging
- [ ] Smart Coach still recommends next steps

---

## 10. Progress export / import test

- [ ] Export produces a file or clipboard payload (per UI)
- [ ] Import restores completions / cards on same browser profile
- [ ] **Reset** requires confirmation and clears expected keys

---

## 11. Mobile test

Use **`MOBILE_QA_CHECKLIST.md`** for phone/tablet/desktop detail. Minimum:

- [ ] Hamburger / nav usable one-handed
- [ ] Sticky **Continue** does not cover critical buttons
- [ ] Quiz and PBQ controls are tappable (no tiny hit targets)
- [ ] AI panel scrolls; keyboard does not hide send button permanently

---

## 12. Deployment test

- [ ] `npm run build` → deploy `dist/` per `DEPLOYMENT_GUIDE.md`
- [ ] Deep link refresh works (e.g. `/roadmap`, `/quiz/...`) on host
- [ ] Production AI (if used): env vars set; CORS / proxy matches `vite` + server docs
- [ ] Friend opens **one URL** only — `FRIEND_ACCESS_GUIDE.md`

---

## Sign-off

| Date | Tester | Device | Pass |
|------|--------|--------|------|
|      |        |        |      |
