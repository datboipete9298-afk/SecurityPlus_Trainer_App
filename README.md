# SecurityPlus Trainer App (SY0-701)

**Canonical project path:** `C:\Users\Petey\Desktop\SecurityPlus_Trainer_App` — see [`ACTIVE_PROJECT_PATH.md`](./ACTIVE_PROJECT_PATH.md) (an older copy under `HeliosII` is deprecated; do not use it).

Local, interactive Security+ study app: **React + TypeScript + Tailwind**, **Vite**, **no backend** (progress in `localStorage`). Aligned to **Professor Messer’s section order** with an **adaptive Smart Coach**, **30-minute session mode**, **quizzes**, **flashcards + spacing**, **brain-book notes**, **weak-area repair**, and **safe simulations**.

## Quick start (Windows)

```powershell
cd C:\Users\Petey\Desktop\SecurityPlus_Trainer_App
npm install
npm run dev
```

Open **http://localhost:5173** (Vite will suggest the port; default 5173).

- **Build:** `npm run build` → static site in `dist/`
- **Preview production:** `npm run preview`
- **Host for a friend (one public link):** see **`DEPLOYMENT_GUIDE.md`** (Vercel / Netlify) and **`FRIEND_ACCESS_GUIDE.md`**

## What’s included in MVP

| Feature | Status |
|--------|--------|
| Dashboard (streak, XP, level, readiness, **Smart Coach**) | Yes |
| Full roadmap (Messer-ordered `SECTION_ORDER`) | Yes — open any row; **full lesson body** for 5 IDs only |
| Lesson view (video focus, highlights, brain book, traps, 3-sec, quiz/flash links) | Yes for 5 lessons |
| 30-minute guided session (timer) | Yes |
| Quiz engine (MCQ, scenario, BEST, acronym-style) with explanations | Yes for 5 lessons (10 Q total in data) |
| Flashcards + simple spaced push | Yes |
| Progress, missed-question journal, domain score | Yes |
| Search | Yes (lessons, questions, roadmap) |
| Simulations (starter scenario) | Yes — extend `src/data/simulations.ts` |
| Import docs | `public/content/example-lesson.json` + Import page |
| **Full content for all Messer subsections** | **Not in v1** — add via `lessons.ts` + `quizzes.ts` (same shapes) |

## Five completed sample lessons (IDs)

1. `1-1` — Security Controls  
2. `1-2-cia` — CIA Triad  
3. `1-2-nr` — Non-repudiation  
4. `1-2-aaa` — AAA  
5. `1-2-zt` — Zero Trust  

**Unlock rule (MVP chain):** complete `1-1` before `1-2-cia`, etc. Other roadmap items open a **“add content”** page until you add matching entries.

## How to add the rest of Messer’s notes

1. Copy a full block from `src/data/lessons.ts` and change `id`, `title`, `order`, and all string fields. Set `hasFullContent: true`.
2. Add quiz rows in `src/data/quizzes.ts` with `lessonId` matching the lesson.
3. Add flashcards in `src/data/flashcards.ts` with the same `lessonId`.
4. Optional: add `src/data/sectionOrder.ts` line if you split a sub-topic not already listed.
5. Run `npm run build` to verify types.

**Do not change section order** in the user’s curriculum — append in Messer order only.

## Adaptive engine (summary)

- **Smart Coach** (`src/utils/adaptive.ts`): next lesson, last miss, low domain, lab nudge. Each item includes **“Why”**.
- **Exam readiness** heuristic: completion + quiz % + cards − missed journal penalty.
- **Domain score** nudges on each quiz record (correct +3, wrong −5 in the question’s domain).
- **Mistake journal**: wrong answers list → Weak Areas page with retry links.

## Safety

All labs in `src/data/labs.ts` are **read-only / local** operations on **your** machine. No steps target third-party systems. Expand only with the same **legal, local** constraint.

## Tech layout

- `src/data/` — curriculum data (TypeScript; could be JSON + import)
- `src/utils/storage.ts` — persisted state
- `src/utils/adaptive.ts` — coach + readiness
- `src/context/ProgressContext.tsx` — app state
- `src/pages/` — UI routes

## What to build next (suggested)

1. **More lessons** in Messer order (largest value).  
2. **Mistake → auto-flashcard** from missed `questionId` (clone template from answer explanation).  
3. **PWA / desktop wrap** for offline.  
4. **CSV import** from your Anki/notes export.  
5. **Boss fight** UI wired to `BOSSES` in `adaptive.ts` (triggers on domain mastery).

---

*Built as a tutor + bootcamp + exam coach. Your job: follow the roadmap in order, run the 30-minute clock, and let the coach pick repairs.*
