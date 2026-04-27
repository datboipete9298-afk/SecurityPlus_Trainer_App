# SecurityPlus Trainer App (SY0-701)

**Canonical project path:** `C:\Users\Petey\Desktop\SecurityPlus_Trainer_App` — see [`ACTIVE_PROJECT_PATH.md`](./ACTIVE_PROJECT_PATH.md). The folder `HeliosII (1)\SecurityPlus_Trainer_App` on the Desktop is **deprecated**; do not open it as the active workspace — all work belongs in the path above.

Local, interactive Security+ study app: **React + TypeScript + Tailwind**, **Vite** (progress in `localStorage`). Aligned to **Professor Messer’s section order** with an **adaptive Smart Coach**, **optional OpenAI tutor** (server-side API), **30-minute session mode**, **quizzes**, **flashcards + spacing**, **brain-book notes**, **weak-area repair**, and **safe simulations**. **AI setup:** [`README_AI_SETUP.md`](./README_AI_SETUP.md).

## Quick start (Windows)

```powershell
cd C:\Users\Petey\Desktop\SecurityPlus_Trainer_App
npm install
npm run dev
```

Open **http://localhost:5173** (Vite will suggest the port; default 5173).

- **AI tutor (optional):** `npm run dev:all` runs Vite + the Express AI server; configure `.env` from `.env.example` (see [`README_AI_SETUP.md`](./README_AI_SETUP.md)).
- **Build:** `npm run build` → static site in `dist/`
- **Preview production:** `npm run preview`
- **Host for a friend (one public link):** see **`DEPLOYMENT_GUIDE.md`** (Vercel / Netlify) and **`FRIEND_ACCESS_GUIDE.md`**
- **Audit / QA:** [`TOP_NOTCH_SYSTEM_MAP.md`](./TOP_NOTCH_SYSTEM_MAP.md) · [`TOP_NOTCH_AUDIT_REPORT.md`](./TOP_NOTCH_AUDIT_REPORT.md) · [`TOP_NOTCH_IMPROVEMENT_PLAN.md`](./TOP_NOTCH_IMPROVEMENT_PLAN.md) · [`FRIEND_READY_CHECKLIST.md`](./FRIEND_READY_CHECKLIST.md) · [`FINAL_PRE_SHARE_CHECKLIST.md`](./FINAL_PRE_SHARE_CHECKLIST.md) · [`FINAL_AUDIT_REPORT.md`](./FINAL_AUDIT_REPORT.md) · [`STUDY_READY_CHECKLIST.md`](./STUDY_READY_CHECKLIST.md) · [`SMOKE_TEST_PLAN.md`](./SMOKE_TEST_PLAN.md) · [`MOBILE_QA_CHECKLIST.md`](./MOBILE_QA_CHECKLIST.md)
- **Master multi-expert review (deep dive):** [`MASTER_EXPERT_REVIEW.md`](./MASTER_EXPERT_REVIEW.md) · [`BEGINNER_EXPERIENCE_REPORT.md`](./BEGINNER_EXPERIENCE_REPORT.md) · [`EXAM_PREP_QUALITY_REPORT.md`](./EXAM_PREP_QUALITY_REPORT.md) · [`LEARNING_SCIENCE_AUDIT.md`](./LEARNING_SCIENCE_AUDIT.md) · [`AI_TUTOR_AUDIT.md`](./AI_TUTOR_AUDIT.md) · [`UX_MOBILE_AUDIT.md`](./UX_MOBILE_AUDIT.md) · [`PRODUCT_RETENTION_AUDIT.md`](./PRODUCT_RETENTION_AUDIT.md) · [`TECHNICAL_QUALITY_AUDIT.md`](./TECHNICAL_QUALITY_AUDIT.md) · [`DATA_CONTENT_INTEGRITY_REPORT.md`](./DATA_CONTENT_INTEGRITY_REPORT.md) · [`PRIVACY_TRUST_AUDIT.md`](./PRIVACY_TRUST_AUDIT.md) · [`DEPLOYMENT_FRIEND_ACCESS_AUDIT.md`](./DEPLOYMENT_FRIEND_ACCESS_AUDIT.md) · [`MASTER_IMPROVEMENT_BACKLOG.md`](./MASTER_IMPROVEMENT_BACKLOG.md) · [`FINAL_MASTER_SCORECARD.md`](./FINAL_MASTER_SCORECARD.md)
- **AI in production:** [`AI_DEPLOYMENT_CHECKLIST.md`](./AI_DEPLOYMENT_CHECKLIST.md) · [`README_AI_SETUP.md`](./README_AI_SETUP.md)

