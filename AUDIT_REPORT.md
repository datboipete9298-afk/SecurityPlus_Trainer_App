# Security+ Trainer — AUDIT_REPORT

Audit date: 2026-04-25 · App root: `SecurityPlus_Trainer_App` (Desktop). Sources inspected: `src/`, `scripts/`, `package.json`.

## 1. Architecture summary

- **Stack:** React 18, Vite 5, TypeScript, React Router 6, Tailwind.
- **State:** `ProgressContext` + `localStorage` key `spt_v1_state` (`storage.ts`, schema v3). Corrupt snapshots are copied to `spt_v1_state_corrupt_*` before falling back to defaults (no silent wipe of good data).
- **Curriculum:** `SECTION_ORDER` drives order; `lessons` merges `lessonsBase`, extended domains, outlines, and **`messerLessons`** (practice exam stubs only). `VIDEO_MAP` is generated per section with `KNOWN_YT` + Messer slugs.
- **Assessments:** `quizzes.ts` merges manual + generated lesson questions + **Messer A/B/C** rows via `rowsToQuestions`. `QuizPage` supports single- and multi-select; practice exams add **Exam mode** (defer explanations) vs **Study mode** (immediate feedback).
- **Coach / flow:** `nextStepEngine.ts`, `learningFlow.ts`, `adaptive.ts` feed dashboard “Continue” and Smart Coach copy.

## 2. Route map

| Path | Page |
|------|------|
| `/` | `HomeGate` → `/start-here` if onboarding, else `Dashboard` |
| `/start-here` | `StartHere` |
| `/watch/:id` | `WatchLesson` |
| `/roadmap` | `Roadmap` |
| `/lesson/:id` | `LessonPage` |
| `/practice` | `PracticePage` |
| `/practice-exams` | `PracticeExamsPage` (hub) |
| `/practice-exams/pbq` | `PracticePbqHubPage` |
| `/pbq/:id` | `PbqRunnerPage` |
| `/progress` | `ProgressPage` |
| `/session` | `Session30` |
| `/quiz/:id` | `QuizPage` (lessons + `messer-exam-*`) |
| `/flashcards`, `/weak`, `/search`, `/sim`, `/import`, `/boss`, `/boss/:id` | Existing feature pages |

## 3. Data map

- **Order / lessons:** `sectionOrder.ts`, `lessons.ts`, `lessonsBase.ts`, `domain1Extended.ts`, `domain2Bulk.ts`, `outlineLessons.ts`, `messerLessons.ts`
- **Video:** `videoMap.ts`, `knownYoutubeIds.ts`, `videoConstants.ts`
- **Quizzes:** `quizzes.ts`, `quizGenerator.ts`, `messer/*.ts`
- **Cards / labs / bosses:** `flashcards.ts`, `labs.ts`, `bossFights.ts`, `simulations.ts`
- **PBQ drills:** `pbqCatalog.ts` (original ordering labs; not exam UI clones)

## 4. Learning flow

Intended chain: **Watch** (`/watch`) → **Highlight / notes** (`LessonPage`, Brain Book) → **Quiz** → **Flashcards / weak** → **Practice exams** → **PBQ labs**. `nextStepEngine` prioritizes incomplete lesson steps; practice exams additionally write `practiceExamAttempts` and quiz stats for readiness.

## 5. Question banks

- **Lesson bank:** Manual + generated (minimum fill per full lesson) — see `QUESTION_BANK_AUDIT.md`.
- **Messer:** 85 + 85 + 85 rows imported; merged into `allQuestions()` with dedupe by id.

## 6. Video map status

- **66** `SECTION_ORDER` entries; **63** with playlist-backed ids in `knownYoutubeIds.ts`.
- **3** verification-only slots: `2-0`, `5-0`, `5-grc` (`needsVideoUrl: true`, course index links).
- Details: `VIDEO_ALIGNMENT_REPORT.md` (regenerated on `npm run validate:videos`).

## 7. Weak areas

- **PBQ labs** are ordering-only in v1; richer drag/drop can follow (`FEATURE_ROADMAP.md`).
- **Exam mode** resume is sessionStorage-only (by design); history is in `practiceExamAttempts`.
- **Globally unique Messer row ids** are required across A/B/C (validator enforces).

## 8. Broken / confusing behavior (addressed this pass)

- Desktop app previously had **no** Messer rows in-repo; exams are now copied and merged.
- **Multi-select** Messer items would have graded wrong in single-select UI; fixed in `QuizPage` + `correctIndices` on `QuizQuestion`.
- **Flashcard backs** for multi-select showed only `correctIndex`; now uses `correctAnswerLabel()`.

## 9. Missing features (still roadmap)

- Timed exam clock, per-question flag/bookmark, full spaced-repetition overhaul — see `FEATURE_ROADMAP.md`.

## 10. High-value upgrades

- Today’s study plan / streak UI tied to `practiceExamAttempts` + lesson progress.
- Session summary modal after exam review.
- Export “exam readiness” PDF / copy for study group.
