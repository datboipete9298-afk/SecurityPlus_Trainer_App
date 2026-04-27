# Smoke test plan (manual or future Playwright)

Run against **`npm run preview`** (after `npm run build`) or production URL. No Playwright dependency is required today — this document is the repeatable script; automation can map 1:1 later.

**Timebox:** ~25–35 minutes full pass; ~8 minutes critical path.

---

## Environment

- [ ] Fresh profile **or** note existing `localStorage` state
- [ ] Optional: second run with **no** `dev:server` / no AI key (fallback mode)

---

## 1. Start here

1. Open `/start-here`.
2. **Expect:** Purpose of app, Messer alignment, AI optional, link to first lesson.
3. Click **Start my first lesson** (or equivalent).
4. **Expect:** Lesson loads; no console errors.

---

## 2. First lesson

1. From roadmap or start-here, open **`/lesson/1-0`** (or first lesson in path).
2. **Expect:** Video area or honest fallback; highlight / note guidance present.
3. Scroll to quiz link; open **`/quiz/1-0`** (adjust id to match lesson).
4. **Expect:** Answer one question; study mode shows rationale if enabled.

---

## 3. Quiz (generic)

1. Complete or exit a mini-quiz.
2. **Expect:** Wrong answer can land in weak/missed journal (check `/weak` or Progress).

---

## 4. Practice exam

1. Open **`/practice-exams`**.
2. Start one Messer exam in **exam** mode.
3. **Expect:** AI locked during timed/active exam behavior per app rules.
4. Submit or exit to review; **Expect:** attempt appears in history (`/progress`).

---

## 5. PBQ

1. Open **`/practice-exams/pbq`** → pick a scenario.
2. Submit **wrong** order once → **Expect:** domain/journal miss (Progress → PBQ misses).
3. Submit **correct** order → **Expect:** XP on first-ever pass for that scenario, Progress shows pass count increased, miss cleared for that PBQ id if it was logged (retries after pass do not re-award the same XP bump).

---

## 6. AI fallback

1. Run **frontend only** (no API server) **or** block `/api` in devtools.
2. Open Dashboard or Lesson AI panel; send a prompt.
3. **Expect:** Graceful fallback text; app does not crash; no API key in client bundle (spot-check sources).

---

## 7. Progress export / import

1. **`/progress`** (or Import page per UI): **Export** JSON.
2. Optional: **Reset** progress (confirm dialog) or use private window.
3. **Import** the file.
4. **Expect:** Restored completions/cards match export (within documented limits).

---

## 8. Dashboard “lost user” check

1. Reset or use low-progress state (`completedLessons` &lt; 4).
2. Open **`/`** (dashboard).
3. **Expect:** “Start here → First lesson → Quiz → Review” ribbon visible; links work.

---

## Critical path (minimum before sharing a link)

1. Start here → first lesson → one quiz question  
2. PBQ wrong then right  
3. Progress export → import  
4. Mobile width: one quiz + one video  

---

## Future Playwright mapping (optional)

| Step | Suggested selector / route |
|------|----------------------------|
| Start | `page.goto('/start-here')` |
| Lesson | `getByRole('link', { name: /first lesson/i })` or direct `goto` |
| Quiz | `goto('/quiz/1-0')` |
| PBQ | `goto('/practice-exams/pbq')` then first scenario link |

Record video on first green run for regression comparison.