## What’s included (current build)

Validated by `npm run build` (runs data, feedback, training, and video checks before TypeScript + Vite):

| Feature | Status |
|--------|--------|
| Dashboard (streak, XP, level, readiness, **Smart Coach** / `nextStepEngine`) | Yes |
| Full roadmap (Messer-ordered `SECTION_ORDER`) | Yes — **66** full lessons (`hasFullContent`) |
| Lesson view (video, highlights, brain book, traps, quick action, quiz/flash links, hands-on) | Yes — per-lesson labs/sims/decisions validated |
| `/start-here` onboarding + optional **AI tutor** (server-side key) | Yes |
| 30-minute guided session (`/session`) | Yes |
| Quiz engine (MCQ, multi-select where present, scenarios, exam vs study mode) | **717** questions |
| Flashcards + spacing + user cards | **330** built-in + user merges |
| Practice exams A/B/C, PBQ hub + runner | Yes |
| Progress, missed-question journal, domain score, export/import | Yes |
| Weak areas, boss fights, search, simulations | Yes |
| Video mapping | **63** YouTube IDs + **3** explicit “verify URL” slots (see `VIDEO_ALIGNMENT_REPORT.md`) |

## Validators

```powershell
npm run validate:data
npm run validate:feedback
npm run validate:training
npm run validate:videos
npm run validate:ai
npm run validate:ai-integration
```

## Extending content (new sections only)

1. Add lesson blocks in `src/data/lessons.ts` (`hasFullContent: true`, Messer order).
2. Add matching rows in `src/data/quizzes.ts` and `src/data/flashcards.ts`.
3. Update `src/data/sectionOrder.ts` / video maps if new subsection IDs appear.
4. Run `npm run build`.

**Do not reorder** the user’s curriculum — append in Messer order only.

## Adaptive engine (summary)

- **Smart Coach** (`src/core/nextStepEngine.ts` + learning observer): next lesson (hands-on first when needed), thinking alerts, weak domain, last miss, thin notes, spaced cards, boss, then roadmap polish. Each item includes **why** and **three concrete steps**.
- **Legacy / supplemental heuristics** (`src/utils/adaptive.ts`): readiness and related nudges where still referenced.
- **Exam readiness** heuristic: completion + quiz % + cards − missed journal penalty.
- **Domain score** nudges on each quiz record (correct +3, wrong −5 in the question’s domain).
- **Mistake journal**: wrong answers list → Weak Areas page with retry links.
- **Adaptive tutor** (`src/core/adaptiveEngine.ts` + `src/core/feedbackEngine.ts`): miss streak / false-confidence / same-lesson confusion shape tiered explanations, “how to think” patterns, teach-back on key items, 3-miss progression pause, session summary, and practice-exam report block — all persisted via `feedbackLoop` in `src/utils/storage.ts`.

## Safety

All labs in `src/data/labs.ts` are **read-only / local** operations on **your** machine. No steps target third-party systems. Expand only with the same **legal, local** constraint.

## Tech layout

- `src/data/` — curriculum data (TypeScript; could be JSON + import)
- `src/utils/storage.ts` — persisted state
- `src/utils/adaptive.ts` — coach + readiness
- `src/context/ProgressContext.tsx` — app state
- `src/pages/` — UI routes

## What to build next (suggested)

1. **Code-splitting** heavy routes to reduce the main JS chunk (Vite size warning).  
2. **PWA / offline** shell for commute review.  
3. **E2E smoke tests** (Playwright): start-here → lesson → one quiz.  
4. **Fill the 3 video verification slots** when official Messer URLs are confirmed (`validate:videos`).  
5. **Deeper a11y** pass (landmarks, quiz announcements).

---

*Built as a tutor + bootcamp + exam coach. Your job: follow the roadmap in order, run the 30-minute clock, and let the coach pick repairs.*
